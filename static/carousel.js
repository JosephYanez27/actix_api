const track = document.getElementById("carouselTrack");
const input = document.getElementById("fileInput");
const dotsContainer = document.querySelector(".carousel-dots");

let index = 0;
let images = [];
let dots = [];

/* ================= SUBIR IMAGEN ================= */

function openFile() {
  input.click();
}

input.addEventListener("change", async () => {
  const file = input.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Solo se permiten imágenes");
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
    alert("Error al subir");
    return;
  }

  await loadImages();
});

/* ================= CARGAR IMÁGENES ================= */

async function loadImages() {
  track.innerHTML = "";

  const res = await fetch("/carousel/list");
  if (!res.ok) return;

  const ids = await res.json();

  ids.forEach(id => {
    const img = document.createElement("img");
    img.src = `/carousel/image/${id}`;
    img.classList.add("carousel-img");
    track.appendChild(img);
  });

  images = document.querySelectorAll(".carousel-img");

  if (!images.length) return;

  index = 0;
  buildDots();
  moveCarousel();
}

/* ================= DOTS ================= */

function buildDots() {
  dotsContainer.innerHTML = "";
  dots = [];

  images.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "dot";

    dot.onclick = () => {
      index = i;
      moveCarousel();
    };

    dotsContainer.appendChild(dot);
    dots.push(dot);
  });
}

/* ================= MOVER CARRUSEL ================= */

function moveCarousel() {
  const width = document.querySelector(".carousel").clientWidth;

  track.style.transform = `translateX(-${index * width}px)`;

  dots.forEach(d => d.classList.remove("active"));
  dots[index]?.classList.add("active");
}

/* ================= AUTO SLIDE ================= */

setInterval(() => {
  if (!images.length) return;

  index = (index + 1) % images.length;
  moveCarousel();

}, 4000);

/* ================= INICIO ================= */

loadImages();
