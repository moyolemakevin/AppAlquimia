<?php
declare(strict_types=1);

use DateTimeImmutable;
use DateTimeZone;

header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'name' => 'Alquimia Esencial API',
    'status' => 'ok',
    'timestamp' => (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format(DATE_ATOM),
]);