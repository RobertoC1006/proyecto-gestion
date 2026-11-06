param(
  [ValidatePattern('^campusitsm-calendar-check-[a-z0-9-]+$')]
  [string]$Project = ('campusitsm-calendar-check-' + (Get-Date -Format 'yyyyMMddHHmmss')),
  [switch]$SkipBuild
)
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path -Parent $PSScriptRoot)
$composeArgs = @('compose', '-p', $Project, '-f', 'compose.yml', '-f', 'compose.calendar-test.yml')
function Run-Compose {
  param([string[]]$CommandArgs)
  & docker @composeArgs @CommandArgs
  if ($LASTEXITCODE -ne 0) { throw "Falló la verificación de calendario: $($CommandArgs -join ' ')" }
}
try {
  $existing = & docker volume ls -q --filter "label=com.docker.compose.project=$Project"
  if ($LASTEXITCODE -ne 0) { throw 'Docker no está disponible.' }
  if ($existing) { throw 'El proyecto ya existe; elegir otro nombre para la prueba.' }
  if (-not $SkipBuild) { Run-Compose @('build', 'academic-test', 'migrate') }
  Run-Compose @('run', '--rm', 'academic-test')
  Run-Compose @('run', '--rm', 'academic-test', 'node', 'test/persistence.cjs', 'write')
  Run-Compose @('down')
  Run-Compose @('up', '-d', '--wait', 'db', 'migrate')
  Run-Compose @('run', '--rm', 'academic-test', 'node', 'test/persistence.cjs', 'read')
  Write-Host "CALENDARIO VERIFICADO: $Project"
} finally {
  & docker @composeArgs down
  Pop-Location
}
