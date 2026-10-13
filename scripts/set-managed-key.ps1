# Run in your current PowerShell session; the key is not saved to disk.
$managedSecret = Read-Host 'Enter your NEW Claude API key' -AsSecureString
$managedPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($managedSecret)
try {
    $env:ANTHROPIC_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($managedPointer)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($managedPointer)
    $managedSecret.Dispose()
    Remove-Variable managedSecret, managedPointer
}
Write-Host 'API key set for this shell and its child processes. Value not displayed or saved.'
