use actix_web::{get, post, delete, put, web, HttpResponse, Responder, HttpRequest};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, FromRow};

#[derive(Serialize, Deserialize, FromRow)]
pub struct Contact {
    pub id: Option<i32>,
    pub nombre: String,
    pub correo: String,
    pub telefono: String,
    pub mensaje: String,
    pub recaptcha_token: String,
    pub recaptcha_success: bool,
    pub ip: String,
}

// 1. Obtener todos los contactos (Paginación/Filtro desde el front)
#[get("/api/contacts")]
pub async fn list_contacts(pool: web::Data<Option<PgPool>>) -> impl Responder {
    let Some(pool) = pool.get_ref() else {
        return HttpResponse::ServiceUnavailable().body("DB no conectada");
    };

    match sqlx::query_as::<_, Contact>("SELECT * FROM contactos ORDER BY id DESC")
        .fetch_all(pool)
        .await 
    {
        Ok(contacts) => HttpResponse::Ok().json(contacts),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

// 2. Guardar Contacto (Tu código original ajustado)
#[post("/contact")]
pub async fn save_contact(
    pool: web::Data<Option<PgPool>>,
    form: web::Json<Contact>,
    req: HttpRequest,
) -> HttpResponse {
    let Some(pool) = pool.get_ref() else {
        return HttpResponse::InternalServerError().json(false);
    };

    let ip = req.peer_addr().map(|a| a.ip().to_string()).unwrap_or_else(|| "unknown".into());

    let result = sqlx::query(
        "INSERT INTO contactos (nombre, correo, telefono, mensaje, recaptcha_token, recaptcha_success, ip) VALUES ($1, $2, $3, $4, $5, $6, $7)"
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

// 3. Eliminar Contacto
#[delete("/api/contacts/{id}")]
pub async fn delete_contact(pool: web::Data<Option<PgPool>>, id: web::Path<i32>) -> impl Responder {
    let Some(pool) = pool.get_ref() else {
        return HttpResponse::ServiceUnavailable().finish();
    };

    match sqlx::query("DELETE FROM contactos WHERE id = $1")
        .bind(id.into_inner())
        .execute(pool)
        .await 
    {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

// Editar Contacto (Update)
#[put("/api/contacts/{id}")]
pub async fn update_contact(
    pool: web::Data<Option<PgPool>>, 
    id: web::Path<i32>, 
    item: web::Json<Contact>
) -> impl Responder {
    let Some(pool) = pool.get_ref() else {
        return HttpResponse::ServiceUnavailable().finish();
    };

    match sqlx::query("UPDATE contactos SET nombre = $1, correo = $2, telefono = $3, mensaje = $4 WHERE id = $5")
        .bind(&item.nombre)
        .bind(&item.correo)
        .bind(&item.telefono)
        .bind(&item.mensaje)
        .bind(id.into_inner())
        .execute(pool)
        .await 
    {
        Ok(result) => {
            if result.rows_affected() == 0 {
                HttpResponse::NotFound().body("No se encontró el contacto")
            } else {
                HttpResponse::Ok().body("Contacto actualizado con éxito")
            }
        },
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}