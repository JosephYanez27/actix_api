use actix_web::{get, App, HttpServer, Responder};
use dotenvy::dotenv;

mod db; // 👈 nuevo

#[get("/")]
async fn hello() -> impl Responder {
    "Hola desde Actix Web"
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok(); // 👈 carga .env

    let pool = db::connect_db().await;
    println!("✅ Conectado a SQL Server");

    HttpServer::new(move || {
        App::new()
            .app_data(actix_web::web::Data::new(pool.clone())) // 👈 inyecta pool
            .service(hello)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
