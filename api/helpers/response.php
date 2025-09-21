<?php
declare(strict_types=1);

function respond(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function respondSuccess(array $data = [], int $statusCode = 200): void
{
    respond($statusCode, ['status' => 'success', 'data' => $data]);
}

function respondError(string $message, int $statusCode = 400, array $extra = []): void
{
    respond($statusCode, array_merge(['status' => 'error', 'message' => $message], $extra));
}

function getJsonInput(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        respondError('JSON invalido en la solicitud', 400, ['errorDetail' => json_last_error_msg()]);
    }

    return is_array($decoded) ? $decoded : [];
}

function getBearerToken(): ?string
{
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        return null;
    }

    if (preg_match('/Bearer\s+(.*)$/i', trim($headers['Authorization']), $matches)) {
        return $matches[1];
    }

    return null;
}