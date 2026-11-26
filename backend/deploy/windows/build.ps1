# Сборка сервера в backend\bin\cardlesson.exe (нужен Go: https://go.dev/dl/).
# После обновления кода: build.ps1, затем stop.ps1 и start.ps1.
$ErrorActionPreference = 'Stop'
$BackendDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Push-Location $BackendDir
try {
  go test ./...
  if ($LASTEXITCODE -ne 0) { throw 'Тесты не прошли — сборка остановлена.' }
  go build -trimpath -ldflags '-s -w' -o bin\cardlesson.exe ./cmd/cardlesson
  if ($LASTEXITCODE -ne 0) { throw 'Сборка не удалась.' }
  Write-Output "Готово: $BackendDir\bin\cardlesson.exe"
} finally {
  Pop-Location
}
