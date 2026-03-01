//Inicializamos

//Cuando el HTML este cargado ejecutamos el init
document.addEventListener('DOMContentLoaded', init);

async function init() {
    //Si no hay ningun token, redirigiremos al login
    if (!getToken()) {
        window.location.href = 'index.html';
        return;
    }

    //Mostramos el nombre y rol del usuario 
    document.getElementById('user-nombre').textContent = sessionStorage.getItem('nombre');
    document.getElementById('user-rol').textContent = sessionStorage.getItem('rol');

    //Cargamos los contenedores al entrar
    await cargarContenedores();
    
}

//---Navegacion---

//Funcion para mostrar la pagina
function mostrarPagina(pagina) {
    //Ocultamos todas las paginas
    document.querySelectorAll('.page').forEach(p =>
        p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n =>
        n.classList.remove('active'));

    //Mostramos la pagina seleccionada
    document.getElementById(`page-${pagina}`).classList.add('active');
    document.querySelector(`.nav-item[onclick="mostrarPagina('${pagina}')"]`).classList.add('active');

    //Cargamos ahora los datos correspondientes
    if (pagina === 'contenedores') cargarContenedores();
    if (pagina === 'plantillas') cargarPlantillas();
    if (pagina === 'logs') cargarLogs();

}

//---Contenedores---

async function cargarContenedores() {
    try {
        const contenedores = await apiRequest('contenedores', 'GET');
        const grid = document.getElementById('contenedores-grid');
        
        //Acrualizamos las estadisiticas
        document.getElementById('stat-total').textContent = contenedores.length;
        document.getElementById('stat-running').textContent = contenedores.filter(c => c.estado === 'running').length;
        document.getElementById('stat-stopped').textContent = contenedores.filter(c => c.estado === 'stopped').length;

        //Si no hay contenedores mostraremos un mensaje
        if (contenedores.length === 0) {
            grid.innerHTML = '<div class="empty-state">NO HAY CONTENEDORES DESPLEGADOS</div>';
            return;
        }

        //Generamos ahora, una tarjeta por cada contenedor, render dinamico
        grid.innerHTML = contenedores.map(c => `
            <div class="contenedor-card" id="card-${c.id}">
                <div class="card-header">
                    <div>
                        <div class="nombre">${c.nombre}</div>
                        <div class="imagen">${c.imagen}</div>
                    </div>
                    <span class="estado ${c.estado}">${c.estado.toUpperCase()}</span>
                </div>
                ${c.puerto ? `<div style="font-size:0.75rem; color:var(--text-secondary)">Puerto: ${c.puerto}</div>` : ''}
                <div class="acciones">
                    <button class="btn" onclick="accion(${c.id}, 'start')">START</button>
                    <button class="btn btn-warning" onclick="accion(${c.id}, 'stop')">STOP</button>
                    <button class="btn btn-warning" onclick="accion(${c.id}, 'restart')">RESTART</button>
                    <button class="btn btn-danger" onclick="eliminar(${c.id})">DELETE</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error cargando contenedores:', error);
    }
}

//---Crear contenedor---
async function crearContenedor() {
    //Obtenemos los valores del formulario
    const nombre = document.getElementById('nuevo-nombre').value.trim();
    const imagen = document.getElementById('nuevo-imagen').value.trim();
    const puerto = document.getElementById('nuevo-puerto').value.trim();

    //Validamos
    if (!nombre || !imagen) {
    document.getElementById('modal-alert').innerHTML = 
        '<div class="alert alert-error">> Nombre e imagen son obligatorios</div>';
    return;
    }

    try {
        //Llamamos a la funcion apiRequest, si va todo bien cerramos la ventana modal y recargamos los contenedores
        await apiRequest('contenedores', 'POST', {
            nombre,
            imagen,
            puerto
        });
        cerrarModal();
        await cargarContenedores();
    } catch (error) {
        document.getElementById('modal-alert').innerHTML = 
        `<div class="alert alert-error">${error.message}</div>`;
    }
}

//--Accion--

//Modificamos el estado del recurso, start, stop y restart
//Despues recargamos la lista para reflejar el nuevo estado
async function accion(id, accion) {
    try {
        //Llamamos a la funcion apiRequest
        await apiRequest(`contenedores/${id}?accion=${accion}`, 'PUT');
        await cargarContenedores();
    } catch (error) {
        console.error(`Error ejecutando ${accion}:`, error);
    }
}

//---Eliminar---

async function eliminar(id) {
    //Pedmimos confirmacion antes de elimina
    if (!confirm('¿Esta seguro que desea eliminar este contenedor?')) return;

    try {
        //Llamamos a la funcion apiRequest
        await apiRequest(`contenedores/${id}`, 'DELETE');
        await cargarContenedores();
    } catch (error) {
        console.error('Error eliminando contenedor:', error);
    }
}


//---PLANTILLAS---

async function cargarPlantillas() {
    try {
        //Esto funciona igual que contenedores
        const plantillas = await apiRequest('plantillas', 'GET');
        const grid = document.getElementById('plantillas-grid');

        if (plantillas.length === 0) {
            grid.innerHTML = '<div class="empty-state">NO HAY PLANTILLAS DISPONIBLES</div>';
            return;
        }

        grid.innerHTML = plantillas.map(p => `
            <div class="plantilla-card" id="card-${p.id}">
                <div class="card-header">
                    <div>
                        <div class="nombre">${p.nombre}</div>
                        <div class="imagen">${p.categoria || 'Sin categoria'}</div>
                    </div>
                </div>
                <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:8px"> 
                    ${p.descripcion || ''}
                </div>
                <div class="acciones">
                    <button class="btn" onclick="desplegarPlantilla(${p.id})">DESPLEGAR</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error cargando plantillas:', error);
    }
}

//---Desplegar plantilla---
async function desplegarPlantilla(id) {
    try {
        //Llamamos a la funcion apiRequest
        await apiRequest('despliegues', 'POST', {id_plantilla: id});
        mostrarPagina('contenedores');
    } catch (error) {
        console.error('Error desplegando plantilla:', error);
    }
}

//---LOGS---

async function cargarLogs() {
    try {
        //Llamamos a la funcion apirquiest
        const logs = await apiRequest('logs', 'GET');
        const tbody = document.getElementById('logs-tbody');

        //Si no hay, mostraremos un mensaje
        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">NO HAY LOGS DISPONIBLES</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(log => `
            <tr>
                <td style="color:var(--text-secondary)">${new Date(log.fecha).toLocaleString('es-ES')}</td>
                <td>${log.nombre_usuario}</td>
                <td>${log.nombre_contenedor}</td>
                <td><span class="accion ${log.accion}">${log.accion.toUpperCase()}</span></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error cargando logs:', error);
    }
}

//----VENTANA MODAL

function abrirModal() {
    document.getElementById('modal-overlay').classList.add('active');
}

function cerrarModal() {
    document.getElementById('modal-overlay').classList.remove('active');

    //Limpiamos el formulario al cerrar
    document.getElementById('nuevo-nombre').value = '';
    document.getElementById('nuevo-imagen').value = '';
    document.getElementById('nuevo-puerto').value = '';
    document.getElementById('modal-alert').innerHTML = '';

}

//---LOGOUT.--

function logout() {
    //Borramos los datos de sesion y mandamos a la pantalal del login
    sessionStorage.clear();
    window.location.href = 'index.html';
}