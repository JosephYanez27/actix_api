const track = document.getElementById("carouselTrack");
const input = document.getElementById("fileInput");

let currentIndex = 0;
let images = [];

function openFile() {
  input.click();
}

input.addEventListener("change", async () => {
  const file = input.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("❌ Solo se permiten imágenes");
    input.value = "";
    return;
  }

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
  images = [];

  const res = await fetch("/carousel/list");
  if (!res.ok) return;

  const ids = await res.json();

  ids.forEach(id => {
    const img = document.createElement("img");
    img.src = `/carousel/image/${id}`;
    track.appendChild(img);
    images.push(img);
  });

  currentIndex = 0;
  updateCarousel();
}

function updateCarousel() {
  const width = track.clientWidth;
  track.style.transform = `translateX(-${currentIndex * width}px)`;
}

/* AUTO SLIDE */

setInterval(() => {
  if (images.length === 0) return;

  currentIndex++;

  if (currentIndex >= images.length) {
    currentIndex = 0;
  }

  updateCarousel();
}, 3500);

/* REAJUSTE AL REDIMENSIONAR */

window.addEventListener("resize", updateCarousel);

loadImages();


window.addEventListener("load", () => {
  document.getElementById("robot").innerHTML = `
   <spline-viewer class="robot-3d"
   url="https://prod.spline.design/zWrQ7l9ji0Vekx53/scene.splinecode">
   </spline-viewer>
  `;
});

