use actix_web::{post, web, HttpResponse};
use serde::Deserialize;
use std::env;

#[derive(Deserialize)]
pub struct CaptchaRequest {
    pub token: String,
}

#[post("/captcha/verify")]
pub async fn verify_captcha(
    body: web::Json<CaptchaRequest>,
) -> HttpResponse {
    let secret = match env::var("RECAPTCHA_SECRET") {
        Ok(v) => v,
        Err(_) => {
            return HttpResponse::InternalServerError()
                .body("RECAPTCHA_SECRET no definida");
        }
    };

    let client = reqwest::Client::new();

    let res = client
        .post("https://www.google.com/recaptcha/api/siteverify")
        .form(&[
            ("secret", secret),
            ("response", body.token.clone()),
        ])
        .send()
        .await;

    match res {
        Ok(resp) => {
            let json: serde_json::Value = match resp.json().await {
                Ok(j) => j,
                Err(_) => {
                    return HttpResponse::InternalServerError()
                        .body("Respuesta inválida de Google");
                }
            };

            if json["success"].as_bool().unwrap_or(false) {
                HttpResponse::Ok().body("Captcha válido")
            } else {
                // 👇 DEVOLVEMOS EL ERROR REAL
                HttpResponse::Unauthorized().json(json)
            }
        }
        Err(_) => HttpResponse::InternalServerError()
            .body("Error verificando captcha"),
    }
}
