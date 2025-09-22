<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$input = getJsonInput();
$username = trim((string)($input['username'] ?? ''));
$password = (string)($input['password'] ?? '');
$email = trim((string)($input['email'] ?? ''));
$name = trim((string)($input['name'] ?? ''));
$phone = trim((string)($input['phone'] ?? ''));

if ($username === '' || $password === '' || $email === '' || $name === '') {
    respondError('Completa todos los campos obligatorios');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respondError('Correo electronico invalido');
}

$exists = $db->prepare('SELECT COUNT(*) AS total FROM usuarios WHERE nombre_usuario = :username OR email = :email');
$exists->execute(['username' => $username, 'email' => $email]);
$count = (int)($exists->fetch()['total'] ?? 0);

if ($count > 0) {
    respondError('El usuario o correo ya estan registrados', 409);
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$uid = bin2hex(random_bytes(16));

$insert = $db->prepare('INSERT INTO usuarios (uid, nombre_usuario, clave, email, telefono, nombre_completo, modo, nivel, rol, activo) VALUES (:uid, :username, :clave, :email, :telefono, :nombre, :modo, :nivel, :rol, :activo)');
$insert->execute([
    'uid' => $uid,
    'username' => $username,
    'clave' => $hash,
    'email' => $email,
    'telefono' => $phone !== '' ? $phone : null,
    'nombre' => $name,
    'modo' => 'email',
    'nivel' => 'Novato',
    'rol' => 'usuario',
    'activo' => 1,
]);

$userId = (int)$db->lastInsertId();

respondSuccess([
    'token' => $uid,
    'user' => [
        'id' => $userId,
        'uid' => $uid,
        'username' => $username,
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'role' => 'usuario',
        'level' => 'Novato',
    ],
], 201);
