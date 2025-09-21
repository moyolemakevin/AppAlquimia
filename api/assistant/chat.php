<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$user = requireAuth($db);
$input = getJsonInput();
$message = trim((string)($input['message'] ?? ''));

if ($message === '') {
    respondError('El mensaje no puede estar vacio');
}

$normalize = static function (string $value): string {
    if (function_exists('mb_strtolower')) {
        return mb_strtolower($value, 'UTF-8');
    }

    return strtolower($value);
};

$text = $normalize($message);
$response = '';
$topic = 'general';
$displayName = trim((string)($user['nombre_completo'] ?? ''));
if ($displayName === '') {
    $displayName = (string)$user['nombre_usuario'];
}

$suggestions = [
    'Que aceite me recomiendas para relajarme?',
    'Cual es bueno para dormir mejor?',
    'Que aceite ayuda con la concentracion?',
];

$answers = [
    'relajacion' => 'Para relajarte te recomiendo aceites como Lavanda, Manzanilla o Bergamota. Inhalalos con difusor durante 20 minutos o aplicalos diluidos en masaje sobre cuello y hombros.',
    'suenio' => 'Para dormir mejor usa Lavanda o Cedro. Difunde 3-5 gotas antes de acostarte o mezcla 2 gotas con aceite portador para aplicar en munecas y planta de los pies.',
    'energia' => 'Para energia y motivacion prueba con Menta, Limon o Romero. Usalos en difusor por la manana o inhala directo del frasco durante 5 respiraciones profundas.',
    'concentracion' => 'Para concentracion utiliza Romero, Albahaca o Menta. Difunde mientras trabajas y aplica una mezcla diluida en sienes y nuca.',
    'respiracion' => 'Para vias respiratorias el Eucalipto y el Arbol de Te son ideales. Agrega 3 gotas a un recipiente con agua caliente e inhala con cuidado.',
    'estres' => 'Para manejar el estres combina Lavanda con Naranja Dulce. Difunde la mezcla o preparala en roll-on con aceite portador.',
];

switch (true) {
    case str_contains($text, 'relaj'):
        $response = $answers['relajacion'];
        $topic = 'relajacion';
        break;
    case str_contains($text, 'dorm') || str_contains($text, 'sue'):
        $response = $answers['suenio'];
        $topic = 'sueno';
        break;
    case str_contains($text, 'energ'):
        $response = $answers['energia'];
        $topic = 'energia';
        break;
    case str_contains($text, 'concen') || str_contains($text, 'foco') || str_contains($text, 'enfoque'):
        $response = $answers['concentracion'];
        $topic = 'concentracion';
        break;
    case str_contains($text, 'respir') || str_contains($text, 'congest'):
        $response = $answers['respiracion'];
        $topic = 'respiracion';
        break;
    case str_contains($text, 'estr') || str_contains($text, 'ansie'):
        $response = $answers['estres'];
        $topic = 'estres';
        break;
    default:
        $response = 'Hola ' . $displayName . ' Soy tu guia de aromaterapia. Cuentame que necesitas: relajacion, energia, dormir mejor o enfoque. Tambien puedo darte recomendaciones de uso seguro.';
        $topic = 'general';
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