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

#[actix_web::main]
async fn main() -> std::io::Result<()> {

    println!("✅ Iniciando app...");

    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .unwrap();

    println!("🌐 Puerto: {port}");

    let pool = match env::var("DATABASE_URL") {
        Ok(url) => {
            println!("🔗 Conectando DB...");
            match PgPoolOptions::new()
                .max_connections(5)
                .connect(&url)
                .await
            {
                Ok(p) => {
                    println!("🗄️ DB conectada");
                    Some(p)
                }
                Err(e) => {
                    eprintln!("❌ Error DB: {e}");
                    None
                }
            }
        }
        Err(_) => {
            println!("⚠️ DATABASE_URL no configurada");
            None
        }
    };

HttpServer::new(move || {
    App::new()
        .app_data(web::Data::new(pool.clone()))

        .service(health)

        // 📌 APIs
        .service(save_contact)
        .service(upload_image)
        .service(list_images)
        .service(get_image)

        // 🧩 favicon (ANTES)
        .service(web::resource("/favicon.ico").to(favicon))

        // 📂 archivos estáticos
        .service(Files::new("/images", "./static/images"))
        .service(Files::new("/", "./static").index_file("index.html"))

        // 🚑 fallback
        .default_service(
            web::route().to(|| async {
                HttpResponse::Found()
                    .append_header(("Location", "/error.html"))
                    .finish()
            }),
        )
})
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
