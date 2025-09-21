<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $search = trim((string)($_GET['q'] ?? ''));
        $tipo = trim((string)($_GET['tipo'] ?? ''));

        $sql = 'SELECT * FROM tips WHERE 1 = 1';
        $params = [];

        if ($search !== '') {
            $sql .= ' AND (titulo LIKE :search OR contenido LIKE :search)';
            $params['search'] = '%' . $search . '%';
        }

        if ($tipo !== '') {
            $sql .= ' AND tipo LIKE :tipo';
            $params['tipo'] = '%' . $tipo . '%';
        }

        $sql .= ' ORDER BY fecha_publicacion DESC';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $tips = $stmt->fetchAll();

        respondSuccess(['tips' => $tips]);

        break;

    case 'POST':
        requireAdmin($db);
        $input = getJsonInput();
        $titulo = trim((string)($input['titulo'] ?? ''));
        $contenido = trim((string)($input['contenido'] ?? ''));

        if ($titulo === '' || $contenido === '') {
            respondError('El titulo y contenido son obligatorios');
        }

        $insert = $db->prepare('INSERT INTO tips (titulo, contenido, imagen_url, video_url, tipo) VALUES (:titulo, :contenido, :imagen, :video, :tipo)');
        $insert->execute([
            'titulo' => $titulo,
            'contenido' => $contenido,
            'imagen' => $input['imagen_url'] ?? null,
            'video' => $input['video_url'] ?? null,
            'tipo' => $input['tipo'] ?? null,
        ]);

        respondSuccess(['id' => (int)$db->lastInsertId()], 201);

        break;

    case 'PUT':
    case 'PATCH':
        requireAdmin($db);
        $input = getJsonInput();
        $id = isset($_GET['id']) ? (int)$_GET['id'] : (int)($input['id'] ?? 0);
        if ($id <= 0) {
            respondError('Identificador invalido');
        }

        $fields = ['titulo', 'contenido', 'imagen_url', 'video_url', 'tipo'];
        $updates = [];
        $params = ['id' => $id];

        foreach ($fields as $field) {
            if (array_key_exists($field, $input)) {
                $updates[] = sprintf('%s = :%s', $field, $field);
                $params[$field] = $input[$field] === '' ? null : $input[$field];
            }
        }

        if (empty($updates)) {
            respondError('No hay cambios para aplicar');
        }

        $sql = 'UPDATE tips SET ' . implode(', ', $updates) . ' WHERE id = :id';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        respondSuccess(['updated' => true]);

        break;

    case 'DELETE':
        requireAdmin($db);
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        if ($id <= 0) {
            respondError('Identificador invalido');
        }

        $delete = $db->prepare('DELETE FROM tips WHERE id = :id');
        $delete->execute(['id' => $id]);

        respondSuccess(['deleted' => $delete->rowCount() > 0]);

        break;

    default:
        respondError('Metodo no permitido', 405);
}