# PowerShell script to locate JDT.LS in VS Code extensions

# Path to VS Code extensions
$extensionsPath = "$env:USERPROFILE\.vscode\extensions"

# Find the redhat.java extension
$javaExtension = Get-ChildItem -Path $extensionsPath -Directory | Where-Object { $_.Name -like "redhat.java-*" } | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($javaExtension) {
    $jdtlsPath = Join-Path -Path $javaExtension.FullName -ChildPath "server"
    
    Write-Host "Found JDT.LS path: $jdtlsPath"
    
    # Create a configuration file for our connector
    $configContent = @"
{
    "jdtls": {
        "path": "$($jdtlsPath.Replace('\', '\\'))",
        "launcher": "$($jdtlsPath.Replace('\', '\\'))\\plugins\\org.eclipse.equinox.launcher_*.jar",
        "config": "$($jdtlsPath.Replace('\', '\\'))\\config_win"
    }
}
"@
    
    Set-Content -Path "jdtls-config.json" -Value $configContent
    
    Write-Host "Created configuration file: jdtls-config.json"
} else {
    Write-Host "ERROR: Java extension not found. Please install 'Java Extension Pack' in VS Code first."
}
