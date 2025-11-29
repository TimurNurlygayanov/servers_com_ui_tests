# Unpack screenshots from password-protected zip archive
# Password is read from QA_PASS in .env file

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
$envFile = Join-Path $projectDir ".env"
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

if (-not (Test-Path $archivePath)) {
    Write-Error "Error: screenshots.zip not found"
    exit 1
}

# Extract using 7-Zip if available, otherwise use built-in (which doesn't support passwords well)
$7zipPath = "C:\Program Files\7-Zip\7z.exe"
if (Test-Path $7zipPath) {
    & $7zipPath x -o"$projectDir" -p"$password" -y "$archivePath"
} else {
    # Try using unzip if available (e.g., Git Bash)
    $unzipPath = Get-Command unzip -ErrorAction SilentlyContinue
    if ($unzipPath) {
        Push-Location $projectDir
        & unzip -o -P $password screenshots.zip
        Pop-Location
    } else {
        Write-Host "Please install 7-Zip or use Git Bash to extract password-protected archives"
        Write-Host "Manual extraction: unzip -P <password> screenshots.zip"
        exit 1
    }
}

Write-Host "Screenshots unpacked to screenshots/ directory"
