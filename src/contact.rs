use actix_multipart::Multipart;
use actix_web::{get, post, web, HttpResponse};
use futures_util::StreamExt;
use sqlx::{PgPool, Row};

#[post("/carousel/upload")]
pub async fn upload_image(
    mut payload: Multipart,
    pool: web::Data<PgPool>,
) -> HttpResponse {
    while let Some(item) = payload.next().await {
        let mut field = match item {
            Ok(f) => f,
            Err(e) => {
                eprintln!("Multipart error: {e}");
                return HttpResponse::BadRequest().body("Campo inválido");
            }
        };

        let filename = field
            .content_disposition()
            .get_filename()
            .unwrap_or("image")
            .to_string();

        let mime_type = field
            .content_type()
            .map(|m| m.to_string())
            .unwrap_or_else(|| "application/octet-stream".to_string());

        let mut bytes = Vec::new();
        while let Some(chunk) = field.next().await {
            match chunk {
                Ok(data) => bytes.extend_from_slice(&data),
                Err(e) => {
                    eprintln!("Chunk error: {e}");
                    return HttpResponse::InternalServerError().finish();
                }
            }
        }

        if bytes.is_empty() {
            return HttpResponse::BadRequest().body("Imagen vacía");
        }

        if let Err(e) = sqlx::query(
            "INSERT INTO carousel_images (filename, mime_type, data)
             VALUES ($1, $2, $3)"
        )
        .bind(filename)
        .bind(mime_type)
        .bind(bytes)
        .execute(pool.get_ref())
        .await
        {
            eprintln!("DB INSERT ERROR: {e}");
            return HttpResponse::InternalServerError()
                .body("Error guardando imagen");
        }

        return HttpResponse::Ok().json(serde_json::json!({
            "status": "ok"
        }));
    }

    HttpResponse::BadRequest().body("No se recibió imagen")
}

#[get("/carousel/list")]
pub async fn list_images(pool: web::Data<PgPool>) -> HttpResponse {
    let rows = match sqlx::query(
        "SELECT id FROM carousel_images ORDER BY created_at"
    )
    .fetch_all(pool.get_ref())
    .await
    {
        Ok(r) => r,
        Err(e) => {
            eprintln!("DB SELECT LIST ERROR: {e}");
            return HttpResponse::InternalServerError()
                .body("Error listando imágenes");
        }
    };

    let ids: Vec<i32> = rows
        .into_iter()
        .map(|r| r.get::<i32, _>("id"))
        .collect();

    HttpResponse::Ok().json(ids)
}

#[get("/carousel/image/{id}")]
pub async fn get_image(
    path: web::Path<i32>,
    pool: web::Data<PgPool>,
) -> HttpResponse {
    let row = match sqlx::query(
        "SELECT data, mime_type FROM carousel_images WHERE id = $1"
    )
    .bind(*path)
    .fetch_one(pool.get_ref())
    .await
    {
        Ok(r) => r,
        Err(e) => {
            eprintln!("DB SELECT IMAGE ERROR: {e}");
            return HttpResponse::NotFound().finish();
        }
    };

    let data: Vec<u8> = row.get("data");
    let mime: String = row.get("mime_type");

    HttpResponse::Ok()
        .content_type(mime)
        .body(data)
}
