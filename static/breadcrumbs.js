const crumbMap = {
  index: "Inicio",
  services: "Servicios",
  about: "Nosotros",
  contact: "Contacto"
};

function showSection(id) {

  document.querySelectorAll(".section")
    .forEach(s => s.classList.remove("active"));

  const section = document.getElementById(id);

  if (!section) {
    console.warn("No existe sección:", id);
    return;
  }

  section.classList.add("active");

  updateBreadcrumb(id);
}

function updateBreadcrumb(id) {

  const current = document.getElementById("currentCrumb");
  const sep = document.getElementById("crumbSeparator");

  if (id === "index") {
    current.textContent = "Inicio";
    sep.style.display = "none";
  } else {
    sep.style.display = "inline";
    current.textContent = crumbMap[id] || id;
  }
}


