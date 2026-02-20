const API_URL = "/api/projects";
let allProjects = [];
let filteredProjects = [];
let currentPage = 1;
const rowsPerPage = 5;

// --- 1. LÓGICA DE SELECCIÓN DE UI ---
document.querySelectorAll('.option').forEach(opt => {
    opt.addEventListener('click', function() {
        const categoryGroup = this.closest('.category-group');
        categoryGroup.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        checkForm();
    });
});

function checkForm() {
    const selectedCount = document.querySelectorAll('.option.selected').length;
    const nameInput = document.getElementById('project-name-input').value.trim();
    // Habilitar si hay nombre y las 4 categorías seleccionadas
    document.getElementById('send-stack-btn').disabled = (selectedCount < 4 || nameInput === "");
}

// --- 2. CRUD: GUARDAR (CREAR O ACTUALIZAR) ---
async function saveProject() {
    const id = document.getElementById('projectId').value;
    const nameInput = document.getElementById('project-name-input').value.trim();
    
    // --- VALIDACIÓN 1: Prevenir Inyección SQL básica ---
    // Eliminamos caracteres como ; -- ' para que no lleguen al servidor
    const sanitizedName = nameInput.replace(/['";--]/g, "");

    // --- VALIDACIÓN 2: Evitar Nombres Duplicados ---
    // Buscamos si ya existe un proyecto con ese nombre (ignorando el que estamos editando)
    const isDuplicate = allProjects.some(p => 
        p.name.toLowerCase() === sanitizedName.toLowerCase() && p.id != id
    );

    if (isDuplicate) {
        alert("¡Error! Ya existe un proyecto con el nombre: " + sanitizedName);
        return; // Detenemos la ejecución
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
            alert(id ? "Proyecto actualizado" : "Proyecto creado");
            resetConfigurator();
            loadProjects();
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// --- 3. CRUD: ELIMINAR Y CARGAR ---
async function loadProjects() {
    try {
        const res = await fetch(API_URL);
        allProjects = await res.json();
        filteredProjects = allProjects;
        renderTable();
    } catch (e) { console.error("Error cargando proyectos", e); }
}

async function deleteProject(id) {
    if (confirm('¿Eliminar proyecto?')) {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) loadProjects();
    }
}

// --- 4. PREPARAR EDICIÓN ---
function prepareEdit(id, name, tech) {
    document.getElementById('projectId').value = id;
    document.getElementById('project-name-input').value = name;
    document.getElementById('cancel-edit-btn').style.display = "inline-block";
    document.getElementById('send-stack-btn').innerText = "Actualizar Proyecto";

    // Opcional: Marcar visualmente las tecnologías (requiere lógica de parseo del string 'tech')
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetConfigurator() {
    document.getElementById('projectId').value = "";
    document.getElementById('project-name-input').value = "";
    document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    document.getElementById('cancel-edit-btn').style.display = "none";
    document.getElementById('send-stack-btn').innerText = "Guardar Configuración";
    checkForm();
}

// --- 5. TABLA Y BUSCADOR ---
function filterProjects() {
    const query = document.getElementById('projectSearch').value.toLowerCase();
    filteredProjects = allProjects.filter(p => p.name.toLowerCase().includes(query));
    currentPage = 1;
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('projectsBody');
    tbody.innerHTML = '';
    const start = (currentPage - 1) * rowsPerPage;
    const pageItems = filteredProjects.slice(start, start + rowsPerPage);

    pageItems.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td>${p.id}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.tech}</td>
                <td>
                    <button class="btn-edit" onclick="prepareEdit(${p.id}, '${p.name}', '${p.tech}')">✏️</button>
                    <button class="btn-delete" onclick="deleteProject(${p.id})">🗑️</button>
                </td>
            </tr>`;
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', loadProjects);