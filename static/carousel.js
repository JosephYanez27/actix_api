let index = 0;
let images = [];
let dots = [];

const track = document.getElementById("carouselTrack");
const dotsContainer = document.querySelector(".carousel-dots");

function buildDots() {
  dotsContainer.innerHTML = "";
  dots = [];

  images.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.addEventListener("click", () => {
      index = i;
      moveSlide();
    });
    dotsContainer.appendChild(dot);
    dots.push(dot);
  });
}

function moveSlide() {
  if (!images.length) return;

  const slideWidth = images[0].clientWidth;
  track.style.transform = `translateX(-${index * slideWidth}px)`;

  dots.forEach(dot => dot.classList.remove("active"));
  dots[index]?.classList.add("active");
}

// Cuando se cargan imágenes desde backend
document.addEventListener("carousel:loaded", () => {
  images = document.querySelectorAll("#carouselTrack img");

  if (!images.length) return;

  index = 0;
  buildDots();
  moveSlide();
});

// Auto slide
setInterval(() => {
  if (!images.length) return;
  index = (index + 1) % images.length;
  moveSlide();
}, 4000);
