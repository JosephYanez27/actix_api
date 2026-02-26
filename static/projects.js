const API_URL = "/api/projects";
let allProjects = [];
let filteredProjects = [];
let currentPage = 1;
const rowsPerPage = 5;

// --- 1. CARGA E INICIALIZACIÓN ---
async function loadProjects() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Error en la red al obtener proyectos");
        allProjects = await res.json();
        filteredProjects = [...allProjects];
        renderTable();
        updatePagination();
    } catch (e) {
        console.error("Error:", e);
    }
}

// Se ejecuta al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    
    // Delegación de eventos para las opciones de tecnología
    document.addEventListener('click', (e) => {
        const option = e.target.closest('.option');
        if (option) {
            const categoryGroup = option.closest('.category-group');
            if (categoryGroup) {
                // Deseleccionar otros en la misma categoría (Radio button behavior)
                categoryGroup.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                checkForm();
            }
        }
    });
});

// --- 2. RENDERIZADO Y PAGINACIÓN ---
function renderTable() {
    const tbody = document.getElementById('projectsBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const start = (currentPage - 1) * rowsPerPage;
    const pageItems = filteredProjects.slice(start, start + rowsPerPage);

    if (pageItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay proyectos registrados</td></tr>';
        return;
    }

    pageItems.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${p.name}</strong></td>
            <td>${p.tech}</td>
            <td>
                <button class="btn-edit" onclick="prepareEdit(${p.id}, '${p.name}', '${p.tech}')">✏️</button>
                <button class="btn-delete" onclick="deleteProject(${p.id})">🗑️</button>
            </td>`;
        tbody.appendChild(row);
    });
}

function updatePagination() {
    const totalPages = Math.ceil(filteredProjects.length / rowsPerPage) || 1;
    const indicator = document.getElementById("pageIndicator");
    if (indicator) indicator.innerText = `Página ${currentPage} de ${totalPages}`;

    document.getElementById("btnPrev")?.toggleAttribute("disabled", currentPage === 1);
    document.getElementById("btnFirst")?.toggleAttribute("disabled", currentPage === 1);
    document.getElementById("btnNext")?.toggleAttribute("disabled", currentPage === totalPages);
    document.getElementById("btnLast")?.toggleAttribute("disabled", currentPage === totalPages);
}

function goToPage(type) {
    const totalPages = Math.ceil(filteredProjects.length / rowsPerPage);
    if (type === "first") currentPage = 1;
    else if (type === "prev" && currentPage > 1) currentPage--;
    else if (type === "next" && currentPage < totalPages) currentPage++;
    else if (type === "last") currentPage = totalPages;

    renderTable();
    updatePagination();
}

// --- 3. CREAR Y EDITAR (CRUD) ---
async function saveProject() {
    const id = document.getElementById('projectId').value;
    const nameInput = document.getElementById('project-name-input').value.trim();
    
    // Obtener tecnologías seleccionadas
    const selectedOptions = document.querySelectorAll('.option.selected');
    const selectedTechs = Array.from(selectedOptions)
                               .map(opt => opt.getAttribute('data-name'))
                               .join(', ');

    if (!nameInput || selectedOptions.length < 4) {
        alert("Por favor, ingresa un nombre y selecciona las 4 tecnologías.");
        return;
    }

    const projectData = { name: nameInput, tech: selectedTechs };
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
            await loadProjects();
        } else {
            const errorText = await response.text();
            throw new Error(errorText);
        }
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Error al conectar con el servidor.");
    }
}

function prepareEdit(id, name, tech) {
    // Llenar el formulario con los datos actuales
    document.getElementById('projectId').value = id;
    document.getElementById('project-name-input').value = name;
    
    // Limpiar selecciones previas
    document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    
    // Marcar las tecnologías que corresponden al string "tech"
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
    if (confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
        try {
            const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await loadProjects();
            } else {
                alert("No se pudo eliminar el proyecto.");
            }
        } catch (e) {
            console.error("Error al eliminar:", e);
        }
    }
}

// --- 4. UTILIDADES ---
function filterProjects() {
    const query = document.getElementById("projectSearch").value.toLowerCase().trim();
    filteredProjects = allProjects.filter(p => 
        p.name.toLowerCase().includes(query) || p.tech.toLowerCase().includes(query)
    );
    currentPage = 1;
    renderTable();
    updatePagination();
}

function checkForm() {
    const nameInput = document.getElementById('project-name-input');
    const saveBtn = document.getElementById('send-stack-btn');
    const selectedCount = document.querySelectorAll('.option.selected').length;
    
    if (nameInput && saveBtn) {
        // Habilitar solo si tiene nombre y las 4 categorías seleccionadas
        saveBtn.disabled = (selectedCount < 4 || nameInput.value.trim() === "");
    }
}

function resetConfigurator() {
    document.getElementById('projectId').value = "";
    document.getElementById('project-name-input').value = "";
    document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    document.getElementById('send-stack-btn').innerText = "Guardar Configuración";
    checkForm();
}

// --- 5. EXPOSICIÓN GLOBAL ---
window.goToPage = goToPage;
window.filterProjects = filterProjects;
window.saveProject = saveProject;
window.prepareEdit = prepareEdit;
window.deleteProject = deleteProject;
window.checkForm = checkForm;
window.resetConfigurator = resetConfigurator;

document.addEventListener('DOMContentLoaded', loadProjects);