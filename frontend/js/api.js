//URL base de ,a api
const API_URL = 'http://localhost/dockerpanel/api'

//Guardamos el token en la memoria, no en localstorage por seguridad
let authToken = null;

//Funcion para guardar el token despues del login
function setToken(token) {
    authToken = token;
}

//Funcion para obtener el token
function getToken() {
    return authToken;
}

//Funcion generica para hacer peticiones a la API
async function apiRequest(endpoint, method = 'GET', body = null) {
    //Cabeceras basicas
    const headers = {
        'Content-Type': 'application/json'
    };

    //Si hay token lo enviamos en la cabecer Authorization
    if (authToken()) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    //Configuracion de la peticion
    const config = {
        method,
        headers
    };

    //Si hay cuerpo (POST, PUT) lo convertimos a JSON
    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        //Realizamos la peticion a la API
        const response = await fetch(`${API_URL}/${endpoint}`, config);

        //Convertimos la respuesta a JSON
        const data = await response.json();

        //Si la respuesta no es OK
        if (!response.ok) {
            throw { status: response.status, message: data.error || 'Error desconocido' };
        }

        //Si todo va bien devolvemos los datos
        return data;
    } catch (error) {
        //Propagamos el erro al codigo que llamo a la funcion
        throw error;
    }

}