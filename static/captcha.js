document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("myForm");
  const msg = document.getElementById("msg");

  const mensaje = document.getElementById("mensaje");
  const help = document.getElementById("msgHelp");

  // ❌ NO números en nombre
  form.nombre.addEventListener("input", () => {
    form.nombre.value = form.nombre.value.replace(
      /[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g,
      ""
    );
  });

  // ❌ NO letras en teléfono
  form.telefono.addEventListener("input", () => {
    form.telefono.value = form.telefono.value.replace(/\D/g, "");
  });

  // 🔒 Caracteres peligrosos
  const forbiddenChars = /['";]|--|(\/\*)|(\*\/)/g;

  // 🚫 Palabras SQL sospechosas
  const sqlWords = /(select|insert|update|delete|drop|truncate|alter|or\s+1=1)/i;

  mensaje.addEventListener("input", () => {

    // eliminar símbolos peligrosos
    mensaje.value = mensaje.value.replace(forbiddenChars, "");

    const text = mensaje.value;
    const len = text.length;

    // detectar palabras SQL
    if (sqlWords.test(text)) {
      help.textContent = "❌ Texto no permitido Moreno";
      help.style.color = "#f87171";
      return;
    }

    if (len < 10) {
      help.textContent = "❗ Mínimo 10 caracteres";
      help.style.color = "#f87171";
    }
    else if (len > 300) {
      help.textContent = "❗ Máximo 300 caracteres";
      help.style.color = "#f87171";
    }
    else {
      help.textContent = "✔ Mensaje válido";
      help.style.color = "#4ade80";
    }
  });

  // 📤 Envío formulario
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.innerText = "";

    // 🔐 reCAPTCHA
    const token = grecaptcha.getResponse();

    if (!token) {
      msg.innerText = "❌ Completa el captcha";
      return;
    }

    const data = {
      nombre: form.nombre.value.trim(),
      correo: form.correo.value.trim(),
      telefono: form.telefono.value.trim(),
      mensaje: mensaje.value.trim(),
      recaptcha_token: token
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

    if (data.mensaje.length < 10 || data.mensaje.length > 300) {
      msg.innerText = "❌ El mensaje no cumple longitud";
      return;
    }

    if (sqlWords.test(data.mensaje)) {
      msg.innerText = "❌ Mensaje inválido";
      return;
    }

    try {

      const res = await fetch("/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error();

      const ok = await res.json();

      if (ok === true) {
        msg.innerText = "✅ Mensaje enviado correctamente";
        form.reset();
        help.textContent = "10 a 300 caracteres";
        help.style.color = "#9ca3af";
        grecaptcha.reset();
      } 
      else {
        msg.innerText = "❌ Error al enviar";
        grecaptcha.reset();
      }

    } catch {
      msg.innerText = "❌ Error del servidor";
      grecaptcha.reset();
    }
  });

});
