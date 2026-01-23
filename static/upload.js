const track = document.getElementById("carouselTrack");
const input = document.getElementById("fileInput");

function openFile() {
  input.click();
}

input.addEventListener("change", async () => {
  const file = input.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("/carousel/upload", {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    alert("Error al subir imagen");
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

  // Avisamos al carrusel que ya hay imágenes
  document.dispatchEvent(new Event("carousel:loaded"));
}

loadImages();
