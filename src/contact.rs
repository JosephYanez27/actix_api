use actix_web::{get, post, put, delete, web, HttpResponse};
use serde::{Serialize, Deserialize};
use sqlx::FromRow;

#[derive(Deserialize)]
pub struct ContactInput {
    pub nombre: String,
    pub correo: String,
    pub telefono: String,
    pub mensaje: String,
    pub recaptcha_token: String,
}
#[derive(Serialize, FromRow)]
pub struct Contact {
    pub id: i32,
    pub nombre: String,
    pub correo: String,
    pub telefono: String,
    pub mensaje: String,
    pub recaptcha_token: String,
    pub recaptcha_success: bool,
    pub ip: String,
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





#[get("/api/contacts")]
pub async fn list_contacts(
    pool: web::Data<Option<PgPool>>,
) -> HttpResponse {

    let pool = match pool.get_ref() {
        Some(p) => p,
        None => return HttpResponse::ServiceUnavailable().finish(),
    };

    match sqlx::query_as::<_, Contact>(
        "SELECT * FROM contactos ORDER BY id DESC"
    )
    .fetch_all(pool)
    .await
    {
        Ok(data) => HttpResponse::Ok().json(data),
        Err(e) => {
            eprintln!("❌ Error list contacts: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

//
// 🔹 GET POR ID
//
#[get("/api/contacts/{id}")]
pub async fn get_contact(
    pool: web::Data<Option<PgPool>>,
    id: web::Path<i32>,
) -> HttpResponse {

    let pool = match pool.get_ref() {
        Some(p) => p,
        None => return HttpResponse::ServiceUnavailable().finish(),
    };

    match sqlx::query_as::<_, Contact>(
        "SELECT * FROM contactos WHERE id = $1"
    )
    .bind(id.into_inner())
    .fetch_optional(pool)
    .await
    {
        Ok(Some(contact)) => HttpResponse::Ok().json(contact),
        Ok(None) => HttpResponse::NotFound().body("Contacto no encontrado"),
        Err(e) => {
            eprintln!("❌ Error get contact: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

//
// 🔹 UPDATE
//
#[put("/api/contacts/{id}")]
pub async fn update_contact(
    pool: web::Data<Option<PgPool>>,
    id: web::Path<i32>,
    form: web::Json<ContactInput>,
) -> HttpResponse {

    let pool = match pool.get_ref() {
        Some(p) => p,
        None => return HttpResponse::ServiceUnavailable().finish(),
    };

    match sqlx::query(
        r#"
        UPDATE contactos
        SET nombre = $1,
            correo = $2,
            telefono = $3,
            mensaje = $4,
            recaptcha_token = $5
        WHERE id = $6
        "#
    )
    .bind(&form.nombre)
    .bind(&form.correo)
    .bind(&form.telefono)
    .bind(&form.mensaje)
    .bind(&form.recaptcha_token)
    .bind(id.into_inner())
    .execute(pool)
    .await
    {
        Ok(result) => {
            if result.rows_affected() == 0 {
                HttpResponse::NotFound().body("No se encontró el contacto")
            } else {
                HttpResponse::Ok().body("Contacto actualizado")
            }
        }
        Err(e) => {
            eprintln!("❌ Error update contact: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

//
// 🔹 DELETE
//
#[delete("/api/contacts/{id}")]
pub async fn delete_contact(
    pool: web::Data<Option<PgPool>>,
    id: web::Path<i32>,
) -> HttpResponse {

    let pool = match pool.get_ref() {
        Some(p) => p,
        None => return HttpResponse::ServiceUnavailable().finish(),
    };

    match sqlx::query(
        "DELETE FROM contactos WHERE id = $1"
    )
    .bind(id.into_inner())
    .execute(pool)
    .await
    {
        Ok(result) => {
            if result.rows_affected() == 0 {
                HttpResponse::NotFound().body("No se encontró el contacto")
            } else {
                HttpResponse::Ok().body("Contacto eliminado")
            }
        }
        Err(e) => {
            eprintln!("❌ Error delete contact: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}