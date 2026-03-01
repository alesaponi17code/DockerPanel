<?php
//Cargamos la clase database para poder conectar con mysql
require_once __DIR__ . '/../config/database.php';
//Cargamos composer autolad para usar librerias externas
require_once __DIR__ . '/../../vendor/autoload.php';

//Clases que vamos a usar para crear y verificar JWT
use Firebase\JWT\JWT;
use Firebase\JWT\Key;


//Clave secreta para firmar los tokens
$secretKey = "dockerpanel_secret_key_medac_sevilla_2026_tfg_daw";

//Metodo HTTP de la petición
$method = $_SERVER["REQUEST_METHOD"];

switch ($method) {
    case 'POST':
        // Leemos el contenido de la peticion y lo convertimos de JSON a array
        $data = json_decode(file_get_contents('php://input'), true);

        //Moiramos que accion quiere hacer el usuario, si registro o login
        $action = $data['action'] ?? '';

        if ($action === 'login') {
            // LLamamos a la funcion login
            login($data);
        } elseif ($action === 'registro') {
            // LLamamos a la funcion register
            registro($data);
        } else {
            // Si la accion no existe devolveremos el error 400
            http_response_code(400);
            echo json_encode(['error' => 'Accion no valida']);
        }
        break;

    default:
        // Si el metodo no es POST devolveremos el error 405
        http_response_code(405);
        echo json_encode(['error' => 'Metodo no permitido']);
        break;
    }

//----FUNCIONES----

//Funcion para registrar a un usuario

function registro($data) {

    //Comprobamos que lleguen todos los campos obligfatorios
    if (empty($data['nombre']) || empty($data['email']) || empty($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Faltan campos obligatorios']);
        return;
    }

    //Conectamos a la base de datos
    $db = new Database();
    $conn = $db->getConnection();

    //Comrpobamos si el email esta registrado
    $stmt = $conn->prepare('SELECT * FROM usuarios WHERE email = ?');
    $stmt->execute([$data['email']]);

    if ($stmt->rowCount() > 0) {
        //Si existiense devolvemos error 409
        http_response_code(409);
        echo json_encode(['error' => 'El email ya esta registrado']);
        return;
    }

    //Encriptamos la contraseña usando BCRYPT
    $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT);

    //Insertamos el usuario en la base de datos con rol por defecto user
    $stmt = $conn->prepare('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)');
    $stmt->execute([$data['nombre'], $data['email'], $passwordHash, 'user']);

    //Devolvemos mensaje de exito
    http_response_code(201);
    echo json_encode(['mensaje' => 'Usuario registrado correctamente']);
}


//Funcion para el login y generar JWT
function login($data) {
    global $secretKey; //Cogemos la clave secreta definida arriba

    //Comprobamos que lleguen todos los campos obligfatorios
    if (empty($data['email']) || empty($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Faltan campos obligatorios']);
        return;
    }

    // Conectamos con la base de datos
    $db = new Database();
    $conn = $db->getConnection();

    // Comprobamos si el usuario existe por email
    $stmt = $conn->prepare('SELECT * FROM usuarios WHERE email = ?');
    $stmt->execute([$data['email']]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || !password_verify($data['password'], $usuario['password'])) {
        // Si no existe devolvemos error
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales incorrectas']);
        return;
    }

    error_log("EMAIL BUSCADO: " . $data['email']);
error_log("USUARIO ENCONTRADO: " . print_r($usuario, true));
error_log("PASSWORD RECIBIDO: " . $data['password']);
error_log("HASH EN BBDD: " . ($usuario ? $usuario['password'] : 'NO EXISTE'));
error_log("VERIFY: " . ($usuario ? (password_verify($data['password'], $usuario['password']) ? 'OK' : 'FALLO') : 'N/A'));

    //Creamos el token JWT
    $payload = [
        'id' => $usuario['id'],
        'nombre' => $usuario['nombre'],
        'rol' => $usuario['rol'],
        'exp' => time() + (60 * 60 * 8) // Expira en 8 horas
    ];

    //Generamos el token JWT usando HS256
    $token = JWT::encode($payload, $secretKey, 'HS256');

    //Devolvemos el token
    echo json_encode(['token' => $token,
    'nombre' => $usuario['nombre'],
    'rol' => $usuario['rol']
    ]);
}
