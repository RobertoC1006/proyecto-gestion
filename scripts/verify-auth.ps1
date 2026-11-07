param([switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path -Parent $PSScriptRoot)
$testProject = 'campusitsm-auth-check-' + (Get-Date -Format 'yyyyMMddHHmmss')
$composeArgs = @('compose', '-p', $testProject, '-f', 'compose.yml', '-f', 'compose.auth-test.yml')
try {
  if (-not $SkipBuild) {
    & docker @composeArgs build auth-test migrate
    if ($LASTEXITCODE -ne 0) { throw 'Falló la construcción de pruebas.' }
  }
  & docker @composeArgs run --rm auth-test
  if ($LASTEXITCODE -ne 0) { throw 'Fallaron pruebas de identidad/calendario.' }
} finally {
  # Solo recursos del proyecto descartable generado aquí; conserva campusitsm y sus datos.
  & docker @composeArgs down --volumes
  Pop-Location
}
