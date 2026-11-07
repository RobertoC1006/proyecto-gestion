$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
  $folder = Join-Path $root ('.local/backups/before-supabase-' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ'))
  New-Item -ItemType Directory -Path $folder | Out-Null
  Copy-Item -LiteralPath '.env' -Destination (Join-Path $folder 'installation.env')
  & docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --file=/tmp/campusitsm-backup.dump'
  if ($LASTEXITCODE -ne 0) { throw 'Falló el respaldo PostgreSQL.' }
  & docker compose cp db:/tmp/campusitsm-backup.dump (Join-Path $folder 'database.dump')
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo conservar el respaldo.' }
  $hash = Get-FileHash -LiteralPath (Join-Path $folder 'database.dump') -Algorithm SHA256
  $hash.Hash | Set-Content -LiteralPath (Join-Path $folder 'database.sha256')
  Write-Output $folder
} finally { Pop-Location }
