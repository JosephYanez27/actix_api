const API_URL = "/api/projects";
let allProjects = [];
let filteredProjects = [];
let currentPage = 1;
const rowsPerPage = 5;

// --- 1. INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    
    // Vincular el botón de guardado manualmente si no tiene onclick en el HTML
    const saveBtn = document.getElementById('send-stack-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProject);
    }
});

// --- 2. CRUD: CARGAR PROYECTOS ---
async function loadProjects() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Error en la red");
        
        allProjects = await res.json();
        filteredProjects = allProjects;
        renderTable(); // <--- CRÍTICO: Asegura que se dibuje la tabla al cargar
    } catch (e) { 
        console.error("Error cargando proyectos:", e);
        // Fallback: Si la API falla, podrías cargar de LocalStorage opcionalmente
    }
}

// --- 3. CRUD: GUARDAR CON SEGURIDAD ---
async function saveProject(event) {
    if (event) event.preventDefault(); // Evita recarga de página

    const id = document.getElementById('projectId').value;
    const nameInput = document.getElementById('project-name-input').value.trim();
    
    // SEGURIDAD: Prevenir Inyección SQL básica (Sanitización)
    const sanitizedName = nameInput.replace(/['";\-\-]/g, "");

    if (!sanitizedName) {
        alert("Por favor, ingresa un nombre válido.");
        return;
    }

    // SEGURIDAD: Evitar Nombres Duplicados localmente
    const isDuplicate = allProjects.some(p => 
        p.name.toLowerCase() === sanitizedName.toLowerCase() && p.id != id
    );

    if (isDuplicate) {
        alert(`¡Error! El nombre "${sanitizedName}" ya está en uso.`);
        return;
    }

    const selectedTechs = Array.from(document.querySelectorAll('.option.selected'))
                               .map(opt => opt.getAttribute('data-name'))
                               .join(', ');

    const projectData = { name: sanitizedName, tech: selectedTechs };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/${id}` : API_URL;

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        });

        if (response.ok) {
            alert(id ? "✅ Proyecto actualizado" : "✅ Proyecto creado");
            resetConfigurator();
            await loadProjects(); // Recargar datos y refrescar tabla
        } else {
            const errorData = await response.json();
            alert("Error del servidor: " + (errorData.message || "No se pudo guardar"));
        }
    } catch (error) {
        console.error("Error en la petición:", error);
        alert("No se pudo conectar con el servidor.");
    }
}

// --- 4. RENDERIZADO DE TABLA ---
function renderTable() {
    const tbody = document.getElementById('projectsBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    // Paginación
    const start = (currentPage - 1) * rowsPerPage;
    const pageItems = filteredProjects.slice(start, start + rowsPerPage);

    if (pageItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay proyectos guardados</td></tr>';
        return;
    }

    pageItems.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${p.id}</td>
            <td><strong>${p.name}</strong></td>
            <td>${p.tech}</td>
            <td>
                <button class="btn-edit" onclick="prepareEdit(${p.id}, '${p.name}', '${p.tech}')">✏️</button>
                <button class="btn-delete" onclick="deleteProject(${p.id})">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}