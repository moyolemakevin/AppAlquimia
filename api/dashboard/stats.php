<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAdmin($db);

$counts = [];

$countsStmt = $db->query('SELECT COUNT(*) AS total FROM aceites');
$counts['aceites'] = (int)($countsStmt->fetch()['total'] ?? 0);

$countsStmt = $db->query('SELECT COUNT(*) AS total FROM usuarios');
$counts['usuarios'] = (int)($countsStmt->fetch()['total'] ?? 0);

$countsStmt = $db->query('SELECT COUNT(*) AS total FROM tips');
$counts['tips'] = (int)($countsStmt->fetch()['total'] ?? 0);

$countsStmt = $db->query('SELECT COUNT(*) AS total FROM favoritos');
$counts['favoritos'] = (int)($countsStmt->fetch()['total'] ?? 0);

$latestAceites = $db->query('SELECT id, nombre, beneficios, fecha_agregado FROM aceites ORDER BY fecha_agregado DESC LIMIT 5')->fetchAll();
$latestTips = $db->query('SELECT id, titulo, tipo, fecha_publicacion FROM tips ORDER BY fecha_publicacion DESC LIMIT 5')->fetchAll();
$recentUsers = $db->query('SELECT id, nombre_usuario, nombre_completo, rol, fecha_registro FROM usuarios ORDER BY fecha_registro DESC LIMIT 5')->fetchAll();

respondSuccess([
    'counts' => $counts,
    'latestAceites' => $latestAceites,
    'latestTips' => $latestTips,
    'recentUsers' => $recentUsers,
]);