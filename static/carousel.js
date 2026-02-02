let index = 0;
let images = [];
let dots = [];

const track = document.getElementById("carouselTrack");
const dotsContainer = document.querySelector(".carousel-dots");

/* ===========================
   Construir dots
=========================== */
function buildDots() {
  dotsContainer.innerHTML = "";
  dots = [];

  images.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.addEventListener("click", () => {
      index = i;
      showSlide(index);
    });
    dotsContainer.appendChild(dot);
    dots.push(dot);
  });
}

/* ===========================
   Mostrar slide
=========================== */
function showSlide(i) {
  if (!images.length) return;

  const slideWidth = images[0].offsetWidth;

  // mover el track
  track.style.transform = `translateX(-${i * slideWidth}px)`;

  // actualizar dots
  dots.forEach(dot => dot.classList.remove("active"));
  dots[i]?.classList.add("active");
}

/* ===========================
   Cuando las imágenes cargan
=========================== */
document.addEventListener("carousel:loaded", () => {
  images = document.querySelectorAll("#carouselTrack img");

  if (!images.length) return;

  index = 0;
  buildDots();
  showSlide(index);
});

/* ===========================
   Auto-slide
=========================== */
setInterval(() => {
  if (!images.length) return;

  index = (index + 1) % images.length;
  showSlide(index);
}, 4000);

/* ===========================
   Reajustar al cambiar tamaño
=========================== */
window.addEventListener("resize", () => {
  showSlide(index);
});
