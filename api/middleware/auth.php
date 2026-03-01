<?php
//Cargamos composer autolad para usar librerias externas
require_once __DIR__ . '/../../vendor/autoload.php';

//Clases que vamos a usar para crear y verificar JWT
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function verificarToken() {
    $secretKey = "dockerpanel_secret_key_medac_sevilla_2026_tfg_daw"; //Clave secreta para firmar y verificar el token
    
    $headers = getallheaders(); //Obtiene los headers HTTP enviados en la peticion
    $authHeader = $headers['Authorization'] ?? ''; //Obtiene el header Authorization si existe, sino se queda vacio

    if (empty($authHeader)) {
        //Si no existe el header Authorization
        http_response_code(401);
        echo json_encode(['error' => 'Token no proporcionado']);
        exit();
}

    $token = str_replace('Bearer ', '', $authHeader); //Elimina Bearer del inicio para quedar solo con el token

    try {
        $decoded = JWT::decode($token, new Key ($secretKey, 'HS256')); //Decodifica el token
        return (array) $decoded; //Devolvemos los datos del usuario en formato array
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Token invalido o expirado']);
            exit();
        }
}

function soloAdmin() {
    $usuario = verificarToken(); //Verifica el token

    if ($usuario['rol'] !== 'admin') {
        //Si el usuario no es admin
        http_response_code(403);
        echo json_encode(['error' => 'No tienes permisos para realizar esta acción']);
        exit();
    }
    
    return $usuario; //Devolvemos los datos del usuario si esta correcto
}

