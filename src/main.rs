mod contact;
mod carousel;
mod projects;

use actix_files::Files;
use actix_web::{web, App, HttpResponse, HttpServer, middleware::Logger};
use sqlx::postgres::PgPoolOptions;
use std::env;
use std::io::{Write}; // Para forzar el log

use carousel::{upload_image, list_images, get_image};
use contact::save_contact;

async fn health() -> HttpResponse {
    HttpResponse::Ok().body("OK")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Forzamos la salida de logs iniciales
    println!("🚀 INICIANDO PROCESO DE DEPLOY...");
    std::io::stdout().flush()?; 

    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .expect("PORT debe ser un número");

    let db_url = env::var("DATABASE_URL").ok();

    // Intentamos conectar, pero no dejamos que el error mate el hilo principal
    let pool = if let Some(url) = db_url {
        println!("🔗 DATABASE_URL detectada, conectando...");
        match PgPoolOptions::new()
            .max_connections(5)
            .acquire_timeout(std::time::Duration::from_secs(3)) // No esperar demasiado
            .connect(&url)
            .await
        {
            Ok(p) => {
                println!("🗄️  DB CONECTADA");
                Some(p)
            }
            Err(e) => {
                eprintln!("❌ ERROR DB (Ignorado para permitir arranque): {e}");
                None
            }
        }
    } else {
        println!("⚠️  DATABASE_URL no configurada");
        None
    };

    println!("🌐 Intentando bind en puerto: {}", port);
    std::io::stdout().flush()?;

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default()) // Activa logs de peticiones
            .app_data(web::Data::new(pool.clone()))
            .route("/health", web::get().to(health))
            .service(save_contact)
            .service(upload_image)
            .service(list_images)
            .service(get_image)
            .service(projects::list_projects)
            .service(projects::get_project)
            .service(projects::create_project)
            .service(projects::update_project)
            .service(projects::delete_project)
            .service(Files::new("/images", "./static/images"))
            .service(Files::new("/", "./static").index_file("index.html"))
            .default_service(web::route().to(|| async {
                HttpResponse::Found()
                    .append_header(("Location", "/error.html"))
                    .finish()
            }))
    })
    .bind(("0.0.0.0", port))? // Escuchar en todas las interfaces
    .run()
    .await
}