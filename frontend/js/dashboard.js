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
    if (pagina === 'metricas') cargarContenedoresSelect();

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


//---METRICAS--

let chartCpu = null;
let chartRam = null;
let intervaloMetricas = null;
let contenedorSeleccionado = null;

//Maximo de puntos en la gráfica
const MAX_PUNTOS = 20;

//Funcion
async function cargarContenedoresSelect() {
    try {
        //Llamamos a la funcion apiRequest
        const contenedores = await apiRequest('contenedores', 'GET');
        const select = document.getElementById('select-contenedor');

        //Limpiamos las opciones anteriores menos la primera
        select.innerHTML = '<option value="">-- Seleccione un contenedor --</option>';

        //Solo mostramos los contenedores que esten en running
        contenedores
            .filter(c => c.estado === 'running')
            .forEach(c => {
                select.innerHTML += `<option value="${c.id}">${c.nombre} (${c.imagen})</option>`;
            });
    } catch (error) {
        console.error('Error cargando contenedores para métricas:', error);
    }

}

function iniciarMonitorizacion() {
    //Obtenemos el id del contenedor seleccionado
    const id = document.getElementById('select-contenedor').value;

    //Si habia un intervalo anterior lo limpiamos
    if (intervaloMetricas) {
        clearInterval(intervaloMetricas);
        intervaloMetricas = null;
    }

    //Si no hay contenedor lo ocultamos
    if (!id) {
        document.getElementById('metricas-container').style.display = 'none';
        document.getElementById('metricas-empty').style.display = 'block';
    
        return;
    }
    

    contenedorSeleccionado = id;

    document.getElementById('metricas-container').style.display = 'block';
    document.getElementById('metricas-empty').style.display = 'none';


    //Inicializamos las gráficas
    inicializarGraficas();

    //Ejecutamos inmedietamente y cada 3 segundoas
    obtenerMetricas();
    intervaloMetricas = setInterval(obtenerMetricas, 3000);
}


function inicializarGraficas() {
    //Destruimos las graficas anteriores en el caso de que existan
    if (chartCpu) { chartCpu.destroy(); chartCpu = null; }
    if (chartRam) { chartRam.destroy(); chartRam = null; }

    const opcionesBase = {
        responsive: true,
        animation: { duration: 300 },
        scales: {
            x: {
                ticks: { color: '#6a9e6a', font: { family: 'Share Tech Mono', size: 10 } },
                grid: { color: '#1a2e1a' }
            },
            y: {
                ticks: { color: '#6a9e6a', font: { family: 'Share Tech Mono', size: 10 } },
                grid: { color: '#1a2e1a' },
                beginAtZero: true
            }
        },
        plugins: { legend: { display: false } }
    };

    // Gráfica CPU
    chartCpu = new Chart(document.getElementById('chart-cpu'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                data: [],
                borderColor: '#00ff41',
                backgroundColor: 'rgba(0, 255, 65, 0.05)',
                borderWidth: 2,
                pointRadius: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: { ...opcionesBase, scales: { ...opcionesBase.scales, y: { ...opcionesBase.scales.y, max: 100 } } }
    });

    // Gráfica RAM
    chartRam = new Chart(document.getElementById('chart-ram'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                data: [],
                borderColor: '#ffcc00',
                backgroundColor: 'rgba(255, 204, 0, 0.05)',
                borderWidth: 2,
                pointRadius: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: opcionesBase
    });
}

async function obtenerMetricas() {
    try {
        //Llamamos a la funcion apiRequest
        const data = await apiRequest(`metricas/${contenedorSeleccionado}`, 'POST');

        //Actualizamos las valores numericos
        document.getElementById('metric-cpu').textContent = data.cpu.toFixed(2) + '%';
        document.getElementById('metric-ram').textContent = data.ram.toFixed(2) + ' MB';
        document.getElementById('metric-red').textContent = data.red.toFixed(2) + ' KB';

        //Añadimos el punto de las graficas
        const horaActual = new Date().toLocaleTimeString('es-ES');

        agregarPunto(chartCpu, horaActual, data.cpu);
        agregarPunto(chartRam, horaActual, data.ram);

    } catch (error) {
        console.error('Error obteniendo métricas:', error);
        clearInterval(intervaloMetricas);
    
    }
}

function agregarPunto(chart, label, value) {
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(value);

    //Si hay mas puntos del maximo elimina,mos el primero
    if (chart.data.labels.length > MAX_PUNTOS) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }

    chart.update();
}