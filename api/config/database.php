<?php
declare(strict_types=1);

use PDO;

class Database
{
    private string $host;
    private string $db;
    private string $username;
    private string $password;
    private string $charset = 'utf8mb4';

    public function __construct()
    {
        $this->host = getenv('DB_HOST') ?: '127.0.0.1';
        $this->db = getenv('DB_NAME') ?: 'alquimia_esencial';
        $this->username = getenv('DB_USER') ?: 'root';
        $this->password = getenv('DB_PASSWORD') ?: '';
    }

    public function getConnection(): PDO
    {
        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $this->host, $this->db, $this->charset);
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        return new PDO($dsn, $this->username, $this->password, $options);
    }
}