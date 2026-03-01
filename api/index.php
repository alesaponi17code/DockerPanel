<?php
header("Access-Control-Allow-Origin: *");  //Esto es CORS, permite que cualquier frontend pueda llamar a mi API
header("Content-Type: application/json; charset=utf-8"); //Hace que todo lo que devuelva esta API es JSON
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); //Los métodos HTTP que acepto
header("Access-Control-Allow-Headers: Content-Type, Authorization"); //Permiten que envien JSON y Tokens


//Si el metodo es Options devolveremos codigo 200 y terminamos la ejecucion
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

//Esto obtiene la ruta de la petición. Ej:hhtp://localhost/api/contenedores/5
//Con $uri seria /api/contenedores/5
$uri = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
//Esto lo transforma a un array para trabajar con el
$uri = explode('/', $uri);

//Buscamos en que posicion esta api
$apiPos = array_search('api', $uri);
//Esto hace que lo que venga despues de api sea el recurso, en el ejemplo es "contenedores"
$resource = $uri[$apiPos + 1] ?? '';
//Esto pilla el id que es lo que viene despue, si no tiene se le asigna null
$id = $uri[$apiPos + 2] ?? null;


$GLOBALS['id'] = $id;


//Esto segun el nombre de archivo que se encuentre en resource se manda a un sitio u otro
switch ($resource) {
    case 'auth':
        require_once 'routes/auth.php';
        break;
    case 'contenedores':
        require_once 'routes/contenedores.php';
        break;
    case 'plantillas':
        require_once 'routes/plantillas.php';
        break;
    case 'logs':
        require_once 'routes/logs.php';
        break;
    case 'metricas':
        require_once 'routes/metricas.php';
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Recurso no encontrado']);
        break;
}
