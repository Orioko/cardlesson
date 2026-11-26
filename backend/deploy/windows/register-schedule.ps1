# Регистрирует задачи планировщика Windows для текущего пользователя (права администратора не нужны):
#   CardLesson Start — по будням в 10:00 и при входе в Windows (start.ps1 сам проверит часы);
#                      если в 10:00 ПК был выключен, задача выполнится, как только он включится;
#   CardLesson Stop  — по будням в 20:00.
# Удалить задачи: .\register-schedule.ps1 -Unregister
param([switch]$Unregister)
$ErrorActionPreference = 'Stop'
$names = 'CardLesson Start', 'CardLesson Stop'

if ($Unregister) {
  foreach ($name in $names) {
    Unregister-ScheduledTask -TaskName $name -Confirm:$false -ErrorAction SilentlyContinue
  }
  Write-Output 'Задачи CardLesson удалены.'
  exit 0
}

$days = 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
$taskSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 5)

function New-ScriptAction($script) {
  $path = Join-Path $PSScriptRoot $script
  New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$path`""
}

$startTriggers = @(
  (New-ScheduledTaskTrigger -Weekly -DaysOfWeek $days -At '10:00'),
  (New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME)
)
Register-ScheduledTask -TaskName $names[0] -Action (New-ScriptAction 'start.ps1') `
  -Trigger $startTriggers -Settings $taskSettings -Force | Out-Null
Register-ScheduledTask -TaskName $names[1] -Action (New-ScriptAction 'stop.ps1') `
  -Trigger (New-ScheduledTaskTrigger -Weekly -DaysOfWeek $days -At '20:00') `
  -Settings $taskSettings -Force | Out-Null
Write-Output 'Задачи CardLesson Start и CardLesson Stop зарегистрированы.'
