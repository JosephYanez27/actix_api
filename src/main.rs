use actix_files::Files;
use actix_web::{get, post, web, App, HttpResponse, HttpServer};
use serde::Deserialize;
use std::env;

#[derive(Deserialize)]
struct CaptchaRequest {
    token: String,
}

#[get("/health")]
async fn health() -> HttpResponse {
    HttpResponse::Ok().body("OK")
}

#[post("/captcha/verify")]
async fn verify_captcha(body: web::Json<CaptchaRequest>) -> HttpResponse {
    let secret = match env::var("RECAPTCHA_SECRET") {
        Ok(v) => v,
        Err(_) => {
            return HttpResponse::InternalServerError()
                .json("RECAPTCHA_SECRET no definida");
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
            let json: serde_json::Value = resp.json().await.unwrap();

            if json["success"].as_bool().unwrap_or(false) {
                HttpResponse::Ok().json("Captcha válido")
            } else {
                HttpResponse::Unauthorized().json("Captcha inválido")
            }
        }
        Err(_) => HttpResponse::InternalServerError().json("Error verificando captcha"),
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok();

    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .expect("PORT inválido");

    println!("🚀 Servidor corriendo en 0.0.0.0:{port}");

    HttpServer::new(|| {
        App::new()
            .service(health)
            .service(verify_captcha)
          Files::new("/static", "./static")

    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
