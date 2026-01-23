mod contact;
mod carousel;

use actix_files::Files;
use actix_web::{get, web, App, HttpResponse, HttpServer};
use sqlx::postgres::PgPoolOptions;
use std::env;

use contact::save_contact;
use carousel::upload_image;

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
    dotenvy::dotenv().ok();

    // ✅ Railway PORT
    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .expect("PORT inválido");

    // ✅ BD OPCIONAL
    let pool = match env::var("DATABASE_URL") {
        Ok(database_url) => {
            println!("🗄️ Base de datos configurada");
            Some(
                PgPoolOptions::new()
                    .max_connections(5)
                    .connect_lazy(&database_url)
                    .expect("Pool inválido"),
            )
        }
        Err(_) => {
            println!("⚠️ DATABASE_URL no definida (formulario deshabilitado)");
            None
        }
    };

    println!("🚀 Servidor escuchando en puerto {port}");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .service(health)
            .service(error_page)
            .service(save_contact)
            .service(upload_image)

            // 📂 imágenes del carrusel
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
