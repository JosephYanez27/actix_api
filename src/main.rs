use actix_files::Files;
use actix_web::{get, post, web, App, HttpResponse, HttpServer};
use serde::Deserialize;
use std::env;

#[derive(Deserialize)]
struct CaptchaRequest {
    token: String,
}

#[get("/")]
async fn index() -> HttpResponse {
    HttpResponse::Ok()
        .content_type("text/html")
        .body(include_str!("../static/index.html"))
}

#[get("/health")]
async fn health() -> HttpResponse {
    HttpResponse::Ok().body("OK")
}

#[post("/captcha/verify")]
async fn verify_captcha(body: web::Json<CaptchaRequest>) -> HttpResponse {
    let secret = env::var("RECAPTCHA_SECRET")
        .expect("RECAPTCHA_SECRET no definida");

    let client = reqwest::Client::new();

    let res = client
        .post("https://www.google.com/recaptcha/api/siteverify")
        .form(&[
            ("secret", secret),
            ("response", body.token.clone()),
        ])
        .send()
        .await;

    if let Ok(resp) = res {
        let json: serde_json::Value = resp.json().await.unwrap();
        if json["success"].as_bool().unwrap_or(false) {
            return HttpResponse::Ok().json("Captcha válido");
        }
    }

    HttpResponse::Unauthorized().json("Captcha inválido")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok();

    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .expect("PORT inválido");

    HttpServer::new(|| {
        App::new()
            .service(index)
            .service(health)
            .service(verify_captcha)
            .service(Files::new("/static", "./static"))
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
