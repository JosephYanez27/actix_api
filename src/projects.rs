use actix_web::{get, post, delete, put, web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, FromRow};





#[derive(Serialize, Deserialize, FromRow)]
pub struct Project {
    pub id: Option<i32>,
    pub name: String,
    pub tech: String,
}

// Obtener todos los proyectos
#[get("/api/projects")]
pub async fn list_projects(pool: web::Data<Option<PgPool>>) -> impl Responder {
    let Some(pool) = pool.get_ref() else {
        return HttpResponse::ServiceUnavailable().body("DB no conectada");
    };

    match sqlx::query_as::<_, Project>("SELECT id, name, tech FROM projects ORDER BY id DESC")
        .fetch_all(pool)
        .await 
    {
        Ok(projects) => HttpResponse::Ok().json(projects),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

// Crear proyecto
#[post("/api/projects")]
pub async fn create_project(pool: web::Data<PgPool>, item: web::Json<Project>) -> impl Responder {
    let pool = pool.get_ref() else {
        return HttpResponse::ServiceUnavailable().finish();
    };

    match sqlx::query("INSERT INTO projects (name, tech) VALUES ($1, $2)")
        .bind(&item.name)
        .bind(&item.tech)
        .execute(pool)
        .await 
    {
        Ok(_) => HttpResponse::Created().finish(),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

// Eliminar proyecto
#[delete("/api/projects/{id}")]
pub async fn delete_project(pool: web::<PgPool>, id: web::Path<i32>) -> impl Responder {
    let pool = pool.get_ref() else {
        return HttpResponse::ServiceUnavailable().finish();
    };

    match sqlx::query("DELETE FROM projects WHERE id = $1")
        .bind(id.into_inner())
        .execute(pool)
        .await 
    {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

#[get("/api/projects/{id}")]
pub async fn get_project(pool: web::Data<PgPool>, id: web::Path<i32>) -> impl Responder {
    let pool = pool.get_ref() else {
        return HttpResponse::ServiceUnavailable().body("DB no conectada");
    };

    match sqlx::query_as::<_, Project>("SELECT id, name, tech FROM projects WHERE id = $1")
        .bind(id.into_inner())
        .fetch_optional(pool)
        .await 
    {
        Ok(Some(project)) => HttpResponse::Ok().json(project),
        Ok(None) => HttpResponse::NotFound().body("Proyecto no encontrado"),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

// Editar proyecto (Update)
#[put("/api/projects/{id}")]
pub async fn update_project(
    pool: web::Option<PgPool>, 
    id: web::Path<i32>, 
    item: web::Json<Project>
) -> impl Responder {
    let pool = pool.get_ref() else {
        return HttpResponse::ServiceUnavailable().finish();
    };

    match sqlx::query("UPDATE projects SET name = $1, tech = $2 WHERE id = $3")
        .bind(&item.name)
        .bind(&item.tech)
        .bind(id.into_inner())
        .execute(pool)
        .await 
    {
        Ok(result) => {
            if result.rows_affected() == 0 {
                HttpResponse::NotFound().body("No se encontró el proyecto para actualizar")
            } else {
                HttpResponse::Ok().body("Proyecto actualizado con éxito")
            }
        },
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}






