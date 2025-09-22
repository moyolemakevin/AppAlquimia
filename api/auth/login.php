<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$input = getJsonInput();
$username = trim((string)($input['username'] ?? ''));
$password = (string)($input['password'] ?? '');

if ($username === '' || $password === '') {
    respondError('Usuario y clave son obligatorios');
}

$query = $db->prepare('SELECT id, uid, nombre_usuario, clave, nombre_completo, email, telefono, rol, nivel, modo, activo, fecha_registro FROM usuarios WHERE nombre_usuario = :username OR email = :email LIMIT 1');
$query->execute([
    'username' => $username,
    'email' => $username,
]);
$user = $query->fetch();

if (!$user) {
    respondError('Credenciales invalidas', 401);
}

if ((int)$user['activo'] !== 1) {
    respondError('La cuenta esta desactivada, contacta al administrador', 403);
}

if (!password_verify($password, $user['clave'])) {
    respondError('Credenciales invalidas', 401);
}

if (empty($user['uid'])) {
    $user['uid'] = bin2hex(random_bytes(16));
    $update = $db->prepare('UPDATE usuarios SET uid = :uid WHERE id = :id');
    $update->execute(['uid' => $user['uid'], 'id' => $user['id']]);
}

unset($user['clave']);

respondSuccess([
    'token' => $user['uid'],
    'user' => [
        'id' => (int)$user['id'],
        'uid' => $user['uid'],
        'username' => $user['nombre_usuario'],
        'name' => $user['nombre_completo'],
        'email' => $user['email'],
        'phone' => $user['telefono'],
        'role' => $user['rol'],
        'level' => $user['nivel'],
        'mode' => $user['modo'],
        'active' => (bool)$user['activo'],
        'registeredAt' => $user['fecha_registro'],
    ],
]);
