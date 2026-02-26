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
/**
 * 3. LÓGICA CRUD (CARGAR, GUARDAR, RENDERIZAR)
 */
async function loadProjects() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Error en la red");
        
        allProjects = await res.json();
        // IMPORTANTE: Al cargar, el filtro es igual a todos
        filteredProjects = [...allProjects]; 
        
        // Resetear a la página 1 al cargar datos nuevos
        currentPage = 1; 
        
        renderTable();
        updatePagination(); // Asegúrate de llamar a ambos
    } catch (e) { 
        console.error("Error cargando proyectos:", e);
        const tbody = document.getElementById('projectsBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">Error de conexión con el servidor</td></tr>';
    }
}

function renderTable() {
    const tbody = document.getElementById('projectsBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    // Lógica de rebanado para paginación
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageItems = filteredProjects.slice(start, end);

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

    // Filtramos sobre el array original (allProjects)
    filteredProjects = allProjects.filter(p =>
        p.name.toLowerCase().includes(query) || 
        p.tech.toLowerCase().includes(query) // Opcional: buscar también por tecnología
    );

    currentPage = 1; // Siempre volver a la página 1 tras filtrar
    renderTable();
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredProjects.length / rowsPerPage) || 1;
    const indicator = document.getElementById("pageIndicator");
    
    if (indicator) {
        indicator.innerText = `Página ${currentPage} de ${totalPages}`;
    }

    // Manejo de estados de botones
    const btnFirst = document.getElementById("btnFirst");
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");
    const btnLast = document.getElementById("btnLast");

    if (btnFirst) btnFirst.disabled = (currentPage === 1);
    if (btnPrev) btnPrev.disabled = (currentPage === 1);
    if (btnNext) btnNext.disabled = (currentPage === totalPages || totalPages === 0);
    if (btnLast) btnLast.disabled = (currentPage === totalPages || totalPages === 0);
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




function goToPage(type) {
    const totalPages = Math.ceil(filteredProjects.length / rowsPerPage);

    if (type === "first") currentPage = 1;
    if (type === "prev" && currentPage > 1) currentPage--;
    if (type === "next" && currentPage < totalPages) currentPage++;
    if (type === "last") currentPage = totalPages;

    renderTable();
    updatePagination();
}



window.goToPage = goToPage;
window.filterProjects = filterProjects;
window.prepareEdit = prepareEdit;
window.deleteProject = deleteProject;
window.saveProject = saveProject;
window.resetConfigurator = resetConfigurator;
window.checkForm = checkForm;