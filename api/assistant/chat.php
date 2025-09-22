<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$user = requireAuth($db);
$input = getJsonInput();
$message = trim((string)($input['message'] ?? ''));

if ($message === '') {
    respondError('El mensaje no puede estar vacio');
}

\$stripAccents = static function (string $value): string {
    if (function_exists('iconv')) {
        $normalized = iconv('UTF-8', 'ASCII//TRANSLIT', $value);
        if ($normalized !== false) {
            return $normalized;
        }
    }

    return $value;
};

$normalize = static function (string $value) use ($stripAccents): string {
    $value = mb_strtolower($value, 'UTF-8');
    $value = $stripAccents($value);
    return trim($value);
};

$getLength = static function (string $value): int {
    return mb_strlen($value, 'UTF-8');
};

$getKeywords = static function (string $text) use ($normalize, $getLength): array {
    $clean = preg_replace('/[^\p{L}\p{N}\s]+/u', ' ', $normalize($text));
    $words = preg_split('/\s+/', (string) $clean, -1, PREG_SPLIT_NO_EMPTY);
    $stopWords = [
        'para','como','quiero','necesito','sobre','tus','este','esta','estas','estos','pero','saber','usar','dime','quieres','puedo','puedes','con','del','los','las','una','unos','unas','que','por','cada','solo','mas','menos','algo','algun','alguna','alguno','algunas','algunos','cuando','cual','cuales','donde','ayuda','favor','hola','buenos','dias','tarde','noche','me','da','de','el','la','lo','les','nos','puede','sirve','sirven','cual','cuales','podria','podrias','podremos','querria','queria','quisiera'
    ];

    $filtered = array_filter(
        $words,
        static function (string $word) use ($stopWords, $getLength): bool {
            return $getLength($word) > 3 && !in_array($word, $stopWords, true);
        }
    );

    return array_values(array_unique($filtered));
};

$text = $normalize($message);
$keywords = $getKeywords($message);
$response = '';
$topic = 'general';
$displayName = trim((string)($user['nombre_completo'] ?? ''));
if ($displayName === '') {
    $displayName = (string) $user['nombre_usuario'];
}

$defaultSuggestions = [
    'Que aceite me recomiendas para relajarme?',
    'Cual es bueno para dormir mejor?',
    'Que aceite ayuda con la concentracion?',
    'Tienes tips para difusores?'
];
$suggestions = $defaultSuggestions;

$answers = [
    'relajacion' => 'Para relajarte te recomiendo Lavanda, Manzanilla o Bergamota. Difunde 4 gotas durante 20 minutos o aplica una mezcla diluida en sienes y nuca con respiraciones profundas.',
    'suenio' => 'Para dormir mejor usa Lavanda, Cedro o Mejorana. Difunde 3-5 gotas antes de acostarte, ventila la habitacion y aplica una gota diluida en planta de los pies.',
    'energia' => 'Para energia y motivacion prueba Menta, Limon o Romero. Difunde por la manana o inhalalos directo del frasco durante 5 respiraciones profundas para activar el enfoque.',
    'concentracion' => 'Para concentracion utiliza Romero, Albahaca o Menta. Difunde mientras trabajas, aplica una mezcla roll-on (diluida) en sienes y detras de las orejas cada 2 horas.',
    'respiracion' => 'Para vias respiratorias el Eucalipto, Tea Tree y Menta son ideales. Agrega 3 gotas a agua caliente e inhala con cuidado, o prepara un roll-on diluido para pecho y cuello.',
    'estres' => 'Para manejar el estres combina Lavanda con Naranja Dulce o Ylang-Ylang. Usa el difusor en ciclos de 25 minutos y practica respiraciones diafragmaticas.',
    'seguridad' => 'Dilucion segura: 2% (6 gotas en 10 ml de portador) para adultos, 1% (3 gotas) para piel sensible, 0.5% para ninos mayores de 2 anos. Evita ojos, controla la luz solar con citricos y almacena en envases ambar.'
];

$topicSynonyms = [
    'relajacion' => ['relaj', 'calm', 'ansie', 'tranquil', 'estres', 'nervios'],
    'suenio' => ['suen', 'dorm', 'insom', 'noche', 'desvelo'],
    'energia' => ['energ', 'vital', 'activar', 'animo', 'cansancio'],
    'concentracion' => ['concen', 'foco', 'enfoque', 'product', 'estudio'],
    'respiracion' => ['respir', 'congest', 'sinus', 'moco', 'tos', 'grip'],
    'estres' => ['estres', 'ansie', 'tension', 'colapso'],
    'seguridad' => ['segur', 'contraindic', 'embarazo', 'nino', 'bebe', 'mascota', 'precauc', 'efecto'],
    'dolor' => ['dolor', 'muscul', 'espalda', 'cabeza', 'migra', 'articul'],
    'piel' => ['piel', 'cutis', 'acne', 'dermatit', 'mancha', 'eczema'],
    'mezclas' => ['mezcla', 'blend', 'roll', 'sinerg', 'combo']
];

$matchedTopic = 'general';
foreach ($topicSynonyms as $topicKey => $patterns) {
    foreach ($patterns as $pattern) {
        if (str_contains($text, $pattern)) {
            $matchedTopic = $topicKey;
            break 2;
        }
    }
}

$matchedAceites = [];
$matchedTips = [];

$fetchMatches = static function (PDO $db, array $keywords) use ($topicSynonyms): array {
    if (empty($keywords)) {
        return [[], []];
    }

    $aceiteConditions = [];
    $aceiteParams = [];
    foreach ($keywords as $index => $word) {
        $param = 'kw' . $index;
        $aceiteParams[$param] = '%' . $word . '%';
        $aceiteConditions[] = '(nombre LIKE :' . $param . ' OR beneficios LIKE :' . $param . ' OR descripcion LIKE :' . $param . ' OR emociones_relacionadas LIKE :' . $param . ')';
    }

    $tipConditions = [];
    $tipParams = [];
    foreach ($keywords as $index => $word) {
        $param = 'tp' . $index;
        $tipParams[$param] = '%' . $word . '%';
        $tipConditions[] = '(titulo LIKE :' . $param . ' OR contenido LIKE :' . $param . ' OR tipo LIKE :' . $param . ')';
    }

    $aceites = [];
    $tips = [];

    if (!empty($aceiteConditions)) {
        $aceiteWhere = implode(' OR ', $aceiteConditions);
        $query = $db->prepare('SELECT id, nombre, beneficios, usos, precauciones FROM aceites WHERE ' . $aceiteWhere . ' ORDER BY fecha_agregado DESC LIMIT 3');
        $query->execute($aceiteParams);
        $aceites = $query->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    if (!empty($tipConditions)) {
        $tipWhere = implode(' OR ', $tipConditions);
        $tipQuery = $db->prepare('SELECT id, titulo, contenido FROM tips WHERE ' . $tipWhere . ' ORDER BY fecha_publicacion DESC LIMIT 2');
        $tipQuery->execute($tipParams);
        $tips = $tipQuery->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    return [$aceites, $tips];
};

[$matchedAceites, $matchedTips] = $fetchMatches($db, $keywords);

switch ($matchedTopic) {
    case 'relajacion':
        $response = $answers['relajacion'];
        $topic = 'relajacion';
        break;
    case 'suenio':
        $response = $answers['suenio'];
        $topic = 'sueno';
        break;
    case 'energia':
        $response = $answers['energia'];
        $topic = 'energia';
        break;
    case 'concentracion':
        $response = $answers['concentracion'];
        $topic = 'concentracion';
        break;
    case 'respiracion':
        $response = $answers['respiracion'];
        $topic = 'respiracion';
        break;
    case 'estres':
        $response = $answers['estres'];
        $topic = 'estres';
        break;
    case 'seguridad':
        $response = $answers['seguridad'];
        $topic = 'seguridad';
        break;
    case 'dolor':
        $response = 'Para aliviar molestias musculares o articulares usa una mezcla con Menta, Romero y Gaulteria en aceite portador (5%). Aplica en masaje circular y alterna con compresas tibias. Para dolores de cabeza suaves, Menta con Lavanda en sienes.';
        $topic = 'dolor';
        break;
    case 'piel':
        $response = 'Para cuidado de piel sensible usa Tea Tree, Lavanda y Geranio en dilucion suave. Para acne puntual aplica Tea Tree localizado (siempre diluido). Hidrata con Jojoba o Rosa Mosqueta y evita citricos en exposicion solar.';
        $topic = 'piel';
        break;
    case 'mezclas':
        $response = 'Para un blend armonioso: Lavanda + Bergamota + Cedro (relajacion), o Naranja + Menta + Romero (energia). Usa 3 gotas de cada en 100 ml de agua para difusor y 2% de dilucion en roll-on.';
        $topic = 'mezclas';
        break;
    default:
        if (!empty($matchedAceites)) {
            $topic = 'aceites';
            $lines = [];
            foreach ($matchedAceites as $aceite) {
                $parts = [$aceite['nombre']];
                if (!empty($aceite['beneficios'])) {
                    $parts[] = 'Beneficios: ' . $aceite['beneficios'];
                }
                if (!empty($aceite['usos'])) {
                    $parts[] = 'Uso sugerido: ' . $aceite['usos'];
                }
                if (!empty($aceite['precauciones'])) {
                    $parts[] = 'Precaucion: ' . $aceite['precauciones'];
                }
                $lines[] = '• ' . implode(' | ', $parts);
            }
            $response = "Esto es lo que encontre para ti:\n" . implode("\n", $lines);
            $suggestions = [
                'Quieres una mezcla personalizada con estos aceites?',
                'Necesitas recomendaciones de seguridad para aplicaciones topicas?',
                'Quieres tips para usar el difusor con estas notas?'
            ];
        } elseif (!empty($matchedTips)) {
            $topic = 'tips';
            $lines = [];
            foreach ($matchedTips as $tip) {
                $lines[] = '• ' . $tip['titulo'] . ': ' . $tip['contenido'];
            }
            $response = "Tengo estos consejos para ti:\n" . implode("\n", $lines);
            $suggestions = [
                'Necesitas mas detalles sobre aplicaciones?',
                'Quieres saber que aceites combinan con este tip?',
                'Buscas recomendaciones para ninos o mascotas?'
            ];
        } else {
            $response = 'Hola ' . $displayName . '. Soy tu guia de aromaterapia. Cuentame que necesitas: relajacion, energia, dormir mejor, enfoque, cuidados de piel, alivio muscular o seguridad. Tambien puedo sugerir mezclas personalizadas o uso para mascotas y ninos.';
            $topic = 'general';
        }
        break;
}

$log = $db->prepare('INSERT INTO chatlogs (usuario_id, mensaje_usuario, respuesta_ia, tema) VALUES (:usuario, :mensaje, :respuesta, :tema)');
$log->execute([
    'usuario' => $user['id'],
    'mensaje' => $message,
    'respuesta' => $response,
    'tema' => $topic,
]);

respondSuccess([
    'reply' => $response,
    'topic' => $topic,
    'suggestions' => $suggestions,
]);

