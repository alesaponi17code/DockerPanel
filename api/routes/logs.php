<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

$usuario = verificarToken(); //Verifica el token

//Metodo HTTP de la petición
$method = $_SERVER["REQUEST_METHOD"];

switch ($method) {
    case 'GET':
        listarLogs($usuario);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Metodo no permitido']);
        break;
}

//----FUNCIONES----
function listarLogs($usuario) {
    //Conectamos a la base de datos
    $db = new Database();
    $conn = $db->getConnection();

    //Admin ve todo los logs y el usuario solo los suyos
    if ($usuario['rol'] === 'admin') {
        $stmt = $conn->prepare('SELECT logs.*, usuarios.nombre as nombre_usuario, contenedores.nombre as nombre_contenedor
        FROM logs
        JOIN usuarios ON logs.usuario_id = usuarios.id
        JOIN contenedores ON logs.contenedor_id = contenedores.id
        ORDER BY logs.fecha DESC');
        $stmt->execute();
    } else {
        $stmt = $conn->prepare('SELECT logs.*, usuarios.nombre as nombre_usuario, contenedores.nombre as nombre_contenedor
        FROM logs
        JOIN usuarios ON logs.usuario_id = usuarios_id
        JOIN contenedores ON logs.contenedor_id = contenedores.id
        WHERE logs.usuario_id = ?
        ORDER BY logs.fecha DESC');
        $stmt->execute([$usuario['id']]);
    }
    //Obtiene lo resultados como array
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    //Devolvemos los logs en JSON
    echo json_encode($logs);
}
