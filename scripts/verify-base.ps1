param(
    [ValidatePattern('^campusitsm-check-[a-z0-9-]+$')]
    [string]$Project = ('campusitsm-check-' + (Get-Date -Format 'yyyyMMddHHmmss')),
    [int]$Port = 18080,
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot
$previousPort = $env:WEB_PORT
$env:WEB_PORT = [string]$Port
$composeArgs = @('compose', '-p', $Project, '-f', 'compose.yml', '-f', 'compose.local.yml')

function Invoke-Compose {
    param([string[]]$CommandArgs)
    & docker @composeArgs @CommandArgs
    if ($LASTEXITCODE -ne 0) { throw "Docker Compose falló: $($CommandArgs -join ' ')" }
}

function Read-Sql {
    param([string]$Sql)
    $result = $Sql | & docker @composeArgs exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At'
    if ($LASTEXITCODE -ne 0) { throw 'Consulta de verificación fallida.' }
    return ($result -join "`n").Trim()
}

function Assert-Equal {
    param($Actual, $Expected, [string]$Message)
    if ($Actual -ne $Expected) { throw "$Message. Esperado: $Expected; obtenido: $Actual" }
}

try {
    # Proyecto nuevo: no se reutilizan ni borran datos de una ejecución anterior.
    $existing = & docker ps -aq --filter "label=com.docker.compose.project=$Project"
    $existingVolumes = & docker volume ls -q --filter "label=com.docker.compose.project=$Project"
    if ($existing -or $existingVolumes) { throw 'El proyecto de prueba ya existe; elegir otro nombre.' }
    $up = @('up', '-d', '--wait', '--wait-timeout', '180')
    if (-not $SkipBuild) { $up += '--build' }
    if (-not $SkipBuild) { Invoke-Compose @('build', 'migrate') }
    Invoke-Compose @('--profile', 'tools', 'run', '--rm', 'migrate')
    Invoke-Compose $up
    $baseUrl = "http://127.0.0.1:$Port"
    Assert-Equal (Invoke-RestMethod "$baseUrl/api/v1/health").status 'ok' 'Salud integral'
    $schema = Invoke-RestMethod "$baseUrl/api/openapi.json"
    if (-not $schema.paths.'/api/v1/health') { throw 'OpenAPI no contiene salud.' }
    Assert-Equal (Invoke-WebRequest "$baseUrl/incidencias" -UseBasicParsing).StatusCode 200 'Ruta SPA'

    Invoke-Compose @('--profile', 'tools', 'run', '--rm', 'seed')
    Invoke-Compose @('--profile', 'tools', 'run', '--rm', 'seed')
    Assert-Equal (Read-Sql 'SELECT count(*) FROM "Institution";') '1' 'Semilla de institución idempotente'
    Assert-Equal (Read-Sql 'SELECT count(*) FROM "SupportTeam";') '1' 'Semilla de equipo idempotente'
    Read-Sql 'UPDATE "Institution" SET "name" = ''Persistencia verificada'' WHERE "code" = ''UPT-DEMO'';' | Out-Null
    Invoke-Compose @('--profile', 'tools', 'run', '--rm', 'seed')
    Assert-Equal (Read-Sql 'SELECT "name" FROM "Institution" WHERE "code" = ''UPT-DEMO'';') 'Persistencia verificada' 'Semilla conserva cambios'

    # Estas inserciones deben fallar; no alteran los datos de la prueba.
    foreach ($sql in @(
        'INSERT INTO "Institution" ("id", "code", "name") VALUES (''00000000-0000-4000-8000-000000000003'', ''UPT-DEMO'', ''Duplicado'');',
        'INSERT INTO "Institution" ("id", "code", "name") VALUES (''00000000-0000-4000-8000-000000000003'', '' '', ''Vacío'');',
        'INSERT INTO "SupportTeam" ("id", "institutionId", "code", "name") VALUES (''00000000-0000-4000-8000-000000000003'', ''00000000-0000-4000-8000-000000000099'', ''HUERFANO'', ''Sin institución'');'
    )) {
        $sql | & docker @composeArgs exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { throw 'La base aceptó una fila inválida.' }
    }
    Invoke-Compose @('exec', '-T', 'api', 'node', '-e', "require('fs').writeFileSync('/data/files/base-check.txt','persisted')")
    Invoke-Compose @('exec', '-T', 'predictions', 'python', '-c', "from pathlib import Path; Path('/models/base-check.txt').write_text('persisted')")
    Invoke-Compose @('down')
    Invoke-Compose @('up', '-d', '--wait', '--wait-timeout', '180')
    Assert-Equal (Read-Sql 'SELECT "name" FROM "Institution" WHERE "code" = ''UPT-DEMO'';') 'Persistencia verificada' 'Persistencia PostgreSQL'
    Invoke-Compose @('exec', '-T', 'api', 'node', '-e', "if(require('fs').readFileSync('/data/files/base-check.txt','utf8')!=='persisted')process.exit(1)")
    Invoke-Compose @('exec', '-T', 'predictions', 'python', '-c', "from pathlib import Path; assert Path('/models/base-check.txt').read_text() == 'persisted'")
    Invoke-Compose @('exec', '-T', 'api', 'npx', 'prisma', 'migrate', 'status')

    Invoke-Compose @('stop', 'predictions')
    try {
        Invoke-WebRequest "$baseUrl/api/v1/health" -UseBasicParsing | Out-Null
        throw 'La API reportó éxito sin Python.'
    } catch {
        if (-not $_.Exception.Response -or [int]$_.Exception.Response.StatusCode -ne 503) { throw }
    }
    Invoke-Compose @('start', 'predictions')
    $recovered = $false
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        try { $recovered = (Invoke-RestMethod "$baseUrl/api/v1/health").status -eq 'ok' } catch {}
        if ($recovered) { break }
        Start-Sleep -Seconds 1
    }
    if (-not $recovered) { throw 'No se recuperó la API tras volver Python.' }
    Invoke-Compose @('ps', '-a')
    Write-Host "VERIFICACIÓN CORRECTA: $Project. Volúmenes de prueba conservados."
} finally {
    # Solo retira contenedores del proyecto aislado, conservando sus volúmenes.
    & docker @composeArgs down
    $env:WEB_PORT = $previousPort
    Pop-Location
}
