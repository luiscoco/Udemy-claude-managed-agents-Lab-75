# Enter a replacement locally; the value is never echoed or passed as a shell argument.
$lab75SecureKey = Read-Host 'New Lab 75 Anthropic API key' -AsSecureString
$lab75KeyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($lab75SecureKey)
try {
  $lab75PlainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($lab75KeyPointer)
  if (-not $lab75PlainKey.StartsWith('sk-ant-')) { throw 'Expected an Anthropic API key; no changes made.' }
  $lab75EnvPath = Join-Path $PSScriptRoot '..\.env'
  $lab75EnvLines = if (Test-Path -LiteralPath $lab75EnvPath) { [IO.File]::ReadAllLines($lab75EnvPath) } else { @() }
  $lab75EnvLines = @($lab75EnvLines | Where-Object { $_ -notmatch '^LAB75_ANTHROPIC_API_KEY=' })
  $lab75EnvLines += 'LAB75_ANTHROPIC_API_KEY=' + $lab75PlainKey
  [IO.File]::WriteAllLines($lab75EnvPath, $lab75EnvLines, [Text.UTF8Encoding]::new($false))
  Write-Output 'Lab 75 key updated in ignored .env. Restart the backend to load it.'
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($lab75KeyPointer)
  $lab75PlainKey = $null
  $lab75SecureKey = $null
}
