HttpServer::new(move || {
    App::new()
        .app_data(web::Data::new(pool.clone()))

        // 🧪 Health
        .service(health)

        // 📌 APIs
        .service(save_contact)
        .service(upload_image)
        .service(list_images)
        .service(get_image)

        // 🧩 favicon
        .service(web::resource("/favicon.ico").to(favicon))

        // 📂 archivos estáticos secundarios
        .service(Files::new("/images", "./static/images"))

        // 📂 FRONTEND (SIEMPRE AL FINAL)
        .service(Files::new("/", "./static").index_file("index.html"))

        // 🚑 fallback
        .default_service(
            web::route().to(|| async {
                HttpResponse::Found()
                    .append_header(("Location", "/error.html"))
                    .finish()
            }),
        )
})