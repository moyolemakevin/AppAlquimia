<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$user = requireAuth($db);
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $db->prepare('SELECT id, uid, nombre_usuario, nombre_completo, email, telefono, rol, nivel, modo, fecha_registro FROM usuarios WHERE id = :id');
        $stmt->execute(['id' => $user['id']]);
        $profile = $stmt->fetch();

        $statsStmt = $db->prepare('SELECT total_aceites_explorados, favoritos_total, tips_recibidos, tiempo_uso_app, ultimos_aceites, ultimo_login FROM estadisticas_usuario WHERE usuario_id = :usuario LIMIT 1');
        $statsStmt->execute(['usuario' => $user['id']]);
        $stats = $statsStmt->fetch();

        respondSuccess([
            'profile' => $profile,
            'stats' => $stats ?: null,
        ]);

        break;

    case 'PUT':
    case 'PATCH':
        $input = getJsonInput();
        $nombre = array_key_exists('nombre_completo', $input) ? trim((string)$input['nombre_completo']) : null;
        $telefono = array_key_exists('telefono', $input) ? trim((string)$input['telefono']) : null;
        $email = array_key_exists('email', $input) ? trim((string)$input['email']) : null;
        $password = array_key_exists('password', $input) ? (string)$input['password'] : null;

        if ($email !== null) {
            if ($email === '') {
                respondError('El correo no puede estar vacio');
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                respondError('Correo electronico invalido');
            }

            $check = $db->prepare('SELECT COUNT(*) AS total FROM usuarios WHERE email = :email AND id <> :id');
            $check->execute(['email' => $email, 'id' => $user['id']]);
            if ((int)($check->fetch()['total'] ?? 0) > 0) {
                respondError('El correo ya esta registrado por otro usuario', 409);
            }
        }

        $fields = [];
        $params = ['id' => $user['id']];

        if ($nombre !== null) {
            $fields[] = 'nombre_completo = :nombre';
            $params['nombre'] = $nombre;
        }

        if ($telefono !== null) {
            $fields[] = 'telefono = :telefono';
            $params['telefono'] = $telefono === '' ? null : $telefono;
        }

        if ($email !== null) {
            $fields[] = 'email = :email';
            $params['email'] = $email;
        }

        if ($password !== null) {
            if ($password === '') {
                respondError('La clave no puede estar vacia');
            }

            $fields[] = 'clave = :clave';
            $params['clave'] = password_hash($password, PASSWORD_BCRYPT);
        }

        if (empty($fields)) {
            respondError('No hay cambios para aplicar');
        }

        $sql = 'UPDATE usuarios SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $update = $db->prepare($sql);
        $update->execute($params);

        $refresh = $db->prepare('SELECT id, uid, nombre_usuario, nombre_completo, email, telefono, rol, nivel, modo, fecha_registro FROM usuarios WHERE id = :id');
        $refresh->execute(['id' => $user['id']]);

        respondSuccess([
            'updated' => true,
            'profile' => $refresh->fetch(),
        ]);

        break;

    default:
        respondError('Metodo no permitido', 405);
}