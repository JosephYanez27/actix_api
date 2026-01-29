const crumbMap = {
  index: "Inicio",
  services: "Servicios",
  about: "Nosotros",
  contact: "Contacto"
};

function updateBreadcrumb(id) {
  const current = document.getElementById("currentCrumb");
  current.textContent = crumbMap[id] || "Inicio";
}
