use actix_web::{App, HttpServer, web};
use sqlx::PgPool;
use std::env;

mod captcha;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL missing");
    let pool = PgPool::connect(&database_url).await.unwrap();

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .service(captcha::verify_captcha)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
