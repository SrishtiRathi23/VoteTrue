param(
    [string]$ProjectId = $env:GCP_PROJECT,
    [string]$Region = "asia-south1"
)

$ErrorActionPreference = "Stop"

if (-not $ProjectId) {
    throw "Set GCP_PROJECT or pass -ProjectId prompt-wars-2"
}

if (-not $env:GEMINI_API_KEY) {
    throw "Set GEMINI_API_KEY before running deploy.ps1"
}

if (-not $env:NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    $localEnv = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) ".env.local"
    if (Test-Path $localEnv) {
        $googleLine = Get-Content $localEnv | Where-Object { $_ -match "^NEXT_PUBLIC_GOOGLE_CLIENT_ID=" } | Select-Object -First 1
        if ($googleLine) {
            $env:NEXT_PUBLIC_GOOGLE_CLIENT_ID = $googleLine -replace "^NEXT_PUBLIC_GOOGLE_CLIENT_ID=", ""
        }
    }
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendService = "votetrue-backend"
$FrontendService = "votetrue-frontend"
$BackendImage = "gcr.io/$ProjectId/${BackendService}:latest"
$FrontendImage = "gcr.io/$ProjectId/${FrontendService}:latest"
$BackendEnvVars = "ENVIRONMENT=production,GOOGLE_CLOUD_PROJECT=$ProjectId,ALLOWED_ORIGINS=*"
if ($env:REDIS_URL) {
    $BackendEnvVars = "$BackendEnvVars,REDIS_URL=$env:REDIS_URL"
}

Set-Location $repoRoot
$safeTemp = Join-Path $repoRoot ".tmp"
New-Item -ItemType Directory -Force -Path $safeTemp | Out-Null
$env:TEMP = $safeTemp
$env:TMP = $safeTemp
$env:TMPDIR = $safeTemp
[Environment]::SetEnvironmentVariable("TEMP", $safeTemp, "Process")
[Environment]::SetEnvironmentVariable("TMP", $safeTemp, "Process")
[Environment]::SetEnvironmentVariable("TMPDIR", $safeTemp, "Process")
$env:CLOUDSDK_CONFIG = Join-Path $repoRoot ".gcloud"
Remove-Item Env:HTTP_PROXY -ErrorAction SilentlyContinue
Remove-Item Env:HTTPS_PROXY -ErrorAction SilentlyContinue
Remove-Item Env:http_proxy -ErrorAction SilentlyContinue
Remove-Item Env:https_proxy -ErrorAction SilentlyContinue
Remove-Item Env:ALL_PROXY -ErrorAction SilentlyContinue
Remove-Item Env:all_proxy -ErrorAction SilentlyContinue
Remove-Item Env:GIT_HTTP_PROXY -ErrorAction SilentlyContinue
Remove-Item Env:GIT_HTTPS_PROXY -ErrorAction SilentlyContinue

function Invoke-Checked {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Command)
    & $Command[0] $Command[1..($Command.Length - 1)]
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $($Command -join ' ')"
    }
}

Write-Host "Using project: $ProjectId"
Invoke-Checked gcloud.cmd config set project $ProjectId

Invoke-Checked gcloud.cmd services enable `
    run.googleapis.com `
    cloudbuild.googleapis.com `
    secretmanager.googleapis.com `
    vision.googleapis.com `
    containerregistry.googleapis.com

$secretExists = $true
try {
    gcloud.cmd secrets describe GEMINI_API_KEY *> $null
} catch {
    $secretExists = $false
}

if ($secretExists) {
    $env:GEMINI_API_KEY | gcloud.cmd secrets versions add GEMINI_API_KEY --data-file=-
    if ($LASTEXITCODE -ne 0) { throw "Failed to add GEMINI_API_KEY secret version" }
} else {
    $env:GEMINI_API_KEY | gcloud.cmd secrets create GEMINI_API_KEY --data-file=-
    if ($LASTEXITCODE -ne 0) { throw "Failed to create GEMINI_API_KEY secret" }
}

Invoke-Checked gcloud.cmd builds submit backend --tag $BackendImage

Invoke-Checked gcloud.cmd run deploy $BackendService `
    --image $BackendImage `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --port 8080 `
    --memory 1Gi `
    --cpu 1 `
    --min-instances 0 `
    --max-instances 3 `
    --set-env-vars $BackendEnvVars `
    --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest"

$BackendUrl = gcloud.cmd run services describe $BackendService --region $Region --format="value(status.url)"
if ($LASTEXITCODE -ne 0 -or -not $BackendUrl) { throw "Failed to read backend Cloud Run URL" }

$frontendBuildConfig = Join-Path $env:TEMP "votetrue-frontend-cloudbuild.yaml"
@"
steps:
  - name: gcr.io/cloud-builders/docker
    args:
      - build
      - -f
      - frontend/Dockerfile
      - --build-arg
      - NEXT_PUBLIC_API_URL=$BackendUrl
      - --build-arg
      - NEXT_PUBLIC_GOOGLE_CLIENT_ID=$env:NEXT_PUBLIC_GOOGLE_CLIENT_ID
      - -t
      - $FrontendImage
      - .
images:
  - $FrontendImage
"@ | Set-Content -Path $frontendBuildConfig -Encoding UTF8

Invoke-Checked gcloud.cmd builds submit . --config $frontendBuildConfig

Invoke-Checked gcloud.cmd run deploy $FrontendService `
    --image $FrontendImage `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --port 3000 `
    --memory 512Mi `
    --cpu 1 `
    --min-instances 0 `
    --max-instances 3

$FrontendUrl = gcloud.cmd run services describe $FrontendService --region $Region --format="value(status.url)"
if ($LASTEXITCODE -ne 0 -or -not $FrontendUrl) { throw "Failed to read frontend Cloud Run URL" }

Write-Host "Backend URL:  $BackendUrl"
Write-Host "Frontend URL: $FrontendUrl"
