const API_URL = "/api/projects";
let allProjects = [];
let filteredProjects = [];
let currentPage = 1;
const rowsPerPage = 5;

// --- CARGA INICIAL ---
async function loadProjects() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Error en la red");
        allProjects = await res.json();
        filteredProjects = [...allProjects];
        renderTable();
        updatePagination();
    } catch (e) {
        console.error("Error al cargar:", e);
    }
}

// --- TABLA Y FILTRO ---
function renderTable() {
    const tbody = document.getElementById('projectsBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const start = (currentPage - 1) * rowsPerPage;
    const pageItems = filteredProjects.slice(start, start + rowsPerPage);

    if (pageItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay proyectos</td></tr>';
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

function filterProjects() {
    const input = document.getElementById("projectSearch");
    if (!input) return;
    const query = input.value.toLowerCase().trim();
    filteredProjects = allProjects.filter(p => 
        p.name.toLowerCase().includes(query) || p.tech.toLowerCase().includes(query)
    );
    currentPage = 1;
    renderTable();
    updatePagination();
}

// --- PAGINACIÓN ---
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

// --- FUNCIONES DE APOYO ---
function checkForm() {
    const nameInput = document.getElementById('project-name-input');
    const saveBtn = document.getElementById('send-stack-btn');
    const selectedCount = document.querySelectorAll('.option.selected').length;
    if (nameInput && saveBtn) {
        saveBtn.disabled = (selectedCount < 4 || nameInput.value.trim() === "");
    }
}

// --- EXPORTACIÓN AL WINDOW (CRUCIAL) ---
window.goToPage = goToPage;
window.filterProjects = filterProjects;
window.checkForm = checkForm;
window.loadProjects = loadProjects;

document.addEventListener('DOMContentLoaded', loadProjects);