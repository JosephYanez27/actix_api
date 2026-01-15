use sqlx::{PgPool, postgres::PgPoolOptions};
use std::env;

pub async fn connect_db() -> PgPool {
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL no definida");

    PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Error conectando a la DB")
}
