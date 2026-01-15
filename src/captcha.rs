use actix_web::{post, web, HttpResponse};
use serde::Deserialize;
use std::env;

#[derive(Deserialize)]
pub struct RecaptchaResponse {
    pub success: bool,
    pub score: Option<f32>,
}

#[post("/captcha/verify")]
pub async fn verify_captcha(
    body: web::Json<serde_json::Value>
) -> HttpResponse {

    let token = body["token"].as_str().unwrap_or("");

    let secret = env::var("RECAPTCHA_SECRET")
        .expect("RECAPTCHA_SECRET no definida");

    let client = reqwest::Client::new();

    let res = client
        .post("https://www.google.com/recaptcha/api/siteverify")
        .form(&[
            ("secret", secret),
            ("response", token.to_string()),
        ])
        .send()
        .await;

    if let Ok(resp) = res {
        let json: RecaptchaResponse = resp.json().await.unwrap();

        if json.success {
            return HttpResponse::Ok().json("Captcha válido");
        }
    }

    HttpResponse::Unauthorized().json("Captcha inválido")
}
