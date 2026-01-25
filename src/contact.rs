use actix_web::{post, web, HttpRequest, HttpResponse};
use serde::Deserialize;
use sqlx::PgPool;

#[derive(Deserialize)]
pub struct ContactInput {
    pub nombre: String,
    pub correo: String,
    pub telefono: String,
    pub mensaje: String,
    pub recaptcha_token: String,
}

#[post("/contact")]
pub async fn save_contact(
    pool: web::Data<Option<PgPool>>,
    form: web::Json<ContactInput>,
    req: HttpRequest,
) -> HttpResponse {

    let pool = match pool.get_ref() {
        Some(p) => p,
        None => {
            eprintln!("❌ Pool no disponible");
            return HttpResponse::InternalServerError()
                .json(false);
        }
    };

    let ip = req
        .peer_addr()
        .map(|a| a.ip().to_string())
        .unwrap_or_else(|| "unknown".into());

    let result = sqlx::query(
        r#"
        INSERT INTO contactos
        (nombre, correo, telefono, mensaje, recaptcha_token, recaptcha_success, ip)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        "#
    )
    .bind(&form.nombre)
    .bind(&form.correo)
    .bind(&form.telefono)
    .bind(&form.mensaje)
    .bind(&form.recaptcha_token)
    .bind(true)
    .bind(&ip)
    .execute(pool)
    .await;

    match result {
        Ok(_) => HttpResponse::Ok().json(true),
        Err(e) => {
            eprintln!("❌ Error DB contacto: {e}");
            HttpResponse::InternalServerError().json(false)
        }
    }
}
