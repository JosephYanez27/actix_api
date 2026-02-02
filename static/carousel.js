let index = 0;
let images = [];
let dots = [];

const dotsContainer = document.querySelector(".carousel-dots");

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

function showSlide(i) {
  if (!images.length) return;

  images.forEach(img => img.classList.remove("active"));
  dots.forEach(dot => dot.classList.remove("active"));

  images[i].classList.add("active");
  dots[i]?.classList.add("active");
}

// Esperamos a que upload.js cargue las imágenes
document.addEventListener("carousel:loaded", () => {
  images = document.querySelectorAll("#carouselTrack img");

  if (!images.length) return;

  index = 0;
  buildDots();
  showSlide(index);
});

// Auto-slide seguro
setInterval(() => {
  if (!images.length) return;
  index = (index + 1) % images.length;
  showSlide(index);
}, 4000);
