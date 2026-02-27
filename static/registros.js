let rawData = [];
let filteredData = [];
let currentPage = 1;
const perPage = 5;

document.addEventListener("DOMContentLoaded", fetchItems);

async function fetchItems() {
    const res = await fetch('/api/registros');
    rawData = await res.json();
    filtrar();
}

function filtrar() {
    const q = document.getElementById("searchInput").value.toLowerCase();
    filteredData = rawData.filter(item => item.nombre.toLowerCase().includes(q));
    currentPage = 1;
    render();
}

function render() {
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageItems = filteredData.slice(start, end);

    const tbody = document.getElementById("tbody");
    tbody.innerHTML = pageItems.map(i => `
        <tr>
            <td><strong>${i.nombre}</strong></td>
            <td>${i.fecha_inicio}</td>
            <td>${i.fecha_conclusion}</td>
            <td>
                <button onclick="openModal(${i.id})">✏️</button>
                <button onclick="deleteItem(${i.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
    
    const totalPages = Math.ceil(filteredData.length / perPage) || 1;
    document.getElementById("pageInfo").innerText = `Página ${currentPage} de ${totalPages}`;
}

async function crearRegistro() {
    const payload = {
        nombre: document.getElementById("add-nombre").value,
        mensaje: document.getElementById("add-mensaje").value,
        fecha_inicio: document.getElementById("add-inicio").value,
        fecha_conclusion: document.getElementById("add-conclusion").value
    };

    if(!payload.nombre || !payload.fecha_inicio || !payload.fecha_conclusion) return alert("Faltan datos");

    await fetch('/api/registros', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });
    fetchItems();
    resetAddForm();
}

// MODAL LOGIC
function openModal(id) {
    const item = rawData.find(r => r.id === id);
    document.getElementById("edit-id").value = item.id;
    document.getElementById("edit-nombre").value = item.nombre;
    document.getElementById("edit-mensaje").value = item.mensaje || "";
    document.getElementById("edit-inicio").value = item.fecha_inicio;
    document.getElementById("edit-conclusion").value = item.fecha_conclusion;
    document.getElementById("editModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("editModal").style.display = "none";
}

async function actualizarRegistro() {
    const id = document.getElementById("edit-id").value;
    const payload = {
        nombre: document.getElementById("edit-nombre").value,
        mensaje: document.getElementById("edit-mensaje").value,
        fecha_inicio: document.getElementById("edit-inicio").value,
        fecha_conclusion: document.getElementById("edit-conclusion").value
    };

    await fetch(`/api/registros/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });
    closeModal();
    fetchItems();
}

async function deleteItem(id) {
    if(confirm("¿Seguro que deseas eliminar?")) {
        await fetch(`/api/registros/${id}`, { method: 'DELETE' });
        fetchItems();
    }
}

function changePage(dir) {
    const total = Math.ceil(filteredData.length / perPage);
    const next = currentPage + dir;
    if(next >= 1 && next <= total) {
        currentPage = next;
        render();
    }
}

function resetAddForm() {
    ["add-nombre", "add-mensaje", "add-inicio", "add-conclusion"].forEach(id => document.getElementById(id).value = "");
}