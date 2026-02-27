document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("myForm");
    const msg = document.getElementById("msg");
    const mensaje = document.getElementById("mensaje");
    const help = document.getElementById("msgHelp");
    
    // Campo oculto para el ID (asegúrate de tener <input type="hidden" id="contactId"> en tu HTML)
    const contactIdInput = document.getElementById("contactId");

    // ❌ NO números en nombre
    form.nombre.addEventListener("input", () => {
        form.nombre.value = form.nombre.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
    });

    // ❌ NO letras en teléfono
    form.telefono.addEventListener("input", () => {
        form.telefono.value = form.telefono.value.replace(/\D/g, "");
    });

    // 🔒 Seguridad: Caracteres y palabras prohibidas
    const forbiddenChars = /['";]|--|(\/\*)|(\*\/)/g;
    const sqlWords = /(select|insert|update|delete|drop|truncate|alter|or\s+1=1)/i;

    mensaje.addEventListener("input", () => {
        mensaje.value = mensaje.value.replace(forbiddenChars, "");
        const text = mensaje.value;
        const len = text.length;

        if (sqlWords.test(text)) {
            help.textContent = "❌ Texto no permitido Moreno";
            help.style.color = "#f87171";
            return;
        }

        if (len < 10) {
            help.textContent = "❗ Mínimo 10 caracteres";
            help.style.color = "#f87171";
        } else if (len > 300) {
            help.textContent = "❗ Máximo 300 caracteres";
            help.style.color = "#f87171";
        } else {
            help.textContent = "✔ Mensaje válido";
            help.style.color = "#4ade80";
        }
    });

    // 📤 Envío formulario (POST o PUT)
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        msg.innerText = "";

        const contactId = contactIdInput ? contactIdInput.value : "";
        let token = "";

        // Solo validamos reCAPTCHA si es un envío NUEVO (opcional, según tu preferencia)
        if (!contactId) {
            token = grecaptcha.getResponse();
            if (!token) {
                msg.innerText = "❌ Completa el captcha";
                return;
            }
        }

        const data = {
            nombre: form.nombre.value.trim(),
            correo: form.correo.value.trim(),
            telefono: form.telefono.value.trim(),
            mensaje: mensaje.value.trim(),
            recaptcha_token: token || "manual_edit"
        };

        // 🧪 Validaciones finales
        if (!data.nombre || !data.correo || !data.telefono || !data.mensaje) {
            msg.innerText = "❌ Completa todos los campos";
            return;
        }

        if (data.telefono.length !== 10) {
            msg.innerText = "❌ El teléfono debe tener 10 dígitos";
            return;
        }

        // Determinamos URL y Método
        const url = contactId ? `/api/contacts/${contactId}` : "/contact";
        const method = contactId ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error("Error en respuesta");

            // Si es PUT (editar), el backend devuelve texto. Si es POST, devuelve un bool.
            if (method === "PUT") {
                msg.innerText = "✅ Contacto actualizado con éxito";
                setTimeout(() => location.reload(), 1500); // Recarga para ver cambios
            } else {
                const ok = await res.json();
                if (ok === true) {
                    msg.innerText = "✅ Mensaje enviado correctamente";
                    form.reset();
                    help.textContent = "10 a 300 caracteres";
                    help.style.color = "#9ca3af";
                    grecaptcha.reset();
                } else {
                    msg.innerText = "❌ Error al enviar";
                    grecaptcha.reset();
                }
            }

        } catch (error) {
            console.error(error);
            msg.innerText = "❌ Error del servidor";
            if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
        }
    });
});