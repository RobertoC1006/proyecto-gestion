$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot '.env'
if (-not (Test-Path -LiteralPath $envFile)) {
  Copy-Item -LiteralPath (Join-Path $projectRoot '.env.example') -Destination $envFile
}
$content = [System.IO.File]::ReadAllText($envFile)
if ($content -notmatch '(?m)^AUTH_ENCRYPTION_KEY=\S+') {
  $bytes = New-Object byte[] 32
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  $line = 'AUTH_ENCRYPTION_KEY=' + [Convert]::ToBase64String($bytes)
  if ($content -match '(?m)^AUTH_ENCRYPTION_KEY=') {
    $content = [regex]::Replace($content, '(?m)^AUTH_ENCRYPTION_KEY=.*$', $line)
  } else { $content += "`n$line`n" }
  [System.IO.File]::WriteAllText($envFile, $content, (New-Object System.Text.UTF8Encoding $false))
}
Write-Host 'Configuración local preparada sin mostrar claves. Completa SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY en .env.'
