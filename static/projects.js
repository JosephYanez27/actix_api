const API_URL = "/api/projects"; // URL relativa para que funcione en Render

// Función para eliminar mejorada
async function deleteProject(id) {
    if (confirm('¿Eliminar proyecto?')) {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) fetchProjects();
    }
}

// Función para guardar
async function saveProject(event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const tech = document.getElementById('tech-select').value;

    await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, tech })
    });
    
    fetchProjects();
}


document.addEventListener('DOMContentLoaded', () => {
    const selectedStack = {
        web: null,
        movil: null,
        api: null,
        base: null
    };

    const options = document.querySelectorAll('.option');
    const sendBtn = document.getElementById('send-stack-btn');
    const nameInput = document.getElementById('project-name-input');

    options.forEach(option => {
        option.addEventListener('click', () => {
            const category = option.closest('.category-group').dataset.category;
            const value = option.dataset.name;

            // 1. Quitar selección previa de la misma categoría
            option.closest('.options-grid').querySelectorAll('.option').forEach(el => {
                el.classList.remove('selected');
            });

            // 2. Aplicar nueva selección
            option.classList.add('selected');
            selectedStack[category] = value;

            // 3. Validar si todo está seleccionado para habilitar botón
            checkCompleteness();
        });
    });

    function checkCompleteness() {
        const isComplete = Object.values(selectedStack).every(v => v !== null);
        sendBtn.disabled = !isComplete;
    }

    // ENVÍO AJAX A ACTIX
    sendBtn.addEventListener('click', async () => {
        const projectName = nameInput.value.trim();
        if (!projectName) return alert("Escribe un nombre para el proyecto");

        const dataToSend = {
            name: projectName,
            tech: `Stack: ${selectedStack.web}, ${selectedStack.movil}, ${selectedStack.api}, ${selectedStack.base}`
        };

        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });

            if (response.ok) {
                alert("¡Stack guardado exitosamente en Postgres!");
                // Opcional: limpiar selección
                window.location.reload(); 
            } else {
                alert("Error al guardar en el servidor");
            }
        } catch (error) {
            console.error("Error en la petición:", error);
        }
    });
});

let allProjects = []; 
let filteredProjects = []; // Para el buscador
let currentPage = 1;
const rowsPerPage = 5;

// --- LÓGICA DEL CONFIGURADOR (Selección de cuadros) ---
document.querySelectorAll('.option').forEach(opt => {
    opt.addEventListener('click', function() {
        const category = this.closest('.category-group');
        category.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        checkForm();
    });
});

function checkForm() {
    const selectedCount = document.querySelectorAll('.option.selected').length;
    const nameInput = document.getElementById('project-name-input').value;
    document.getElementById('send-stack-btn').disabled = (selectedCount < 4 || nameInput === "");
}

// --- CRUD: GUARDAR (Create / Update) ---
async function saveProject() {
    const id = document.getElementById('projectId').value;
    const name = document.getElementById('project-name-input').value;
    const selectedTechs = Array.from(document.querySelectorAll('.option.selected'))
                               .map(opt => opt.getAttribute('data-name'))
                               .join(', ');

    const projectData = { name, tech: selectedTechs };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/projects/${id}` : '/api/projects';

    await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
    });

    resetConfigurator();
    loadProjects();
}

// --- BUSCADOR (Filtrado) ---
function filterProjects() {
    const query = document.getElementById('projectSearch').value.toLowerCase();
    filteredProjects = allProjects.filter(p => p.name.toLowerCase().includes(query));
    currentPage = 1; // Reiniciar a la primera página tras buscar
    renderTable();
}

// --- PAGINACIÓN ---
function renderTable() {
    const tbody = document.getElementById('projectsBody');
    tbody.innerHTML = '';

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageItems = filteredProjects.slice(start, end);

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
    updatePaginationUI();
}

function goToPage(dir) {
    const totalPages = Math.ceil(filteredProjects.length / rowsPerPage);
    if (dir === 'first') currentPage = 1;
    else if (dir === 'last') currentPage = totalPages;
    else if (dir === 'prev' && currentPage > 1) currentPage--;
    else if (dir === 'next' && currentPage < totalPages) currentPage++;
    renderTable();
}

// --- EDITAR (Cargar datos de nuevo al configurador) ---
function prepareEdit(id, name, techList) {
    resetConfigurator();
    document.getElementById('projectId').value = id;
    document.getElementById('project-name-input').value = name;
    document.getElementById('modalTitle').innerText = "Editando Proyecto #" + id;
    document.getElementById('cancel-edit-btn').style.display = "inline-block";

    // Marcar los cuadros correspondientes a las tecnologías guardadas
    const techs = techList.split(', ');
    document.querySelectorAll('.option').forEach(opt => {
        if(techs.includes(opt.getAttribute('data-name'))) {
            opt.classList.add('selected');
        }
    });
    
    window.scrollTo({ top: document.getElementById('configurador-stack').offsetTop, behavior: 'smooth' });
    checkForm();
}

function resetConfigurator() {
    document.getElementById('projectId').value = "";
    document.getElementById('project-name-input').value = "";
    document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    document.getElementById('cancel-edit-btn').style.display = "none";
    checkForm();
}

// Cargar inicial
async function loadProjects() {
    const res = await fetch("/api/projects");
    allProjects = await res.json();
    filteredProjects = allProjects;
    renderTable();
}

document.addEventListener('DOMContentLoaded', loadProjects);