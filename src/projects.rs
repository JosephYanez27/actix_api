use actix_web::{get, post, delete, put, web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, FromRow};





const API_URL = "/api/projects";
let allProjects = [];
let filteredProjects = [];
let currentPage = 1;
const rowsPerPage = 5;

// --- 1. INICIALIZACIÓN Y SELECCIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();

    // Delegación de eventos para las tecnologías
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

    const saveBtn = document.getElementById('send-stack-btn');
    if (saveBtn) {
        saveBtn.onclick = saveProject;
    }
});

function checkForm() {
    const selectedCount = document.querySelectorAll('.option.selected').length;
    const nameInput = document.getElementById('project-name-input').value.trim();
    const saveBtn = document.getElementById('send-stack-btn');

    if (saveBtn) {
        // Habilitar solo si hay nombre y las 4 categorías seleccionadas
        saveBtn.disabled = (selectedCount < 4 || nameInput === "");
    }
}

// --- 2. CRUD: CARGAR Y MOSTRAR ---
async function loadProjects() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Error en servidor");
        allProjects = await res.json();
        filteredProjects = allProjects;
        renderTable();
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

    pageItems.forEach(p => {
        const row = `
            <tr>
                <td>${p.id}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.tech}</td>
                <td>
                    <button class="btn-edit" onclick="prepareEdit(${p.id}, '${p.name}', '${p.tech}')">✏️</button>
                    <button class="btn-delete" onclick="deleteProject(${p.id})">🗑️</button>
                </td>
            </tr>`;
        tbody.innerHTML += row;
    });
}

// --- 3. CRUD: GUARDAR (CREATE / UPDATE) ---
async function saveProject(event) {
    if (event) event.preventDefault();

    const id = document.getElementById('projectId').value;
    const nameInput = document.getElementById('project-name-input').value.trim();

    // Sanitización SQL básica (Escapando el guion para evitar error de regex)
    const sanitizedName = nameInput.replace(/['";\-\-]/g, "");

    const isDuplicate = allProjects.some(p =>
        p.name.toLowerCase() === sanitizedName.toLowerCase() && p.id != id
    );

    if (isDuplicate) {
        alert("¡Error! Ya existe un proyecto con ese nombre.");
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
            await loadProjects();
        } else {
            alert("Error al guardar en el servidor");
        }
    } catch (error) {
        console.error("Error al guardar:", error);
    }
}

// --- 4. FUNCIONES DE APOYO ---
function prepareEdit(id, name, tech) {
    document.getElementById('projectId').value = id;
    document.getElementById('project-name-input').value = name;
    document.getElementById('cancel-edit-btn').style.display = "inline-block";
    document.getElementById('send-stack-btn').innerText = "Actualizar Proyecto";
    
    // Limpiamos selecciones previas
    document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    
    // REPARACIÓN: Quitamos "Stack: " si existe y separamos por comas
    const cleanTech = tech.replace("Stack: ", ""); 
    const techsArray = cleanTech.split(',').map(t => t.trim());
    
    techsArray.forEach(tName => {
        // Buscamos el cuadro que tenga ese data-name
        const option = document.querySelector(`.option[data-name="${tName}"]`);
        if (option) option.classList.add('selected');
    });

    checkForm(); // Habilitar botón de actualización
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

async function deleteProject(id) {
    if (confirm('¿Eliminar proyecto?')) {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) loadProjects();
    }
}






