# Pack screenshots into a password-protected zip archive
# Password is read from QA_PASS in .env file

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
$envFile = Join-Path $projectDir ".env"
$screenshotsDir = Join-Path $projectDir "screenshots"
$archivePath = Join-Path $projectDir "screenshots.zip"

# Read password from .env
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    foreach ($line in $envContent) {
        if ($line -match "^QA_PASS=(.+)$") {
            $password = $matches[1]
            break
        }
    }
}

if (-not $password) {
    Write-Error "Error: QA_PASS not found in .env file"
    exit 1
}

if (-not (Test-Path $screenshotsDir)) {
    Write-Error "Error: screenshots/ directory not found"
    exit 1
}

# Remove old archive if exists
if (Test-Path $archivePath) {
    Remove-Item $archivePath
}

# Create archive using 7-Zip if available
$7zipPath = "C:\Program Files\7-Zip\7z.exe"
if (Test-Path $7zipPath) {
    Push-Location $projectDir
    & $7zipPath a -tzip -p"$password" screenshots.zip screenshots/
    Pop-Location
} else {
    # Try using zip if available (e.g., Git Bash)
    $zipPath = Get-Command zip -ErrorAction SilentlyContinue
    if ($zipPath) {
        Push-Location $projectDir
        & zip -r -P $password screenshots.zip screenshots/
        Pop-Location
    } else {
        Write-Host "Please install 7-Zip or use Git Bash to create password-protected archives"
        exit 1
    }
}

Write-Host "Screenshots packed to screenshots.zip (password-protected)"
