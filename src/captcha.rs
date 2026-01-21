use actix_web::{post, web, HttpRequest, HttpResponse};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;
use chrono::{Utc, Duration};
use std::env;

#[derive(Deserialize)]
pub struct CaptchaRequest {
    pub token: String,
}

#[post("/captcha/verify")]
pub async fn verify_captcha(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    body: web::Json<CaptchaRequest>,
) -> HttpResponse {

    let secret = env::var("RECAPTCHA_SECRET").unwrap();

    let client = reqwest::Client::new();
    let res = client
        .post("https://www.google.com/recaptcha/api/siteverify")
        .form(&[
            ("secret", secret),
            ("response", body.token.clone()),
        ])
        .send()
        .await;

    let resp = match res {
        Ok(r) => r,
        Err(_) => return HttpResponse::InternalServerError().finish(),
    };

    let json: serde_json::Value = resp.json().await.unwrap();

    if json["success"].as_bool().unwrap_or(false) {

        // 🔐 Datos a guardar
        let token = Uuid::new_v4();
        let code = Uuid::new_v4().to_string()[..6].to_uppercase();
        let ip = req
            .peer_addr()
            .map(|a| a.ip().to_string())
            .unwrap_or("unknown".into());

        let created_at = Utc::now();
        let expires_at = created_at + Duration::minutes(10);

        // 🧠 INSERT
        if let Err(e) = sqlx::query(
            r#"
            INSERT INTO captcha (token, code, ip, created_at, expires_at, used)
            VALUES ($1, $2, $3, $4, $5, false)
            "#
        )
        .bind(&token)
        .bind(&code)
        .bind(&ip)
        .bind(created_at)
        .bind(expires_at)
        .execute(pool.get_ref())
        .await
        {
            eprintln!("DB error: {:?}", e);
            return HttpResponse::InternalServerError().finish();
        }

        return HttpResponse::Ok().json(serde_json::json!({
            "ok": true,
            "code": code
        }));
    }

    HttpResponse::Unauthorized().json(serde_json::json!({
        "ok": false
    }))
}
