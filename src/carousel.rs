use actix_multipart::Multipart;
use actix_web::{post, HttpResponse};
use futures_util::StreamExt;
use uuid::Uuid;
use std::fs::{self, File};
use std::io::Write;

#[post("/carousel/upload")]
pub async fn upload_image(mut payload: Multipart) -> HttpResponse {
    // asegurar carpeta
    fs::create_dir_all("./static/images/carousel").ok();

    while let Some(item) = payload.next().await {
        let mut field = match item {
            Ok(f) => f,
            Err(_) => return HttpResponse::BadRequest().body("Multipart error"),
        };
let content_type = match field.content_type() {
    Some(ct) => ct.to_string(),
    None => return HttpResponse::BadRequest().body("Sin content-type"),
};

        let ext = match content_type.as_str() {
            "image/png" => "png",
            "image/jpeg" => "jpg",
            "image/webp" => "webp",
            _ => return HttpResponse::BadRequest().body("Tipo no permitido"),
        };

        let filename = format!("{}.{}", Uuid::new_v4(), ext);
        let filepath = format!("./static/images/carousel/{}", filename);

        let mut f = File::create(&filepath).unwrap();

        while let Some(chunk) = field.next().await {
            let data = chunk.unwrap();
            f.write_all(&data).unwrap();
        }

        return HttpResponse::Ok().json(serde_json::json!({
            "url": format!("/images/carousel/{}", filename)
        }));
    }

    HttpResponse::BadRequest().finish()
}
