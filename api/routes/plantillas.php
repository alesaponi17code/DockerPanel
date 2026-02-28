<?php
//Cargamos la base de datos
require_once __DIR__ . '/../config/database.php';
//Cargamos middleware-auth.php para verificar token y sesiones
require_once __DIR__ . '/../middleware/auth.php';

$usuario = verificarToken(); //Verifica el token

//Metodo HTTP de la petición
$method = $_SERVER["REQUEST_METHOD"];

switch ($method) {
    case 'GET':
        listarPlantillas();
        break;
    case 'POST':
        crearPlantilla($usuario);
        break;
    case 'DELETE':
        eliminarPlantilla($usuario, $id);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Metodo no permitido']);
        break;
}

//----FUNCIONES----
//--Listar planyillas--
function listarPlantillas() {
    //Conectamos a la base de datos
    $db = new Database();
    $conn = $db->getConnection();

    $stmt = $conn->prepare('SELECT * FROM plantillas');
    $stmt->execute();

    $plantillas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($plantillas);
}

//--Crear plantilla--
function crearPlantilla($usuario) {
    //Solo los admins pueden crear plantillas
    if ($usuario['rol'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'No tienes permisos para realizar esta acción']);
        return;
    }

    //Leemos los datos enviados en formato JSON
    $data = json_decode(file_get_contents('php://input'), true);

    //Validacion de campos onligatorios
    if (empty($data['nombre']) || empty($data['compose_yml'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Faltan campos obligatorios']);
        return;
    }
    
    //Conectamos con la base de datos
    $db = new Database();
    $conn = $db->getConnection();

    //Insertamos la plantilla en la tabla de plantillas
    $stmt = $conn->prepare('INSERT INTO plantillas (nombre, descripcion, compose_yml, categoria');
    $stmt->execute([
        $data['nombre'],
        $data['descripcion'] ?? '', //Opcional
        $data['compose_yml'],
        $data['categoria'] ?? '' //Opcional
    ]);
    
    //Devolvemos mensaje de exito
    http_response_code(201);
    echo json_encode(['mensaje' => 'Plantilla creada correctamente']);
}

//--Eliminar plantilla
function eliminarPlantilla($usuario, $id) {
    //Solo los admins eliminan plantillas
    if ($usuario['rol'] !== 'admin') {
        http_response_code(403);
        echo json_encode(["error" => "Solo los administradores pueden eliminar plantillas"]);
        return;
    }

    //Conectamos con la base de datos
    $db = new Database();
    $conn = $db->getConnection();

    //Comprobamos que la plantilla existe
    $stmt = $conn->prepare('SELECT * FROM plantillas WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Plantilla no encontrada']);
        return;
    }

    //Eliminamos la plantilla de la base de daros
    $stmt = $conn->prepare('DELETE FROM plantillas WHERE id = ?');
    $stmt->execute([$id]);

        //Devolvemos mensaje de exito
    http_response_code(200);
    echo json_encode(['mensaje' => 'Plantilla eliminada correctamente']);


}
