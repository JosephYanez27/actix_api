const images = ["img1.jpg", "img2.jpg", "img3.jpg"];
let i = 0;

setInterval(() => {
  i = (i + 1) % images.length;
  document.getElementById("carousel-img").src = images[i];
}, 3000);
