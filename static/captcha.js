document.getElementById("myForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = grecaptcha.getResponse();

  if (!token) {
    document.getElementById("msg").innerText = "❌ Completa el captcha";
    return;
  }

  try {
    const res = await fetch("/captcha/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data);
    }

    document.getElementById("msg").innerText = "✅ Captcha válido";
    console.log("Servidor:", data);

    // Aquí iría tu lógica real (guardar, redirigir, etc)

  } catch (err) {
    document.getElementById("msg").innerText = "❌ Captcha inválido";
    grecaptcha.reset();
    console.error(err);
  }
});
