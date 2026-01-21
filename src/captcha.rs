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
                .json(serde_json::json!({
                    "ok": false,
                    "error": "RECAPTCHA_SECRET no definida"
                }));
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
                HttpResponse::Ok().json(serde_json::json!({
                    "ok": true
                }))
            } else {
                HttpResponse::Unauthorized().json(serde_json::json!({
                    "ok": false,
                    "error": "Captcha inválido"
                }))
            }
        }
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({
            "ok": false,
            "error": "Error verificando captcha"
        })),
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
            // Sirve TODO lo que esté en /static
            .service(
                Files::new("/", "./static")
                    .index_file("index.html"),
            )
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
