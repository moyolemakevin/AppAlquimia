<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

$tryAuth = static function () use ($db): ?array {
    $token = getBearerToken();
    return $token ? findUserByToken($db, $token) : null;
};

switch ($method) {
    case 'GET':
        $user = $tryAuth();
        $id = isset($_GET['id']) ? (int)$_GET['id'] : null;

        if ($id) {
            $query = $db->prepare('SELECT * FROM aceites WHERE id = :id');
            $query->execute(['id' => $id]);
            $aceite = $query->fetch();

            if (!$aceite) {
                respondError('Aceite no encontrado', 404);
            }

            if ($user) {
                $favStmt = $db->prepare('SELECT COUNT(*) AS total FROM favoritos WHERE usuario_id = :usuario AND aceite_id = :aceite');
                $favStmt->execute(['usuario' => $user['id'], 'aceite' => $id]);
                $aceite['isFavorite'] = ((int)($favStmt->fetch()['total'] ?? 0)) > 0;
            }

            respondSuccess(['aceite' => $aceite]);
        }

        $search = trim((string)($_GET['q'] ?? ''));
        $category = trim((string)($_GET['categoria'] ?? ''));

        $sql = 'SELECT * FROM aceites WHERE 1 = 1';
        $params = [];

        if ($search !== '') {
            $sql .= ' AND (nombre LIKE :search OR beneficios LIKE :search OR emociones_relacionadas LIKE :search)';
            $params['search'] = '%' . $search . '%';
        }

        if ($category !== '') {
            $sql .= ' AND (beneficios LIKE :category OR emociones_relacionadas LIKE :category OR usos LIKE :category)';
            $params['category'] = '%' . $category . '%';
        }

        $sql .= ' ORDER BY nombre ASC';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $aceites = $stmt->fetchAll();

        if ($user) {
            $favMap = [];
            $favStmt = $db->prepare('SELECT aceite_id FROM favoritos WHERE usuario_id = :usuario');
            $favStmt->execute(['usuario' => $user['id']]);
            foreach ($favStmt->fetchAll() as $fav) {
                $favMap[(int)$fav['aceite_id']] = true;
            }

            foreach ($aceites as &$aceite) {
                $aceite['isFavorite'] = isset($favMap[(int)$aceite['id']]);
            }
            unset($aceite);
        }

        respondSuccess(['aceites' => $aceites]);

        break;

    case 'POST':
        requireAdmin($db);
        $input = getJsonInput();

        $nombre = trim((string)($input['nombre'] ?? ''));
        $descripcion = trim((string)($input['descripcion'] ?? ''));
        $beneficios = trim((string)($input['beneficios'] ?? ''));

        if ($nombre === '' || $descripcion === '' || $beneficios === '') {
            respondError('Nombre, descripcion y beneficios son obligatorios');
        }

        $insert = $db->prepare('INSERT INTO aceites (nombre, imagen_url, descripcion, beneficios, usos, precauciones, emociones_relacionadas, audio_url, video_url) VALUES (:nombre, :imagen, :descripcion, :beneficios, :usos, :precauciones, :emociones, :audio, :video)');
        $insert->execute([
            'nombre' => $nombre,
            'imagen' => $input['imagen_url'] ?? null,
            'descripcion' => $descripcion,
            'beneficios' => $beneficios,
            'usos' => $input['usos'] ?? null,
            'precauciones' => $input['precauciones'] ?? null,
            'emociones' => $input['emociones_relacionadas'] ?? null,
            'audio' => $input['audio_url'] ?? null,
            'video' => $input['video_url'] ?? null,
        ]);

        $newId = (int)$db->lastInsertId();
        respondSuccess(['id' => $newId], 201);

        break;

    case 'PUT':
    case 'PATCH':
        requireAdmin($db);
        $input = getJsonInput();
        $id = isset($_GET['id']) ? (int)$_GET['id'] : (int)($input['id'] ?? 0);
        if ($id <= 0) {
            respondError('Identificador invalido');
        }

        $fields = ['nombre', 'imagen_url', 'descripcion', 'beneficios', 'usos', 'precauciones', 'emociones_relacionadas', 'audio_url', 'video_url'];
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

        $sql = 'UPDATE aceites SET ' . implode(', ', $updates) . ' WHERE id = :id';
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

        $delete = $db->prepare('DELETE FROM aceites WHERE id = :id');
        $delete->execute(['id' => $id]);

        respondSuccess(['deleted' => $delete->rowCount() > 0]);

        break;

    default:
        respondError('Metodo no permitido', 405);
}