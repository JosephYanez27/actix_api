const API_URL = "/api/projects";
let allProjects = [];
let filteredProjects = [];
let currentPage = 1;
const rowsPerPage = 5;

/** * 1. FUNCIONES GLOBALES 
 */
function checkForm() {
    const nameInput = document.getElementById('project-name-input');
    const saveBtn = document.getElementById('send-stack-btn');
    const selectedCount = document.querySelectorAll('.option.selected').length;

    if (nameInput && saveBtn) {
        const nameValue = nameInput.value.trim();
        // Habilitar si hay texto y exactamente 4 tecnologías seleccionadas
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

    document.addEventListener('click', (e) => {
        const option = e.target.closest('.option');
        if (option) {
            const categoryGroup = option.closest('.category-group');
            if (categoryGroup) {
                categoryGroup.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                checkForm();
            }
        }
    });
});

/**
 * 3. LÓGICA CRUD
 */
async function loadProjects() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Error en la red");
        
        allProjects = await res.json();
        filteredProjects = [...allProjects]; 
        currentPage = 1; 
        
        renderTable();
        updatePagination();
    } catch (e) { 
        console.error("Error cargando proyectos:", e);
    }
}

function renderTable() {
    const tbody = document.getElementById('projectsBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const start = (currentPage - 1) * rowsPerPage;
    const pageItems = filteredProjects.slice(start, start + rowsPerPage);

    if (pageItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No se encontraron proyectos</td></tr>';
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
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterProjects() {
    const query = document.getElementById("projectSearch").value.toLowerCase().trim();
    filteredProjects = allProjects.filter(p =>
        p.name.toLowerCase().includes(query) || p.tech.toLowerCase().includes(query)
    );
    currentPage = 1;
    renderTable();
    updatePagination();
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
    if (type === "prev" && currentPage > 1) currentPage--;
    if (type === "next" && currentPage < totalPages) currentPage++;
    if (type === "last") currentPage = totalPages;

    renderTable();
    updatePagination();
}

async function saveProject() {
    const id = document.getElementById('projectId').value;
    const nameInput = document.getElementById('project-name-input').value.trim();
    const sanitizedName = nameInput.replace(/['";\-\-]/g, "");

    if (!sanitizedName) return;

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
            resetConfigurator();
            await loadProjects();
        }
    } catch (error) {
        console.error("Error:", error);
    }
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
}

async function deleteProject(id) {
    if (confirm('¿Eliminar proyecto?')) {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) loadProjects();
    }
}

// ASIGNACIÓN AL WINDOW (Para que el HTML las vea)
window.goToPage = goToPage;
window.filterProjects = filterProjects;
window.prepareEdit = prepareEdit;
window.deleteProject = deleteProject;
window.saveProject = saveProject;
window.checkForm = checkForm;
window.resetConfigurator = resetConfigurator;