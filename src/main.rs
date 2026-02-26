mod contact;
mod carousel;
mod projects;

use actix_files::Files;
use actix_web::{web, App, HttpResponse, HttpServer, middleware::Logger};
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use std::env;

use carousel::{upload_image, list_images, get_image};
use contact::save_contact;

async fn health() -> HttpResponse {
    HttpResponse::Ok().body("OK")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {

    println!("🚀 INICIANDO SERVIDOR...");

    // Puerto (Render lo inyecta automáticamente)
    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .expect("PORT debe ser un número válido");

    // 🔥 OBLIGAMOS a que exista DATABASE_URL
    let database_url = env::var("DATABASE_URL")
        .expect("❌ DATABASE_URL no configurada en el entorno");

    println!("🔗 Conectando a la base de datos...");

    // 🔥 Si falla la conexión, la app no arranca (como debe ser en producción)
    let pool: PgPool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("❌ No se pudo conectar a la base de datos");

    println!("🗄️ Base de datos conectada correctamente");
    println!("🌐 Servidor corriendo en puerto: {}", port);

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .app_data(web::Data::new(pool.clone()))

            // Health check
            .route("/health", web::get().to(health))

            // Contact
            .service(save_contact)

            // Carousel
            .service(upload_image)
            .service(list_images)
            .service(get_image)

            // Projects API
            .service(projects::list_projects)
            .service(projects::get_project)
            .service(projects::create_project)
            .service(projects::update_project)
            .service(projects::delete_project)

            // Archivos estáticos
            .service(Files::new("/images", "./static/images"))
            .service(Files::new("/", "./static").index_file("index.html"))

            // Ruta por defecto
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