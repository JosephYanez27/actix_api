# ---------- build ----------
# Usamos slim para que la descarga sea rápida y menos propensa a fallos de red
FROM rust:1.78-slim as builder

WORKDIR /app

# Instalamos dependencias necesarias para compilar (si las necesitas)
# RUN apt-get update && apt-get install -y pkg-config libssl-dev

COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

COPY . .
# Forzamos que se use el binario real ahora
RUN touch src/main.rs && cargo build --release

# ---------- runtime ----------
FROM debian:bookworm-slim

# Importante para que Actix pueda hacer peticiones HTTPS si lo requiere
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiamos el binario y estáticos
COPY --from=builder /app/target/release/actix_api /usr/local/bin/actix_api
COPY --from=builder /app/static ./static

EXPOSE 8080

CMD ["actix_api"]