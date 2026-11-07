param([Parameter(Mandatory=$true)][string]$BackupFolder)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$folder = (Resolve-Path -LiteralPath $BackupFolder).Path
if (-not $folder.StartsWith((Join-Path $root '.local/backups/'), [StringComparison]::OrdinalIgnoreCase)) { throw 'El respaldo debe estar en .local/backups.' }
$dump = Join-Path $folder 'database.dump'
if ((Get-FileHash -LiteralPath $dump).Hash -ne (Get-Content -LiteralPath (Join-Path $folder 'database.sha256')).Trim()) { throw 'El respaldo no coincide con su huella.' }
$container = 'campusitsm-restore-check-' + [Guid]::NewGuid().ToString('N')
try {
  & docker run -d --name $container --network none --tmpfs /var/lib/postgresql/data -e POSTGRES_HOST_AUTH_METHOD=trust postgres:17-alpine@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear la base descartable.' }
  for ($i=0; $i -lt 40; $i++) {
    & docker exec $container pg_isready -U postgres 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Milliseconds 250
  }
  & docker cp $dump "${container}:/tmp/backup.dump"
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo copiar el respaldo.' }
  & docker exec $container pg_restore --exit-on-error --no-owner --no-privileges -U postgres -d postgres /tmp/backup.dump
  if ($LASTEXITCODE -ne 0) { throw 'Falló la restauración.' }
  $result = 'SELECT count(*) FROM information_schema.tables WHERE table_schema=''public''; SELECT count(*) FROM "AppUser"; SELECT count(*) FROM "AcademicEvent";' | & docker exec -i $container psql -v ON_ERROR_STOP=1 -U postgres -At
  if ($LASTEXITCODE -ne 0) { throw 'Falló la comprobación del respaldo restaurado.' }
  $result | Set-Content -LiteralPath (Join-Path $folder 'restore-check.txt')
  Write-Output 'Respaldo restaurado correctamente en PostgreSQL aislado, sin puertos ni volúmenes persistentes.'
} finally {
  # Nombre aleatorio creado por esta ejecución; jamás campusitsm ni sus volúmenes.
  & docker rm -f $container | Out-Null
}
