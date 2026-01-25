mod contact;
mod carousel;
use actix_files::Files;
use actix_web::{get, web, App, HttpResponse, HttpServer};
use sqlx::postgres::PgPoolOptions;
use std::env;
use carousel::{upload_image, list_images, get_image};
use contact::save_contact;
async fn favicon() -> HttpResponse {
    HttpResponse::NoContent().finish()
}

#[get("/health")]
async fn health() -> HttpResponse {
    HttpResponse::Ok().body("OK")
}

#[get("/error")]
async fn error_page() -> HttpResponse {
    HttpResponse::Ok()
        .content_type("text/html")
        .body(include_str!("../static/error.html"))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok(); let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .expect("PORT inválido");

    // ✅ CONEXIÓN REAL A BD
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL no configurada");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("No se pudo conectar a Postgres");

    println!("🗄️ BD conectada");
    println!("🚀 Servidor en puerto {port}");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .service(health)
            .service(error_page)
            .service(save_contact)
            .service(upload_image)
            .service(list_images)
            .service(get_image)

            // 📂 imágenes estáticas
            .service(Files::new("/images", "./static/images"))

            // 🌐 frontend
            .service(Files::new("/", "./static").index_file("index.html"))

            // 🧩 favicon
            .service(web::resource("/favicon.ico").to(favicon))

            // 🚑 fallback
            .default_service(
                web::route().to(|| async {
                    HttpResponse::Found()
                        .append_header(("Location", "/error"))
                        .finish()
                }),
            )
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
