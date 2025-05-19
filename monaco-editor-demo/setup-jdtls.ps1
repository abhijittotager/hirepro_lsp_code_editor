# PowerShell script to download and set up Eclipse JDT Language Server

# Create directory structure
$jdtlsPath = "jdtls"
$workspacePath = "workspace"
$downloadUrl = "https://download.eclipse.org/jdtls/snapshots/jdt-language-server-latest.tar.gz"
$downloadFile = "jdtls.tar.gz"

# Create directories
New-Item -ItemType Directory -Force -Path $jdtlsPath | Out-Null
New-Item -ItemType Directory -Force -Path $workspacePath | Out-Null
New-Item -ItemType Directory -Force -Path "$workspacePath\src" | Out-Null

Write-Host "Downloading Eclipse JDT.LS..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadFile

# Check if 7zip is available for extraction
if (Get-Command "7z" -ErrorAction SilentlyContinue) {
    Write-Host "Extracting using 7-Zip..."
    7z x $downloadFile -o"$jdtlsPath" -y
} else {
    Write-Host "7-Zip not found. Please extract $downloadFile to $jdtlsPath manually."
    Write-Host "You can download 7-Zip from: https://www.7-zip.org/"
}

# Create a sample Java file for testing
$sampleJavaContent = @"
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello from JDT.LS!");
    }
}
"@

Set-Content -Path "$workspacePath\src\HelloWorld.java" -Value $sampleJavaContent

Write-Host "Setup complete!"
Write-Host "Next step: Run the JDT.LS server using run-jdtls.bat"
