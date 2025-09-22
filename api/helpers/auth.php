<?php
declare(strict_types=1);

require_once __DIR__ . '/response.php';

function findUserByToken(\PDO $db, ?string $token): ?array
{
    if ($token === null || trim($token) === '') {
        return null;
    }

    $statement = $db->prepare('SELECT id, uid, nombre_usuario, nombre_completo, email, telefono, rol, nivel, modo, activo, fecha_registro FROM usuarios WHERE uid = :uid AND activo = 1 LIMIT 1');
    $statement->execute(['uid' => $token]);
    $user = $statement->fetch();

    return $user ?: null;
}

function requireAuth(\PDO $db): array
{
    $token = getBearerToken();
    $user = findUserByToken($db, $token);

    if ($user === null) {
        respondError('No autorizado', 401);
    }

    return $user;
}

function requireAdmin(\PDO $db): array
{
    $user = requireAuth($db);
    if (($user['rol'] ?? '') !== 'admin') {
        respondError('Acceso restringido para administradores', 403);
    }

    return $user;
}
