use actix_web::{get, post, delete, put, web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, FromRow};

// 1. Definición del Modelo
#[derive(Serialize, Deserialize, FromRow)]
pub struct Project {
    pub id: Option<i32>,
    pub name: String,
    pub tech: String,
}

// 2. Obtener todos los proyectos
#[get("/api/projects")]
pub async fn list_projects(pool: web::Data<Option<PgPool>>) -> impl Responder {
    let Some(pool) = pool.get_ref() else {
        return HttpResponse::ServiceUnavailable().body("Error: Base de datos no conectada");
    };

    match sqlx::query_as::<_, Project>("SELECT id, name, tech FROM projects ORDER BY id DESC")
        .fetch_all(pool)
        .await 
    {
        Ok(projects) => HttpResponse::Ok().json(projects),
        Err(e) => {
            eprintln!("Error en list_projects: {}", e);
            HttpResponse::InternalServerError().body("Error al obtener la lista de proyectos")
        }
    }
}

// 3. Obtener un proyecto por ID
#[get("/api/projects/{id}")]
pub async fn get_project(pool: web::Data<Option<PgPool>>, id: web::Path<i32>) -> impl Responder {
    let Some(pool) = pool.get_ref() else {
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

// 4. Crear proyecto
#[post("/api/projects")]
pub async fn create_project(pool: web::Data<Option<PgPool>>, item: web::Json<Project>) -> impl Responder {
    let Some(pool) = pool.get_ref() else {
        return HttpResponse::ServiceUnavailable().finish();
    };

    // Usamos RETURNING id si necesitas el ID inmediatamente después de crear
    match sqlx::query("INSERT INTO projects (name, tech) VALUES ($1, $2)")
        .bind(&item.name)
        .bind(&item.tech)
        .execute(pool)
        .await 
    {
        Ok(_) => HttpResponse::Created().finish(),
        Err(e) => {
            eprintln!("Error al crear proyecto: {}", e);
            HttpResponse::InternalServerError().body(e.to_string())
        }
    }
}

// 5. Editar proyecto (Update)
#[put("/api/projects/{id}")]
pub async fn update_project(
    pool: web::Data<Option<PgPool>>, 
    id: web::Path<i32>, 
    item: web::Json<Project>
) -> impl Responder {
    let Some(pool) = pool.get_ref() else {
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

// 6. Eliminar proyecto
#[delete("/api/projects/{id}")]
pub async fn delete_project(pool: web::Data<Option<PgPool>>, id: web::Path<i32>) -> impl Responder {
    let Some(pool) = pool.get_ref() else {
        return HttpResponse::ServiceUnavailable().finish();
    };

    match sqlx::query("DELETE FROM projects WHERE id = $1")
        .bind(id.into_inner())
        .execute(pool)
        .await 
    {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}