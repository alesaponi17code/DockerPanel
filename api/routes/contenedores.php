<?php
//Cargamos la clase database para poder conectar con mysql
require_once __DIR__ . '/../config/database.php';
//Cargamos middleware-auth.php para verificar token y sesiones
require_once __DIR__ . '/../middleware/auth.php';

$usuario = verificarToken(); //Verifica el token

//Metodo HTTP de la petición
$method = $_SERVER["REQUEST_METHOD"];

switch ($method) {
    case 'GET':
        listarContenedores($usuario);
        break;
    case 'POST':
        crearContenedor($usuario);
        break;
    case 'PUT':
        $accion = $_GET['accion'] ?? '';
        accionContenedor($usuario ,$id, $accion);
        break;
    case 'DELETE':
        eliminarContenedor($usuario, $id);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Metodo no permitido']);
        break;
}

//----FUNCIONES----
function listarContenedores($usuario) {
    //Conectamos a la base de datos
    $db = new Database();
    $conn = $db->getConnection();

    //Si es admin ve todos, sino solo los suyos
    if ($usuario['rol'] === 'admin') {
        $stmt = $conn->prepare('SELECT * FROM contenedores');
        $stmt->execute();
    } else {
        $stmt = $conn->prepare('SELECT * FROM contenedores WHERE usuario_id = ?');
        $stmt->execute([$usuario['id']]);
    }

    $contenedores = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($contenedores);
}

function crearContenedor($usuario) {
    // Leemos el contenido de la peticion y lo convertimos de JSON a array
    $data = json_decode(file_get_contents('php://input'), true);

        //Comprobamos que lleguen todos los campos obligfatorios
    if (empty($data['nombre']) || empty($data['imagen'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Faltan campos obligatorios']);
        return;
    }

    // Escapamos los datos del usuario para evitar command injection
    $nombre = escapeshellarg($data['nombre']);
    $imagen = escapeshellarg($data['imagen']);
    //Guardamos el puerto que viene en el JSON
    $puerto = $data['puerto'] ?? '';
    $puertoFlag = $puerto ? "-p $puerto" : "";

    //Ejecutamos elk comando docker run en el sistema
    $cmd = "docker run -d --name $nombre $puertoFlag $imagen 2>&1";
    $output = shell_exec($cmd);

    //Si falla el comando docker
    if (!$output) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al crear el contenedor']);
        return;
    }

    //ID que devuelve Docker
    $dockerID = trim($output);

    //Guardamos la informacion en la base de datos
    $db = new Database();
    $conn = $db->getConnection();

    $stmt = $conn->prepare("INSERT INTO contenedores (id_usuario, docker_id, nombre, imagen, estado, puerto) VALUES (?, ?, ?, ?, 'running', ?)");
    $stmt->execute([$usuario['id'], $dockerID, $data['nombre'], $data['imagen'], $puerto]);

    $contenedorID = $conn->lastInsertId();

        //Guardamos en logs
    guardarLog($conn, $contenedorID, $usuario['id'], 'create');

    //Devolvemos mensaje de exito
    http_response_code(201);
    echo json_encode(['mensaje' => 'Contenedor creado correctamente']);
}

function accionContenedor($usuario, $id, $accion) {
    $db = new Database();
    $conn = $db->getConnection();

    //Verificamos que el contenedor pertenece al usuario
    $stmt = $conn->prepare('SELECT * FROM contenedores WHERE id = ? AND id_usuario = ?');
    $stmt->execute([$id, $usuario['id']]);
    $contenedor = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$contenedor) {
        http_response_code(404);
        echo json_encode(['error' => 'Contenedor no encontrado']);
        return;
    }

    //Array con las acciones permitidas
    $accionesValidas = ['start', 'stop', 'restart'];
    if (in_array($accion, $accionesValidas)) {
        http_response_code(400);
        echo json_encode(['error' => 'Accion no valida']);
        return;
    }

    //Ejecutamos el comando docker
    $dockerId = escapeshellarg($contenedor['docker_id']);
    shell_exec("docker $accion $dockerId 2>&1");

    $estado = $accion === 'stop' ? 'stopped' : 'running';
    $stmt = $conn->prepare('UPDATE contenedores SET estado = ? WHERE id = ?');
    $stmt->execute([$estado, $id]);

    //Guardamos en logs
    guardarLog($conn, $id, $usuario['id'], $accion);

    //Devolvemos mensaje de exito
    echo json_encode(['mensaje' => "Accion '$accion' realizada correctamente"]);
}

function eliminarContenedor($usuario, $id) {
    $db = new Database();
    $conn = $db->getConnection();

    $stmt = $conn->prepare('SELECT * FROM contenedores WHERE id = ? AND id_usuario = ?');
    $stmt->execute([$id, $usuario['id']]);
    $contenedor = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$contenedor) {
        http_response_code(404);
        echo json_encode(['error' => 'Contenedor no encontrado']);
        return;
    }

    //Ejecutamos el comando docker para detener y eliminar
    $dockerId = escapeshellarg($contenedor['docker_id']);
    shell_exec("docker stop $dockerId 2>&1");
    shell_exec("docker rm $dockerId 2>&1");

    //Elim inamos el registro de la base de datos
    $stmt = $conn->prepare('DELETE FROM contenedores WHERE id = ?');
    $stmt->execute([$id]);

    //Guardamos en logs
    guardarLog($conn, $id, $usuario['id'], 'delete');

    //Devolvemos mensaje de exito
    echo json_encode(['mensaje' => 'Contenedor eliminado correctamente']);
}

//----Guardar Log----
function guardarLog($conn, $idContenedor, $idUsuario, $accion) {
    //Inserta un registro en la tabla logs
    $stmt = $conn->prepare("INSERT INTO logs (contenedor_id, usuario_id, accion) VALUES (?, ?, ?)");
    $stmt->execute([$idContenedor, $idUsuario, $accion]);
}
