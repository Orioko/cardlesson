# Остановка туннеля и сервера. Планировщик вызывает его по будням в 20:00.
# Туннель гасится первым: клиенты получают «нет связи» и копят изменения у себя.
# SQLite в режиме WAL переносит остановку процесса без потери уже записанных данных.
. (Join-Path $PSScriptRoot 'common.ps1')

$settings = Import-CardLessonEnv
switch ($settings['CARDLESSON_TUNNEL']) {
  'tailscale' { & $Tailscale funnel --https=443 off | Out-Null }
  'cloudflared' {
    Get-Process -Name 'cloudflared' -ErrorAction SilentlyContinue | Stop-Process -Force
  }
}

$server = Get-CardLessonProcess
if ($server) {
  $server | Stop-Process -Force
  Write-CardLessonLog 'stop: сервер остановлен'
} else {
  Write-CardLessonLog 'stop: сервер не был запущен'
}
