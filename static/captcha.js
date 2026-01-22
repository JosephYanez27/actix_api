document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("myForm");
  const msg = document.getElementById("msg");

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
      mensaje: form.mensaje.value.trim(),
      recaptcha_token: token
    };

    // 🧪 Validaciones finales
    if (
      !data.nombre ||
      !data.correo ||
      !data.telefono ||
      !data.mensaje
    ) {
      msg.innerText = "❌ Completa todos los campos";
      return;
    }

    if (data.telefono.length !== 10) {
      msg.innerText = "❌ El teléfono debe tener 10 dígitos";
      return;
    }

    try {
      const res = await fetch("/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        throw new Error("Error HTTP");
      }

      const ok = await res.json();

      if (ok === true) {
        msg.innerText = "✅ Mensaje enviado correctamente";
        form.reset();
        grecaptcha.reset();
      } else {
        msg.innerText = "❌ Error al enviar el mensaje";
        grecaptcha.reset();
      }

    } catch (err) {
      msg.innerText = "❌ Error del servidor";
      grecaptcha.reset();
    }
  });
});
