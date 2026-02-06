let index = 0;
let images = [];
let dots = [];

const track = document.getElementById("carouselTrack");
const dotsContainer = document.querySelector(".carousel-dots");

function buildDots(){
  dotsContainer.innerHTML = "";
  dots = [];

  images.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "dot";

    dot.addEventListener("click", () => {
      index = i;
      updateCarousel();
    });

    dotsContainer.appendChild(dot);
    dots.push(dot);
  });
}

function updateCarousel(){
  if(!images.length) return;

  const width = document.querySelector(".carousel").offsetWidth;

  track.style.transform = `translateX(-${index * width}px)`;

  dots.forEach(d => d.classList.remove("active"));
  dots[index]?.classList.add("active");
}

// cuando upload.js termina de cargar imágenes
document.addEventListener("carousel:loaded", () => {

  images = document.querySelectorAll("#carouselTrack img");

  if(!images.length) return;

  index = 0;
  buildDots();
  updateCarousel();
});

// auto slide
setInterval(() => {
  if(!images.length) return;

  index = (index + 1) % images.length;
  updateCarousel();

}, 4000);
