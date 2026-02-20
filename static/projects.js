const API_URL = "/api/projects";
let allProjects = [];
let filteredProjects = [];
let currentPage = 1;
const rowsPerPage = 5;

/** * 1. FUNCIONES GLOBALES 
 * Deben estar fuera de cualquier bloque para que el HTML (oninput) las reconozca.
 */
function checkForm() {
    const nameInput = document.getElementById('project-name-input');
    const saveBtn = document.getElementById('send-stack-btn');
    const selectedCount = document.querySelectorAll('.option.selected').length;

    if (nameInput && saveBtn) {
        const nameValue = nameInput.value.trim();
        // Habilitar si hay texto y 4 tecnologías seleccionadas
        saveBtn.disabled = (selectedCount < 4 || nameValue === "");
    }
}

function resetConfigurator() {
    document.getElementById('projectId').value = "";
    document.getElementById('project-name-input').value = "";
    document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    document.getElementById('send-stack-btn').innerText = "Guardar Configuración";
    checkForm();
}

/**
 * 2. INICIALIZACIÓN DE EVENTOS
 */
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();

    // Manejo de clics en tecnologías (Delegación de eventos)
    document.addEventListener('click', (e) => {
        const option = e.target.closest('.option');
        if (option) {
            const categoryGroup = option.closest('.category-group');
            if (categoryGroup) {
                categoryGroup.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                checkForm(); // Validar después de seleccionar
            }
        }
    });

    const saveBtn = document.getElementById('send-stack-btn');
    if (saveBtn) {
        saveBtn.onclick = saveProject;
    }
});

/**
 * 3. LÓGICA CRUD (CARGAR, GUARDAR, RENDERIZAR)
 */
async function loadProjects() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Error en la red");
        allProjects = await res.json();
        filteredProjects = allProjects;
        renderTable();
    } catch (e) { 
        console.error("Error cargando proyectos:", e);
    }
}

async function saveProject(event) {
    if (event) event.preventDefault();

    const id = document.getElementById('projectId').value;
    const nameInput = document.getElementById('project-name-input').value.trim();
    
    // Sanitización para evitar errores de Regex y SQL
    const sanitizedName = nameInput.replace(/['";\-\-]/g, "");

    if (!sanitizedName) return;

    const isDuplicate = allProjects.some(p => 
        p.name.toLowerCase() === sanitizedName.toLowerCase() && p.id != id
    );

    if (isDuplicate) {
        alert(`El nombre "${sanitizedName}" ya está en uso.`);
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
            alert(id ? "✅ Actualizado" : "✅ Creado");
            resetConfigurator();
            await loadProjects();
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

function renderTable() {
    const tbody = document.getElementById('projectsBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const start = (currentPage - 1) * rowsPerPage;
    const pageItems = filteredProjects.slice(start, start + rowsPerPage);

    if (pageItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay proyectos</td></tr>';
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

function prepareEdit(id, name, tech) {
    document.getElementById('projectId').value = id;
    document.getElementById('project-name-input').value = name;
    
    document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    
    const techsArray = tech.split(',').map(t => t.trim());
    techsArray.forEach(tName => {
        const option = document.querySelector(`.option[data-name="${tName}"]`);
        if (option) option.classList.add('selected');
    });

    document.getElementById('send-stack-btn').innerText = "Actualizar Proyecto";
    checkForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteProject(id) {
    if (confirm('¿Eliminar proyecto?')) {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) loadProjects();
    }
}