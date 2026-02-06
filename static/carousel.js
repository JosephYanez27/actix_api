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

    dot.onclick = () => {
      index = i;
      moveCarousel();
    };

    dotsContainer.appendChild(dot);
    dots.push(dot);
  });
}

function moveCarousel(){
  if(!images.length) return;

  const width = document.querySelector(".carousel").clientWidth;

  track.style.transform = `translateX(-${index * width}px)`;

  dots.forEach(d => d.classList.remove("active"));
  dots[index]?.classList.add("active");
}

// Cuando backend termina de traer imágenes
document.addEventListener("carousel:loaded", () => {

  images = document.querySelectorAll("#carouselTrack img");

  if(!images.length) return;

  index = 0;
  buildDots();
  moveCarousel();
});

// Auto slide
setInterval(() => {
  if(!images.length) return;

  index = (index + 1) % images.length;
  moveCarousel();

}, 4000);
