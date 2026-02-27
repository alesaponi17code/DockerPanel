<?php

//Nombramos una clase llamada Database para gestionar la conexion a la base de datos, instanciandola desde cualquier archivo y asi no repetir código
class Database {

    //Ponemos variables privadas para que solo se puedan usar en esta clase
    private $host = 'localhost'; //Servidor donde esta la base de datos
    private $dbname = 'dockerpanel'; //Nombre de la base de datos
    private $user = 'root'; //Usuario de la base de datos
    private $password = ''; //Contraseña del usuario
    private $conn;  //Variable donde guardamos la conexión

    //Funcion para obtener la conexion
    public function getConnection() {

        //Inicializamos la conexion a null por seguritdad
        $this->conn = null;

        try {
            //Intentamos conectar a la base de datos con PDO
            $this->conn = new PDO('mysql:host=' . $this->host . ';dbname=' . $this->dbname, $this->user, $this->password);

            //Configuramos PDO para que lance excepciones si hay errores
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            //Ponemos la codificacion en UTF-8 para evitar problemas con las tildes y otros caracteres
            $this->conn->exec("set names utf8");
        
    } catch (PDOException $e) {
        //Si ocurrer un error de conexion lo capturamos aqui
        echo json_encode(['error' => "Conexión fallida: " . $e->getMessage()]);
    }

    //Devolvemos la conexion si ha ido bien o null si falla
    return $this->conn;
    }
}
