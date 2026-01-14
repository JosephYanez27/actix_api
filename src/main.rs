use actix_web::{get, App, HttpServer, Responder};
use std::env;

#[get("/")]
async fn hello() -> impl Responder {
    "Hola desde Actix Web 🚀"
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok(); // local ok, en Railway no estorba

    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .expect("PORT debe ser un número");

    println!("🚀 Escuchando en 0.0.0.0:{port}");

    HttpServer::new(|| {
        App::new()
            .service(hello)
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
