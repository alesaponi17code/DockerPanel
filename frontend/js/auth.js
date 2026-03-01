function switchTab(tab) {
    //Seleccionamos los elementos con la clase tab y le quitamos la clase active
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.remove('active');
    });

    //Hacemos lo mismo pero con los formularios
    document.querySelectorAll('.form-panel').forEach(p => {
        p.classList.remove('active');
    });

    // Busca la pestaña cuyo atributo onclick coincide con el tab que recibimos
    // Si tab = 'login', busca el elemento con onclick="switchTab('login')" y le añade 'active'
    document.querySelector(`.tab[onclick="switchTab('${tab}')"]`).classList.add('active');

    //Buscamos el formulario con id="panel-login" o panel-registro y le añadimos active para mostrarlo
    document.getElementById(`panel-${tab}`).classList.add('active');

    //Limpiamos cualquie mensjae de error que hubiera estado visible al cambiar de pestaña
    limpiarAlert();
}

//Mostrar alert
function mostrarAlert(mensaje, tipo = 'error') {
    //Creamos el div con la clase alert-error o alert-succes
    document.getElementById('alert-container').innerHTML = `<div class="alert alert-${tipo}">>${mensaje}</div>`;
}

//Limpia alert
function limpiarAlert() {
    //Vaciamos el contenedor de alertas
    document.getElementById('alert-container').innerHTML = '';
}

//----Login----

//Usamos async porque dentro usaremos await con la llamada de la api
async function login() {
    //Obtenemos el valor del input con el id login-email
    const email = document.getElementById('login-email').value.trim();

    //Lee la contraseña
    const password = document.getElementById('login-password').value;

    //Si algunos de los dos estan vacios mostramos error
    if (!email || !password) {
        mostrarAlert('Todos los campos son obligatorios');
        return;
    }

    try {
        //Llamamos a la funcion apiRequest
        const data = await apiRequest('auth', 'POST', {
            action: 'login',
            email,
            password
        });

        //Si llegamos aqui el login esta correcto
        //Guardamos el token usando la funcion de api.js
        setToken(data.token);

        //Guardamos rol y nombre en sessionStorage para usarlos en el dashboard
        sessionStorage.setItem('rol', data.rol);
        sessionStorage.setItem('nombre', data.nombre);

        //Redirigimos al dashboard
        window.location.href = 'dashboard.html';
    }
    catch (error) {
        //Si apirequest manda error, lo mostramos en pantalla
        mostrarAlert(error.message);
    }
}

//----Registro----

async function registro() {
    //Obtenemos los valores
    const nombre = document.getElementById('reg-nombre').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    //Validaremos wue ninguno este vacio
    if (!nombre || !email || !password) {
        mostrarAlert('Todos los campos son obligatorios');
        return;
    }

    try {
        //Llamamos a la funcion apiRequest, esta vez con registro}
        await apiRequest('auth', 'POST', {
            action: 'registro',
            nombre,
            email,
            password
        });

        //Si llegamos aqui el registro esta correcto
        mostrarAlert('Registro correcto, ya puede iniciar sesion', 'success');

        //Cambiamos a la pestaña de login para que pueda iniciar sesion
        switchTab('login');

    } catch (error) {
        //Si hubo un error los mostramos
        mostrarAlert(error.message);
    }
    
}