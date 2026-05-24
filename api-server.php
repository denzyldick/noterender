<?php
/**
 * Dev API server with JSON file storage.
 * Replace with Symfony/Doctrine for production.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$storageDir = __DIR__ . '/api/public/storage';
if (!is_dir($storageDir)) mkdir($storageDir, 0777, true);

function json_file(string $path): array {
    return file_exists($path) ? json_decode(file_get_contents($path), true) ?? [] : [];
}

function write_json(string $path, array $data): void {
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

function auth(): ?array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($header, 'Bearer ')) return null;
    $token = substr($header, 7);
    $users = json_file(__DIR__ . '/api/public/storage/users.json');
    foreach ($users as $u) {
        if (($u['apiToken'] ?? '') === $token) return $u;
    }
    return null;
}

function body(): array {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function json_response($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = rtrim($path, '/');

// --- AUTH ---
if ($path === '/api/auth/register' && $method === 'POST') {
    $data = body();
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_response(['error' => 'Valid email required'], 400);
    if (strlen($password) < 6) json_response(['error' => 'Password min 6 characters'], 400);

    $users = json_file($storageDir . '/users.json');
    foreach ($users as $u) {
        if ($u['email'] === $email) json_response(['error' => 'Email already registered'], 409);
    }

    $nextId = count($users) > 0 ? max(array_column($users, 'id')) + 1 : 1;
    $user = [
        'id' => $nextId,
        'email' => $email,
        'password' => password_hash($password, PASSWORD_BCRYPT),
        'apiToken' => bin2hex(random_bytes(32)),
        'trialStartedAt' => null,
        'stripeCustomerId' => null,
        'createdAt' => date('c'),
    ];

    $users[] = $user;
    write_json($storageDir . '/users.json', $users);

    json_response(['token' => $user['apiToken'], 'user' => ['id' => $user['id'], 'email' => $user['email']]], 201);
}

if ($path === '/api/auth/login' && $method === 'POST') {
    $data = body();
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    $users = json_file($storageDir . '/users.json');
    foreach ($users as &$u) {
        if ($u['email'] === $email && password_verify($password, $u['password'])) {
            if (empty($u['apiToken'])) {
                $u['apiToken'] = bin2hex(random_bytes(32));
                write_json($storageDir . '/users.json', $users);
            }
            json_response(['token' => $u['apiToken'], 'user' => ['id' => $u['id'], 'email' => $u['email']]]);
        }
    }
    json_response(['error' => 'Invalid credentials'], 401);
}

// --- ME ---
if ($path === '/api/me' && $method === 'GET') {
    $user = auth();
    if (!$user) json_response(['error' => 'Not authenticated'], 401);
    $isTrialActive = $user['trialStartedAt'] && (time() - $user['trialStartedAt'] < 7 * 24 * 60 * 60);
    json_response([
        'id' => $user['id'],
        'email' => $user['email'],
        'trialActive' => $isTrialActive,
        'trialStartedAt' => $user['trialStartedAt'],
    ]);
}

// --- PROJECTS ---
if ($path === '/api/projects' && $method === 'GET') {
    $user = auth();
    if (!$user) json_response(['error' => 'Not authenticated'], 401);

    $projects = json_file($storageDir . '/projects.json');
    $result = array_values(array_filter($projects, fn($p) => $p['userId'] === $user['id']));
    usort($result, fn($a, $b) => strcmp($b['updatedAt'] ?? '', $a['updatedAt'] ?? ''));
    json_response($result);
}

if ($path === '/api/projects' && $method === 'POST') {
    $user = auth();
    if (!$user) json_response(['error' => 'Not authenticated'], 401);

    $data = body();
    $projects = json_file($storageDir . '/projects.json');
    $nextId = count($projects) > 0 ? max(array_column($projects, 'id')) + 1 : 1;

    $project = [
        'id' => $nextId,
        'userId' => $user['id'],
        'name' => $data['name'] ?? 'Untitled',
        'data' => $data['data'] ?? [],
        'createdAt' => date('c'),
        'updatedAt' => date('c'),
    ];

    $projects[] = $project;
    write_json($storageDir . '/projects.json', $projects);
    json_response(['id' => $project['id']], 201);
}

if (preg_match('#^/api/projects/(\d+)$#', $path, $m) && $method === 'PUT') {
    $user = auth();
    if (!$user) json_response(['error' => 'Not authenticated'], 401);

    $id = (int)$m[1];
    $projects = json_file($storageDir . '/projects.json');
    foreach ($projects as &$p) {
        if ($p['id'] === $id && $p['userId'] === $user['id']) {
            $data = body();
            if (isset($data['name'])) $p['name'] = $data['name'];
            if (isset($data['data'])) $p['data'] = $data['data'];
            $p['updatedAt'] = date('c');
            write_json($storageDir . '/projects.json', $projects);
            json_response(['success' => true]);
        }
    }
    json_response(['error' => 'Not found'], 404);
}

if (preg_match('#^/api/projects/(\d+)$#', $path, $m) && $method === 'DELETE') {
    $user = auth();
    if (!$user) json_response(['error' => 'Not authenticated'], 401);

    $id = (int)$m[1];
    $projects = json_file($storageDir . '/projects.json');
    $filtered = array_values(array_filter($projects, fn($p) => !($p['id'] === $id && $p['userId'] === $user['id'])));
    if (count($filtered) === count($projects)) json_response(['error' => 'Not found'], 404);
    write_json($storageDir . '/projects.json', $filtered);
    json_response(['success' => true]);
}

// --- SHOUTOUTS ---
if ($path === '/api/shoutout' && $method === 'POST') {
    $data = body();
    $clubId = $data['club_id'] ?? null;
    $name = trim($data['name'] ?? '');
    $message = trim($data['message'] ?? '');

    if (!$clubId || !$name || !$message) json_response(['error' => 'club_id, name, message required'], 400);

    $shoutouts = json_file($storageDir . '/shoutouts.json');
    $nextId = count($shoutouts) > 0 ? max(array_column($shoutouts, 'id')) + 1 : 1;

    $shoutout = [
        'id' => $nextId,
        'clubId' => (int)$clubId,
        'name' => $name,
        'message' => $message,
        'status' => 'pending',
        'createdAt' => date('c'),
    ];

    $shoutouts[] = $shoutout;
    write_json($storageDir . '/shoutouts.json', $shoutouts);
    json_response(['id' => $shoutout['id']], 201);
}

if ($path === '/api/shoutout/pending' && $method === 'GET') {
    $user = auth();
    if (!$user) json_response(['error' => 'Not authenticated'], 401);

    $shoutouts = json_file($storageDir . '/shoutouts.json');
    $result = array_values(array_filter($shoutouts, fn($s) => $s['clubId'] === $user['id'] && $s['status'] === 'pending'));
    usort($result, fn($a, $b) => strcmp($a['createdAt'], $b['createdAt']));
    json_response($result);
}

if (preg_match('#^/api/shoutout/(\d+)/approve$#', $path, $m) && $method === 'PUT') {
    $user = auth();
    if (!$user) json_response(['error' => 'Not authenticated'], 401);

    $id = (int)$m[1];
    $data = body();
    $status = $data['status'] ?? 'approved';

    $shoutouts = json_file($storageDir . '/shoutouts.json');
    foreach ($shoutouts as &$s) {
        if ($s['id'] === $id && $s['clubId'] === $user['id']) {
            $s['status'] = $status;
            write_json($storageDir . '/shoutouts.json', $shoutouts);
            json_response(['success' => true]);
        }
    }
    json_response(['error' => 'Not found'], 404);
}

if ($path === '/api/shoutout/approved' && $method === 'GET') {
    $clubId = (int)($_GET['club_id'] ?? 0);
    $since = $_GET['since'] ?? null;

    if (!$clubId) json_response(['error' => 'club_id required'], 400);

    $shoutouts = json_file($storageDir . '/shoutouts.json');
    $result = array_values(array_filter($shoutouts, function($s) use ($clubId, $since) {
        if ($s['clubId'] !== $clubId || $s['status'] !== 'approved') return false;
        if ($since && $s['createdAt'] <= $since) return false;
        return true;
    }));
    usort($result, fn($a, $b) => strcmp($a['createdAt'], $b['createdAt']));
    json_response($result);
}

// Fallback
json_response(['error' => 'Not found', 'path' => $path, 'method' => $method], 404);
