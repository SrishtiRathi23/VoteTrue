#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${GCP_PROJECT:?Set GCP_PROJECT before running deploy.sh}"
REGION="asia-south1"
BACKEND_SERVICE="votetrue-backend"
FRONTEND_SERVICE="votetrue-frontend"
BACKEND_IMAGE="gcr.io/${PROJECT_ID}/${BACKEND_SERVICE}:latest"
FRONTEND_IMAGE="gcr.io/${PROJECT_ID}/${FRONTEND_SERVICE}:latest"
if [[ -z "${NEXT_PUBLIC_GOOGLE_CLIENT_ID:-}" && -f ".env.local" ]]; then
  NEXT_PUBLIC_GOOGLE_CLIENT_ID="$(grep '^NEXT_PUBLIC_GOOGLE_CLIENT_ID=' .env.local | head -n1 | cut -d= -f2- || true)"
  export NEXT_PUBLIC_GOOGLE_CLIENT_ID
fi
BACKEND_ENV_VARS="ENVIRONMENT=production,GOOGLE_CLOUD_PROJECT=${PROJECT_ID},ALLOWED_ORIGINS=*"
if [[ -n "${REDIS_URL:-}" ]]; then
  BACKEND_ENV_VARS="${BACKEND_ENV_VARS},REDIS_URL=${REDIS_URL}"
fi

export CLOUDSDK_CONFIG="${CLOUDSDK_CONFIG:-$(pwd)/.gcloud}"
unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy ALL_PROXY all_proxy GIT_HTTP_PROXY GIT_HTTPS_PROXY

echo "Using project: ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}"

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  vision.googleapis.com \
  containerregistry.googleapis.com

if ! gcloud secrets describe GEMINI_API_KEY >/dev/null 2>&1; then
  echo -n "${GEMINI_API_KEY:?Set GEMINI_API_KEY before running deploy.sh}" \
    | gcloud secrets create GEMINI_API_KEY --data-file=-
else
  echo -n "${GEMINI_API_KEY:?Set GEMINI_API_KEY before running deploy.sh}" \
    | gcloud secrets versions add GEMINI_API_KEY --data-file=-
fi

gcloud builds submit backend --tag "${BACKEND_IMAGE}"

gcloud run deploy "${BACKEND_SERVICE}" \
  --image "${BACKEND_IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "${BACKEND_ENV_VARS}" \
  --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest"

BACKEND_URL="$(gcloud run services describe "${BACKEND_SERVICE}" --region "${REGION}" --format='value(status.url)')"

FRONTEND_BUILDCONFIG="$(mktemp)"
cat > "${FRONTEND_BUILDCONFIG}" <<EOF
steps:
  - name: gcr.io/cloud-builders/docker
    args:
      - build
      - -f
      - frontend/Dockerfile
      - --build-arg
      - NEXT_PUBLIC_API_URL=${BACKEND_URL}
      - --build-arg
      - NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID:-}
      - -t
      - ${FRONTEND_IMAGE}
      - .
images:
  - ${FRONTEND_IMAGE}
EOF
gcloud builds submit . \
  --config "${FRONTEND_BUILDCONFIG}"

gcloud run deploy "${FRONTEND_SERVICE}" \
  --image "${FRONTEND_IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3

FRONTEND_URL="$(gcloud run services describe "${FRONTEND_SERVICE}" --region "${REGION}" --format='value(status.url)')"

echo "Backend URL:  ${BACKEND_URL}"
echo "Frontend URL: ${FRONTEND_URL}"
