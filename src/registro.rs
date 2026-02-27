use actix_web::{get, post, put, delete, web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, FromRow};

#[derive(Serialize, Deserialize, FromRow, Clone)]
pub struct Registro {
    pub id: Option<i32>,
    pub nombre: String,
    pub mensaje: Option<String>,
    pub fecha_inicio: String,     // Recibido como YYYY-MM-DD
    pub fecha_conclusion: String, // Recibido como YYYY-MM-DD
}

// 1. Obtener todos los registros
#[get("/api/registros")]
pub async fn list_registros(pool: web::Data<Option<PgPool>>) -> impl Responder {
    let Some(pool) = pool.get_ref() else { return HttpResponse::ServiceUnavailable().finish(); };
    
    // Convertimos DATE a TEXT en SQL para enviarlo limpio al JS
    let res = sqlx::query_as::<_, Registro>(
        r#"SELECT id, nombre, mensaje, 
           fecha_inicio::text, fecha_conclusion::text 
           FROM registros_independientes ORDER BY id DESC"#
    ).fetch_all(pool).await;

    match res {
        Ok(items) => HttpResponse::Ok().json(items),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

// 2. Crear registro
#[post("/api/registros")]
pub async fn create_registro(pool: web::Data<Option<PgPool>>, item: web::Json<Registro>) -> impl Responder {
    let Some(pool) = pool.get_ref() else { return HttpResponse::ServiceUnavailable().finish(); };

    let res = sqlx::query(
        r#"INSERT INTO registros_independientes (nombre, mensaje, fecha_inicio, fecha_conclusion) 
           VALUES ($1, $2, $3::date, $4::date)"#
    )
    .bind(&item.nombre)
    .bind(&item.mensaje)
    .bind(&item.fecha_inicio)
    .bind(&item.fecha_conclusion)
    .execute(pool).await;

    match res {
        Ok(_) => HttpResponse::Created().json(true),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

// 3. Actualizar registro (PUT)
#[put("/api/registros/{id}")]
pub async fn update_registro(pool: web::Data<Option<PgPool>>, id: web::Path<i32>, item: web::Json<Registro>) -> impl Responder {
    let Some(pool) = pool.get_ref() else { return HttpResponse::ServiceUnavailable().finish(); };

    let res = sqlx::query(
        r#"UPDATE registros_independientes 
           SET nombre=$1, mensaje=$2, fecha_inicio=$3::date, fecha_conclusion=$4::date 
           WHERE id=$5"#
    )
    .bind(&item.nombre)
    .bind(&item.mensaje)
    .bind(&item.fecha_inicio)
    .bind(&item.fecha_conclusion)
    .bind(id.into_inner())
    .execute(pool).await;

    match res {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

// 4. Eliminar registro
#[delete("/api/registros/{id}")]
pub async fn delete_registro(pool: web::Data<Option<PgPool>>, id: web::Path<i32>) -> impl Responder {
    let Some(pool) = pool.get_ref() else { return HttpResponse::ServiceUnavailable().finish(); };
    
    match sqlx::query("DELETE FROM registros_independientes WHERE id=$1").bind(id.into_inner()).execute(pool).await {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(e) => HttpResponse::InternalServerError().finish(),
    }
}