param([string[]]$Tests = @('test/workflow.test.cjs','test/academic.test.cjs','test/auth.test.cjs'))
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$suffix = [guid]::NewGuid().ToString('N').Substring(0,12)
$network = "campusitsm-workflow-check-$suffix"
$database = "$network-db"
$bytes = New-Object byte[] 24
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$password = [Convert]::ToHexString($bytes).ToLowerInvariant()
$url = "postgresql://campusitsm:$password@db:5432/workflow_test?schema=public"
$image = 'campusitsm-workflow-test:local'
$networkCreated = $false
$databaseCreated = $false

function Invoke-Docker([string[]]$Arguments) {
  & docker @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Docker falló (código $LASTEXITCODE)." }
}

Push-Location $root
try {
  Invoke-Docker @('network','create','--internal',$network)
  $networkCreated = $true
  Invoke-Docker @('run','-d','--name',$database,'--network',$network,'--network-alias','db',
    '--tmpfs','/var/lib/postgresql/data','-e','POSTGRES_USER=campusitsm',
    '-e',"POSTGRES_PASSWORD=$password",'-e','POSTGRES_DB=workflow_test','postgres:17-alpine')
  $databaseCreated = $true
  $healthy = $false
  for ($attempt=0; $attempt -lt 40; $attempt++) {
    & docker exec $database pg_isready -h 127.0.0.1 -U campusitsm -d workflow_test *> $null
    if ($LASTEXITCODE -eq 0) { $healthy = $true; break }
    Start-Sleep -Seconds 1
  }
  if (-not $healthy) { throw 'PostgreSQL temporal no inició.' }
  Invoke-Docker @('exec',$database,'psql','-U','campusitsm','-d','workflow_test','-c','CREATE SCHEMA campusitsm')
  $base = @('run','--rm','--network',$network,'-e',"DATABASE_URL=$url",'-e','CAMPUS_JOBS_ENABLED=0',
    '-e','APP_ORIGIN=http://localhost:8080','-e','SUPABASE_URL=https://test.supabase.co',
    '-e','SUPABASE_PUBLISHABLE_KEY=sb_publishable_test_only',
    '-e','AUTH_ENCRYPTION_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    '-e','AUTH_INSTITUTION_CODE=AUTH-TEST',$image)
  Invoke-Docker ($base + @('node','prisma/deploy.cjs'))
  Invoke-Docker ($base + @('node','--test','--test-concurrency=1') + $Tests)
} finally {
  if ($databaseCreated) { & docker rm -f $database *> $null }
  if ($networkCreated) { & docker network rm $network *> $null }
  Pop-Location
}
