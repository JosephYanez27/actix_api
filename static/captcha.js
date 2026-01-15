document.getElementById("myForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = grecaptcha.getResponse();

  if (!token) {
    alert("Por favor completa el captcha");
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

    if (!res.ok) {
      throw new Error("Captcha inválido");
    }

    const msg = await res.json();
    document.getElementById("msg").innerText = "✅ Captcha válido";

    // 👉 aquí ya puedes enviar el formulario real
    console.log(msg);

  } catch (err) {
    document.getElementById("msg").innerText = "❌ Captcha inválido";
    grecaptcha.reset();
  }
});
