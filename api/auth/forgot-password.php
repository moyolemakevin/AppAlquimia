<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$input = getJsonInput();
$username = trim((string)($input['username'] ?? ''));
$answer = trim((string)($input['answer'] ?? ''));
$newPassword = (string)($input['newPassword'] ?? '');

if ($username === '') {
    respondError('El nombre de usuario o correo es obligatorio');
}

$query = $db->prepare('SELECT id, pregunta_seguridad, respuesta_seguridad FROM usuarios WHERE nombre_usuario = :username OR email = :username LIMIT 1');
$query->execute(['username' => $username]);
$user = $query->fetch();

if (!$user) {
    respondError('Usuario no encontrado', 404);
}

if ($answer === '' || $newPassword === '') {
    respondSuccess([
        'question' => $user['pregunta_seguridad'],
        'requiresAnswer' => true,
    ]);
}

$expected = trim((string)$user['respuesta_seguridad']);
if ($expected === '') {
    respondError('No hay respuesta de seguridad registrada, contacta al administrador', 400);
}

$normalize = static function (string $value): string {
    if (function_exists('mb_strtolower')) {
        return mb_strtolower($value);
    }

    return strtolower($value);
};

if ($normalize($expected) !== $normalize($answer)) {
    respondError('Respuesta de seguridad incorrecta', 401);
}

$hash = password_hash($newPassword, PASSWORD_BCRYPT);
$update = $db->prepare('UPDATE usuarios SET clave = :clave WHERE id = :id');
$update->execute(['clave' => $hash, 'id' => $user['id']]);

respondSuccess(['message' => 'La clave fue actualizada correctamente']);