const input = document.getElementById("fileInput");
const track = document.getElementById("carouselTrack");

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

  const { url } = await res.json();

  const img = document.createElement("img");
  img.src = url;

  track.appendChild(img);
});
