# PowerShell HTTP Server для игры «Шахта Знаний»
$port = 8787
$root = $PSScriptRoot
if (-not $root) { $root = "c:\Program Files (x86)\Vsproj\profsota_game" }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Output "Сервер «Шахта Знаний» запущен: http://127.0.0.1:$port/"
} catch {
    Write-Error $_
    exit 1
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".js"   = "text/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response

    $rawPath = $req.Url.AbsolutePath
    if ($rawPath -eq "/" -or [string]::IsNullOrWhiteSpace($rawPath)) {
        $rawPath = "/index.html"
    }

    # Редирект старых путей вида /kip.html -> /specialties/kip/index.html
    if ($rawPath -match '^/([a-zA-Z0-9_-]+)\.html$') {
        $specName = $matches[1].ToLower()
        if (@('kip', 'ts', 'e', 'reu', 'p', 'ksk') -contains $specName) {
            $rawPath = "/specialties/$specName/index.html"
        }
    }

    $relPath = $rawPath.TrimStart("/").Replace("/", "\")
    $filePath = [System.IO.Path]::Combine($root, $relPath)

    if ([System.IO.Directory]::Exists($filePath)) {
        $filePath = [System.IO.Path]::Combine($filePath, "index.html")
    }

    if ([System.IO.File]::Exists($filePath)) {
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $contentType = $mimeTypes[$ext]
        if (-not $contentType) { $contentType = "application/octet-stream" }
        
        $res.ContentType = $contentType
        $res.Headers.Add("Cache-Control", "no-store")
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        $res.StatusCode = 200
    } else {
        $res.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Не найдено: $rawPath")
        $res.ContentType = "text/plain; charset=utf-8"
        $res.OutputStream.Write($msg, 0, $msg.Length)
    }
    $res.Close()
}
