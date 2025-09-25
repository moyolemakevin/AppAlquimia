<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$user = requireAuth($db);
$input = getJsonInput();
$message = trim((string)($input['message'] ?? ''));

if ($message === '') {
    respondError('El mensaje no puede estar vacio');
}

$normalized = mb_strtolower($message, 'UTF-8');
$displayName = trim((string)($user['nombre_completo'] ?? ''));
if ($displayName === '') {
    $displayName = (string) $user['nombre_usuario'];
}

$stopWords = [
    'hola','buenos','buenas','dias','tardes','noches','por','que','para','con','del','las','los','una','unos',
    'unas','esta','este','estas','estos','quiero','necesito','podrias','puedes','dime','sobre','como','usar','podria',
    'ayuda','favor','hace','hacer','tenes','tienes','dame','dado','solo','algo','mas','menos','muy','mucho','nada',
    'quisiera','gustaria','busco','buscando','ayudame','ayudanos','alguna','alguno','algun','algunas',
    'algunos','puedo','puede','pueden','gracias','saber','informacion'
];

$keywords = extractKeywords($normalized, $stopWords);

[$aceites, $tips] = fetchMatches($db, $keywords);

$isGreeting = isGreeting($normalized);
$replyParts = [];
$suggestions = [];
$topic = 'general';

if ($isGreeting) {
    $replyParts[] = 'Hola ' . $displayName . '. Estoy listo para recomendarte aceites, rutinas y cuidados personalizados.';
    $suggestions[] = 'Pideme aceites para relajacion, energia o concentracion';
}

if (!empty($aceites)) {
    $topic = 'aceites';
    $replyParts[] = 'Esto es lo que encontre en tu biblioteca:';
    $replyParts[] = formatAceites($aceites);
    $replyParts[] = 'Si quieres comprar alguno escribe al +593 983015307 o usa el boton "Comprar" en la seccion Aceites.';
    $suggestions[] = 'Quieres una mezcla personalizada con estas notas?';
    $suggestions[] = 'Necesitas instrucciones de uso seguro para aplicaciones topicas?';
}

if (!empty($tips)) {
    if ($topic === 'general') {
        $topic = 'tips';
    }
    $replyParts[] = 'Tambien encontre estos tips que encajan con lo que buscas:';
    $replyParts[] = formatTips($tips);
    $suggestions[] = 'Quieres mas detalles sobre alguno de los tips?';
    $suggestions[] = 'Deseas recomendaciones para combinar estos tips con tus aceites favoritos?';
}

if (empty($aceites) && empty($tips)) {
    if (!empty($keywords)) {
        $replyParts[] = 'No encontre coincidencias directas, pero puedo ayudarte si me das un poco mas de contexto (por ejemplo, emocion, sintoma o forma de uso).';
    } else {
        $replyParts[] = 'Puedo buscar aceites por nombre, beneficio, emocion o darte tips rapidos. Cuentame que necesitas y te guio paso a paso.';
    }
    $suggestions = array_merge($suggestions, [
        'Recomiendame aceites para dormir mejor',
        'Necesito algo para bajar el estres',
        'Quiero tips de seguridad antes de aplicar aceites',
    ]);
}

$suggestions = array_slice(array_values(array_unique(array_filter($suggestions, static fn ($item) => trim((string)$item) !== ''))), 0, 6);
$reply = implode("

", array_filter($replyParts, static fn ($part) => trim((string)$part) !== ''));

$log = $db->prepare('INSERT INTO chatlogs (usuario_id, mensaje_usuario, respuesta_ia, tema) VALUES (:usuario, :mensaje, :respuesta, :tema)');
$log->execute([
    'usuario' => $user['id'],
    'mensaje' => $message,
    'respuesta' => $reply,
    'tema' => $topic,
]);

respondSuccess([
    'reply' => $reply,
    'topic' => $topic,
    'suggestions' => $suggestions,
]);

function extractKeywords(string $text, array $stopWords): array
{
    $text = preg_replace('/[^\p{L}\p{N}\s]+/u', ' ', $text) ?? '';
    $tokens = preg_split('/\s+/', trim($text)) ?: [];

    $result = [];
    foreach ($tokens as $token) {
        $token = trim($token);
        if ($token === '' || mb_strlen($token, 'UTF-8') < 3) {
            continue;
        }
        if (in_array($token, $stopWords, true)) {
            continue;
        }
        $result[] = $token;
    }

    return array_values(array_unique($result));
}

function isGreeting(string $text): bool
{
    return preg_match('/\b(hola|holi|holis|hey)\b|buen[oa]s?\s+(dias|tardes|noches)/u', $text) === 1;
}

function fetchMatches(PDO $db, array $keywords): array
{
    if (empty($keywords)) {
        return [[], []];
    }

    $aceites = searchWithKeywords(
        $db,
        'SELECT id, nombre, beneficios, usos, precauciones FROM aceites WHERE %s ORDER BY fecha_agregado DESC LIMIT 3',
        ['nombre', 'beneficios', 'usos', 'emociones_relacionadas'],
        $keywords
    );

    $tips = searchWithKeywords(
        $db,
        'SELECT id, titulo, contenido, tipo FROM tips WHERE %s ORDER BY fecha_publicacion DESC LIMIT 3',
        ['titulo', 'contenido', 'tipo'],
        $keywords
    );

    return [$aceites, $tips];
}

function searchWithKeywords(PDO $db, string $queryTemplate, array $columns, array $keywords): array
{
    $conditions = [];
    $params = [];

    foreach ($keywords as $index => $keyword) {
        $param = 'kw' . $index;
        $like = '%' . $keyword . '%';
        foreach ($columns as $column) {
            $conditions[] = sprintf('%s LIKE :%s_%s', $column, $param, $column);
            $params[$param . '_' . $column] = $like;
        }
    }

    if (empty($conditions)) {
        return [];
    }

    $placeholders = implode(' OR ', $conditions);
    $statement = $db->prepare(sprintf($queryTemplate, $placeholders));
    $statement->execute($params);

    return $statement->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

function formatAceites(array $aceites): string
{
    $lines = [];
    foreach ($aceites as $aceite) {
        $parts = [];
        $parts[] = $aceite['nombre'];
        if (!empty($aceite['beneficios'])) {
            $parts[] = 'Beneficios: ' . $aceite['beneficios'];
        }
        if (!empty($aceite['usos'])) {
            $parts[] = 'Uso sugerido: ' . $aceite['usos'];
        }
        if (!empty($aceite['precauciones'])) {
            $parts[] = 'Precaucion: ' . $aceite['precauciones'];
        }
        $lines[] = '- ' . implode(' | ', $parts);
    }

    return implode("
", $lines);
}

function formatTips(array $tips): string
{
    $lines = [];
    foreach ($tips as $tip) {
        $parts = [];
        $parts[] = $tip['titulo'];
        if (!empty($tip['tipo'])) {
            $parts[] = 'Categoria: ' . $tip['tipo'];
        }
        if (!empty($tip['contenido'])) {
            $parts[] = $tip['contenido'];
        }
        $lines[] = '- ' . implode(' | ', $parts);
    }

    return implode("
", $lines);
}
