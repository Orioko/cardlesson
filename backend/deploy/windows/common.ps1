# Общие функции для start.ps1 и stop.ps1 (подключается через dot-source).
$ErrorActionPreference = 'Stop'
$ScriptDir = $PSScriptRoot
$BackendDir = (Resolve-Path (Join-Path $ScriptDir '..\..')).Path
$ExePath = Join-Path $BackendDir 'bin\cardlesson.exe'
$EnvFile = Join-Path $ScriptDir 'cardlesson-pc.env'
# tailscale.exe — из PATH, иначе из стандартной папки установки (PATH обновляется не сразу).
$Tailscale = (Get-Command tailscale -ErrorAction SilentlyContinue).Source
if (-not $Tailscale) { $Tailscale = Join-Path $env:ProgramFiles 'Tailscale\tailscale.exe' }

# Import-CardLessonEnv читает cardlesson-pc.env, выставляет переменные процесса и возвращает их.
function Import-CardLessonEnv {
  if (-not (Test-Path $EnvFile)) {
    throw "Нет $EnvFile — скопируй cardlesson-pc.env.example и заполни."
  }
  $settings = @{}
  foreach ($line in Get-Content -Encoding UTF8 $EnvFile) {
    $trimmed = $line.Trim()
    if ($trimmed -eq '' -or $trimmed.StartsWith('#')) { continue }
    $pair = $trimmed.Split('=', 2)
    if ($pair.Count -ne 2) { continue }
    $key = $pair[0].Trim()
    $settings[$key] = $pair[1].Trim()
    [Environment]::SetEnvironmentVariable($key, $settings[$key], 'Process')
  }
  return $settings
}

function Test-ServerHours($settings) {
  $now = Get-Date
  # DayOfWeek: 0 — воскресенье; в настройках воскресенье — 7
  $day = [int]$now.DayOfWeek
  if ($day -eq 0) { $day = 7 }
  $days = $settings['SCHEDULE_DAYS'].Split(',') | ForEach-Object { [int]$_.Trim() }
  return ($days -contains $day) -and
    ($now.Hour -ge [int]$settings['SCHEDULE_FROM']) -and
    ($now.Hour -lt [int]$settings['SCHEDULE_TO'])
}

function Get-CardLessonProcess {
  Get-Process -Name 'cardlesson' -ErrorAction SilentlyContinue |
    Where-Object { $_.Path -eq $ExePath }
}

function Get-DataDir {
  $dir = Split-Path -Parent $env:CARDLESSON_DB
  New-Item -ItemType Directory -Force $dir | Out-Null
  return $dir
}

function Write-CardLessonLog($message) {
  Add-Content -Encoding UTF8 (Join-Path (Get-DataDir) 'scheduler.log') "$(Get-Date -Format s) $message"
}
