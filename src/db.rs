use sqlx::{Pool, Mssql};

pub type DbPool = Pool<Mssql>;

pub async fn connect_db() -> DbPool {
    sqlx::mssql::MssqlPoolOptions::new()
        .max_connections(5)
        .connect(&std::env::var("DATABASE_URL").unwrap())
        .await
        .expect("❌ Error conectando a SQL Server")
}
