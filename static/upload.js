const track = document.getElementById("carouselTrack");
const input = document.getElementById("fileInput");

function openFile() {
  input.click();
}

input.addEventListener("change", async () => {
  const file = input.files[0];
  if (!file) return;

  // ✅ VALIDAR QUE SEA IMAGEN
  if (!file.type.startsWith("image/")) {
    alert("❌ Solo se permiten imágenes (jpg, png, webp, etc)");
    input.value = ""; // reset
    return;
  }

  // (opcional) límite de tamaño 5MB
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    alert("❌ Imagen muy grande (máx 5MB)");
    input.value = "";
    return;
  }

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("/carousel/upload", {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    alert("❌ Error al subir imagen");
    return;
  }

  await loadImages();
});

async function loadImages() {
  track.innerHTML = "";

  const res = await fetch("/carousel/list");
  if (!res.ok) return;

  const ids = await res.json();

  ids.forEach(id => {
    const img = document.createElement("img");
    img.src = `/carousel/image/${id}`;
    track.appendChild(img);
  });

  // 🔄 avisar al carrusel
  document.dispatchEvent(new Event("carousel:loaded"));
}

loadImages();
