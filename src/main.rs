mod contact;
mod carousel;

use actix_files::Files;
use actix_web::{web, App, HttpResponse, HttpServer};
use sqlx::postgres::PgPoolOptions;
use std::env;

use carousel::{upload_image, list_images, get_image};
use contact::save_contact;

// Saludamos al sistema
async fn health() -> HttpResponse {
    HttpResponse::Ok().body("OK")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Cargar variables de entorno si usas un archivo .env
    // dotenv::dotenv().ok(); 

    println!("✅ Iniciando Solid Software Server...");

    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .expect("PORT debe ser un número válido");

    println!("🌐 Servidor escuchando en: http://0.0.0.0:{port}");

    // Configuración de la Base de Datos
    let pool = match env::var("DATABASE_URL") {
        Ok(url) => {
            println!("🔗 Intentando conectar a la DB...");
            match PgPoolOptions::new()
                .max_connections(5)
                .connect(&url)
                .await
            {
                Ok(p) => {
                    println!("🗄️  Base de datos conectada con éxito");
                    Some(p)
                }
                Err(e) => {
                    eprintln!("❌ Error crítico al conectar la DB: {e}");
                    None
                }
            }
        }
        Err(_) => {
            println!("⚠️  DATABASE_URL no configurada. Las APIs de DB no funcionarán.");
            None
        }
    };

    HttpServer::new(move || {
        App::new()
            // Inyectar el pool de la DB (clonamos el Option)
            .app_data(web::Data::new(pool.clone()))

            // 1. Endpoints de utilidad
            .route("/health", web::get().to(health))

            // 2. APIs (Deben ir ANTES de los archivos estáticos)
            .service(save_contact)
            .service(upload_image)
            .service(list_images)
            .service(get_image)

            // 3. Archivos Estáticos de Imágenes
            // Asegúrate de que la carpeta ./static/images existe
            .service(Files::new("/images", "./static/images").show_files_listing())

            // 4. Servidor de Archivos Frontend
            // Maneja el index.html automáticamente en la raíz "/"
            .service(Files::new("/", "./static").index_file("index.html"))

            // 5. Fallback - Manejo de errores 404 (Redirección a error.html)
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