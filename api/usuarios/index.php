<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAdmin($db);
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $db->query('SELECT id, uid, nombre_usuario, nombre_completo, email, telefono, rol, nivel, activo, fecha_registro FROM usuarios ORDER BY fecha_registro DESC');
        respondSuccess(['usuarios' => $stmt->fetchAll()]);
        break;

    case 'PATCH':
    case 'PUT':
        $input = getJsonInput();
        $id = isset($_GET['id']) ? (int)$_GET['id'] : (int)($input['id'] ?? 0);
        if ($id <= 0) {
            respondError('Identificador invalido');
        }

        $fields = [];
        $params = ['id' => $id];

        if (array_key_exists('rol', $input)) {
            $fields[] = 'rol = :rol';
            $params['rol'] = $input['rol'];
        }

        if (array_key_exists('nivel', $input)) {
            $fields[] = 'nivel = :nivel';
            $params['nivel'] = $input['nivel'];
        }

        if (array_key_exists('activo', $input)) {
            $fields[] = 'activo = :activo';
            $params['activo'] = (int)($input['activo'] ? 1 : 0);
        }

        if (empty($fields)) {
            respondError('No hay cambios para aplicar');
        }

        $sql = 'UPDATE usuarios SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        respondSuccess(['updated' => true]);
        break;

    default:
        respondError('Metodo no permitido', 405);
}