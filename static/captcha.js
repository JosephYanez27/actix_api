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

    const data = await res.json();

    if (!data.ok) {
      throw new Error(data.error);
    }

    document.getElementById("msg").innerText = "✅ Captcha válido";
    grecaptcha.reset();

  } catch (err) {
    document.getElementById("msg").innerText = "❌ Captcha inválido";
    grecaptcha.reset();
  }
});
