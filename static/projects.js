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