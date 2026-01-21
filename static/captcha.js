document.getElementById("myForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = grecaptcha.getResponse();
  console.log("TOKEN:", token);

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

    const isValid = await res.json(); // 👈 BOOLEAN

    if (isValid === true) {
      document.getElementById("msg").innerText = "✅ Captcha válido";
    } else {
      document.getElementById("msg").innerText = "❌ Captcha inválido";
    }

    grecaptcha.reset();

  } catch (err) {
    document.getElementById("msg").innerText = "❌ Error al verificar captcha";
    grecaptcha.reset();
  }
});
