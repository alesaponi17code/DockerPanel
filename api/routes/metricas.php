<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

$usuario = verificarToken();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $id = $GLOBALS['id'];
        obtenerMetricas($usuario, $id);
        break;
    case 'POST':
        $id = $GLOBALS['id'];
        error_log("ID METRICAS: " . var_export($id, true));
        guardarMetricas($usuario, $id);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Metodo no permitido']);
        break;
}

//----FUNCIONES----
//--Funcion para obtener metricas--
function obtenerMetricas($usuario, $id) {
    //Conectamos a la base de datos
    $db = new Database();
    $conn = $db->getConnection();

    //Comprobamos que el contenedor pertenece al usuario
    $stmt = $conn->prepare('SELECT * FROM contenedores WHERE id = ? AND id_usuario = ?');
    $stmt->execute([$id, $usuario['id']]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Contenedor no encontrado']);
        return;
    }

    //Devuelve las ultimas 20 metricas guardadas
    $stmt = $conn->prepare('SELECT cpu, ram, red, fecha
    FROM metricas
    WHERE contenedor_id = ?
    ORDER BY fecha DESC
    LIMIT 20');
    $stmt->execute([$id]);

    $metricas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($metricas);

}

//--Funcion para guardar metricas--
function guardarMetricas($usuario, $id) {
    //Conectamos a la base de datos
    $db = new Database();
    $conn = $db->getConnection();

    //Comprobamos popiedad del contenedor
    $stmt = $conn->prepare('SELECT * FROM contenedores
    WHERE id = ? AND id_usuario = ?');
    $stmt->execute([$id, $usuario['id']]);
    $contenedor = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$contenedor) {
        http_response_code(404);
        echo json_encode(['error' => 'Contenedor no encontrado']);
        return;
    }

    //Obtenemos las metricas reales de docke usando shell_exec
    $dockerId = escapeshellarg($contenedor['docker_id']);
    $stats = shell_exec("docker stats $dockerId --no-stream --format \"{{.CPUPerc}},{{.MemUsage}},{{.NetIO}}\" 2>&1");

    if (!$stats) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al obtener las metricas de Docker']);
        return;
    }
    
    // Parseamos la salida de docker stats
    $partes = explode(',', trim($stats));
    $cpu = floatval(str_replace('%', '', $partes[0]));

    $ramPartes = explode('/', $partes[1]);
    $ram = floatval($ramPartes[0]);
    
    $redPartes = explode('/', $partes[2]);
    $red = floatval($redPartes[0]);

    //Guardamos las metricas en la base de datos
    $stmt = $conn->prepare('INSERT INTO metricas (id_contenedor, cpu, ram, red) VALUES (?, ?, ?, ?)');
    $stmt->execute([$id, $cpu, $ram, $red]);

    //Devolvemos los bvalores guardados
    echo json_encode(['cpu' => $cpu, 'ram' => $ram, 'red' => $red]);

}
