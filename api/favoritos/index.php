<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$user = requireAuth($db);
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $includeDetails = ($_GET['detalle'] ?? '1') !== '0';

        if ($includeDetails) {
            $stmt = $db->prepare('SELECT a.*, f.id AS favorito_id, f.fecha_agregado FROM favoritos f INNER JOIN aceites a ON a.id = f.aceite_id WHERE f.usuario_id = :usuario ORDER BY f.fecha_agregado DESC');
        } else {
            $stmt = $db->prepare('SELECT aceite_id FROM favoritos WHERE usuario_id = :usuario ORDER BY fecha_agregado DESC');
        }

        $stmt->execute(['usuario' => $user['id']]);
        $data = $stmt->fetchAll();

        respondSuccess(['favoritos' => $data]);

        break;

    case 'POST':
        $input = getJsonInput();
        $aceiteId = (int)($input['aceiteId'] ?? 0);
        if ($aceiteId <= 0) {
            respondError('Identificador de aceite invalido');
        }

        $exists = $db->prepare('SELECT COUNT(*) AS total FROM aceites WHERE id = :id');
        $exists->execute(['id' => $aceiteId]);
        if ((int)($exists->fetch()['total'] ?? 0) === 0) {
            respondError('El aceite no existe', 404);
        }

        $already = $db->prepare('SELECT COUNT(*) AS total FROM favoritos WHERE usuario_id = :usuario AND aceite_id = :aceite');
        $already->execute(['usuario' => $user['id'], 'aceite' => $aceiteId]);
        if ((int)($already->fetch()['total'] ?? 0) > 0) {
            respondSuccess(['alreadyFavorite' => true]);
        }

        $insert = $db->prepare('INSERT INTO favoritos (usuario_id, aceite_id) VALUES (:usuario, :aceite)');
        $insert->execute(['usuario' => $user['id'], 'aceite' => $aceiteId]);

        respondSuccess(['added' => true], 201);

        break;

    case 'DELETE':
        $aceiteId = isset($_GET['aceiteId']) ? (int)$_GET['aceiteId'] : 0;
        if ($aceiteId === 0) {
            $input = getJsonInput();
            $aceiteId = (int)($input['aceiteId'] ?? 0);
        }

        if ($aceiteId <= 0) {
            respondError('Identificador de aceite invalido');
        }

        $delete = $db->prepare('DELETE FROM favoritos WHERE usuario_id = :usuario AND aceite_id = :aceite');
        $delete->execute(['usuario' => $user['id'], 'aceite' => $aceiteId]);

        respondSuccess(['deleted' => $delete->rowCount() > 0]);

        break;

    default:
        respondError('Metodo no permitido', 405);
}