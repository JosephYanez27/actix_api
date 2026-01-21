use actix_files::Files;
use actix_web::{App, HttpServer};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".into())
        .parse()
        .unwrap();

    HttpServer::new(|| {
        App::new()
            .service(
                Files::new("/", "./static")
                    .index_file("index.html")
            )
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
