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
    let secret = env::var("RECAPTCHA_SECRET")
        .expect("RECAPTCHA_SECRET no definida");

    let client = reqwest::Client::new();

    let resp = client
        .post("https://www.google.com/recaptcha/api/siteverify")
        .form(&[
            ("secret", secret),
            ("response", body.token.clone()),
        ])
        .send()
        .await;

    match resp {
        Ok(r) => {
            let json: serde_json::Value = r.json().await.unwrap();
            if json["success"].as_bool().unwrap_or(false) {
                HttpResponse::Ok().json("Captcha válido")
            } else {
                HttpResponse::Unauthorized().json("Captcha inválido")
            }
        }
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

#[actix_web::main]   // 👈 ESTE MACRO ES LA CLAVE
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok();

    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8080".into())
        .parse()
        .expect("PORT inválido");

    println!("🚀 Servidor en 0.0.0.0:{port}");

    HttpServer::new(|| {
        App::new()
            .service(health)
            .service(verify_captcha)
            .service(
                Files::new("/", "./static")
                    .index_file("index.html"),
            )
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
