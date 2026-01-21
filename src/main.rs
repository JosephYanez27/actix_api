mod captcha;

use actix_files::Files;
use actix_web::{get, App, HttpResponse, HttpServer};
use std::env;

// 👇 IMPORTANTE
use crate::captcha::verify_captcha;

#[get("/health")]
async fn health() -> HttpResponse {
    HttpResponse::Ok().body("OK")
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
            .service(health)
            .service(verify_captcha)
            .service(Files::new("/", "./static").index_file("index.html"))
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
