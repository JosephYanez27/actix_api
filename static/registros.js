let contacts = [];
let filtered = [];
let currentPage = 1;
const rowsPerPage = 5;

document.addEventListener("DOMContentLoaded", loadContacts);

async function loadContacts() {
    try {
        const res = await fetch("/api/contacts");

        if (!res.ok) {
            throw new Error("Error cargando contactos");
        }

        contacts = await res.json();
        filtered = contacts;
        currentPage = 1;
        renderTable();

    } catch (error) {
        console.error(error);
        alert("Error al cargar contactos");
    }
}

function renderTable() {
    const tbody = document.getElementById("tbody");
    tbody.innerHTML = "";

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    No hay resultados
                </td>
            </tr>
        `;
        document.getElementById("pageInfo").innerText = "Página 0 de 0";
        return;
    }

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageItems = filtered.slice(start, end);

    pageItems.forEach(c => {
        tbody.innerHTML += `
            <tr>
                <td>${c.nombre}</td>
                <td>${c.correo}</td>
                <td>${c.telefono}</td>
                <td>${c.mensaje.length > 40 ? c.mensaje.substring(0, 40) + "..." : c.mensaje}</td>
                <td>
                    <button onclick="openEdit(${c.id})">✏️</button>
                    <button onclick="deleteContacto(${c.id})">🗑️</button>
                </td>
            </tr>
        `;
    });

    const totalPages = Math.ceil(filtered.length / rowsPerPage);

    document.getElementById("pageInfo").innerText =
        `Página ${currentPage} de ${totalPages}`;
}

function changePage(direction) {
    const totalPages = Math.ceil(filtered.length / rowsPerPage);

    currentPage += direction;

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    renderTable();
}

function filtrar() {
    const text = document
        .getElementById("searchInput")
        .value
        .toLowerCase()
        .trim();

    filtered = contacts.filter(c =>
        c.nombre.toLowerCase().startsWith(text) ||
        c.correo.toLowerCase().startsWith(text)
    );

    currentPage = 1;
    renderTable();
}

async function deleteContacto(id) {
    if (!confirm("¿Eliminar contacto?")) return;

    try {
        const res = await fetch(`/api/contacts/${id}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            throw new Error("Error eliminando");
        }

        await loadContacts();

    } catch (error) {
        console.error(error);
        alert("Error al eliminar contacto");
    }
}

async function openEdit(id) {
    try {
        const res = await fetch(`/api/contacts/${id}`);

        if (!res.ok) {
            throw new Error("No se pudo obtener el contacto");
        }

        const c = await res.json();

        document.getElementById("edit-id").value = c.id;
        document.getElementById("edit-nombre").value = c.nombre;
        document.getElementById("edit-correo").value = c.correo;
        document.getElementById("edit-telefono").value = c.telefono;
        document.getElementById("edit-mensaje").value = c.mensaje;

        document.getElementById("editModal").style.display = "flex";

        if (typeof grecaptcha !== "undefined") {
            grecaptcha.reset();
        }

    } catch (error) {
        console.error(error);
        alert("Error al abrir edición");
    }
}

function closeModal() {
    document.getElementById("editModal").style.display = "none";
}

async function actualizarContacto() {
    const id = document.getElementById("edit-id").value;

    const token = typeof grecaptcha !== "undefined"
        ? grecaptcha.getResponse()
        : "";

    if (!token) {
        alert("Completa el reCAPTCHA");
        return;
    }

    const data = {
        nombre: document.getElementById("edit-nombre").value,
        correo: document.getElementById("edit-correo").value,
        telefono: document.getElementById("edit-telefono").value,
        mensaje: document.getElementById("edit-mensaje").value,
        recaptcha_token: token
    };

    try {
        const res = await fetch(`/api/contacts/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            throw new Error("Error actualizando");
        }

        closeModal();

        if (typeof grecaptcha !== "undefined") {
            grecaptcha.reset();
        }

        await loadContacts();

        alert("Contacto actualizado correctamente");

    } catch (error) {
        console.error(error);
        alert("Error al actualizar contacto");
    }
}