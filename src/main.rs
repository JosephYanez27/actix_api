mod contact;
mod carousel;
mod projects;

use actix_files::Files;
use actix_web::{
    web, App, HttpResponse, HttpServer,
    middleware::Logger
};
use sqlx::postgres::PgPoolOptions;
use std::env;
use std::io::Write;

use carousel::{upload_image, list_images, get_image};
use contact::save_contact;

async fn health() -> HttpResponse {
    HttpResponse::Ok().body("OK")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {

    println!("🚀 INICIANDO SERVIDOR...");
    std::io::stdout().flush()?;

    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .expect("PORT debe ser numérico");

    let db_url = env::var("DATABASE_URL").ok();

    // 🔗 Intentar conectar DB sin matar servidor
    let pool = if let Some(url) = db_url {
        println!("🔗 Conectando a la base de datos...");
        match PgPoolOptions::new()
            .max_connections(5)
            .acquire_timeout(std::time::Duration::from_secs(3))
            .connect(&url)
            .await
        {
            Ok(p) => {
                println!("🗄️  DB CONECTADA");
                Some(p)
            }
            Err(e) => {
                eprintln!("❌ ERROR DB (modo sin DB): {e}");
                None
            }
        }
    } else {
        println!("⚠️ DATABASE_URL no configurada");
        None
    };

    println!("🌐 Servidor escuchando en puerto {}", port);
    std::io::stdout().flush()?;

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .app_data(web::Data::new(pool.clone()))

            // 🔹 HEALTH CHECK
            .route("/health", web::get().to(health))

            // 🔹 API SCOPE (TODO JSON)
            .service(
                web::scope("/api")

                    // CONTACTOS
                    .service(contact::list_contacts)
                    .service(contact::get_contact)
                    .service(contact::update_contact)
                    .service(contact::delete_contact)

                    // PROYECTOS
                    .service(projects::list_projects)
                    .service(projects::get_project)
                    .service(projects::create_project)
                    .service(projects::update_project)
                    .service(projects::delete_project)
            )

            // 🔹 POST contacto fuera de scope
            .service(save_contact)

            // 🔹 CAROUSEL
            .service(upload_image)
            .service(list_images)
            .service(get_image)

            // 🔹 IMÁGENES
            .service(Files::new("/images", "./static/images"))

            // 🔹 FRONTEND
            .service(
                Files::new("/", "./static")
                    .index_file("index.html")
            )

            // 🔹 PANTALLA DE ERROR (SE MANTIENE)
            .default_service(web::route().to(|| async {
                HttpResponse::Found()
                    .append_header(("Location", "/error.html"))
                    .finish()
            }))
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}