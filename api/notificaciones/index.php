<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $user = requireAuth($db);
        $stmt = $db->prepare('SELECT nr.id, nr.notificacion_id, n.titulo, n.contenido, n.tipo, nr.fecha, nr.leida FROM notificaciones_recibidas nr INNER JOIN notificaciones n ON n.id = nr.notificacion_id WHERE nr.usuario_id = :usuario ORDER BY nr.fecha DESC');
        $stmt->execute(['usuario' => $user['id']]);
        $notifications = $stmt->fetchAll();

        respondSuccess(['notifications' => $notifications]);
        break;

    case 'POST':
        requireAdmin($db);
        $input = getJsonInput();
        $titulo = trim((string)($input['titulo'] ?? ''));
        $contenido = trim((string)($input['contenido'] ?? ''));
        $tipo = trim((string)($input['tipo'] ?? 'general'));
        $usuarios = $input['usuarios'] ?? null;

        if ($titulo === '' || $contenido === '') {
            respondError('Titulo y contenido son obligatorios');
        }

        $insert = $db->prepare('INSERT INTO notificaciones (titulo, contenido, tipo) VALUES (:titulo, :contenido, :tipo)');
        $insert->execute([
            'titulo' => $titulo,
            'contenido' => $contenido,
            'tipo' => $tipo,
        ]);

        $notificationId = (int)$db->lastInsertId();

        $targetUsers = [];
        if (is_array($usuarios) && !empty($usuarios)) {
            $placeholders = implode(', ', array_fill(0, count($usuarios), '?'));
            $stmt = $db->prepare('SELECT id FROM usuarios WHERE id IN (' . $placeholders . ')');
            $stmt->execute(array_map('intval', $usuarios));
            $targetUsers = array_column($stmt->fetchAll(), 'id');
        } else {
            $stmt = $db->query('SELECT id FROM usuarios WHERE activo = 1');
            $targetUsers = array_column($stmt->fetchAll(), 'id');
        }

        $link = $db->prepare('INSERT INTO notificaciones_recibidas (notificacion_id, usuario_id, leida) VALUES (:notificacion, :usuario, 0)');
        foreach ($targetUsers as $userId) {
            $link->execute(['notificacion' => $notificationId, 'usuario' => $userId]);
        }

        respondSuccess(['id' => $notificationId, 'recipients' => count($targetUsers)], 201);
        break;

    case 'PATCH':
    case 'PUT':
        $user = requireAuth($db);
        $input = getJsonInput();
        $id = isset($_GET['id']) ? (int)$_GET['id'] : (int)($input['id'] ?? 0);
        $leida = (bool)($input['leida'] ?? true);

        if ($id <= 0) {
            respondError('Identificador invalido');
        }

        $update = $db->prepare('UPDATE notificaciones_recibidas SET leida = :leida WHERE id = :id AND usuario_id = :usuario');
        $update->execute(['leida' => $leida ? 1 : 0, 'id' => $id, 'usuario' => $user['id']]);

        respondSuccess(['updated' => $update->rowCount() > 0]);
        break;

    default:
        respondError('Metodo no permitido', 405);
}