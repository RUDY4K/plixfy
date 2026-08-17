param(
  [Parameter(Mandatory = $true)]
  [string]$Text,
  [Parameter(Mandatory = $true)]
  [string]$Output,
  [int]$Rate = 1
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech

$target = [System.IO.Path]::GetFullPath($Output)
$parent = [System.IO.Path]::GetDirectoryName($target)
[System.IO.Directory]::CreateDirectory($parent) | Out-Null

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $arabicVoice = $synth.GetInstalledVoices() |
    Where-Object { $_.VoiceInfo.Name -eq 'Microsoft Naayf' } |
    Select-Object -First 1
  if (-not $arabicVoice) {
    $arabicVoice = $synth.GetInstalledVoices() |
      Where-Object { $_.VoiceInfo.Culture.Name -like 'ar-*' } |
      Select-Object -First 1
  }
  if (-not $arabicVoice) {
    throw 'No Arabic Windows speech voice is installed.'
  }
  $synth.SelectVoice($arabicVoice.VoiceInfo.Name)
  $synth.Rate = [Math]::Max(-3, [Math]::Min(3, $Rate))
  $format = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(
    48000,
    [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen,
    [System.Speech.AudioFormat.AudioChannel]::Mono
  )
  $synth.SetOutputToWaveFile($target, $format)
  $synth.Speak($Text)
}
finally {
  $synth.Dispose()
}

Write-Output $target
