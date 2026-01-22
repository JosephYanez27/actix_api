const images = document.querySelectorAll(".carousel-track img");
const dots = document.querySelectorAll(".dot");

let index = 0;

function showSlide(i) {
  images.forEach(img => img.classList.remove("active"));
  dots.forEach(dot => dot.classList.remove("active"));

  images[i].classList.add("active");
  dots[i].classList.add("active");
}

// Dots clicables
dots.forEach((dot, i) => {
  dot.addEventListener("click", () => {
    index = i;
    showSlide(index);
  });
});

// Auto slide
setInterval(() => {
  index = (index + 1) % images.length;
  showSlide(index);
}, 4000);
