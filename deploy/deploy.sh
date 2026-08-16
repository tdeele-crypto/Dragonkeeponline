#!/usr/bin/env bash
# One-shot build + (re)start for Dragon Keeper on the VPS (podman, rootful).
# Run from the repository root:  bash deploy/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."   # -> repository root

DOMAIN_URL="https://dragonkeeper.deele.dk"
BACKEND_IMAGE="dragonkeeper-backend:latest"
FRONTEND_IMAGE="dragonkeeper-frontend:latest"

if [ ! -f deploy/backend.env ]; then
  echo "ERROR: deploy/backend.env not found."
  echo "       cp deploy/backend.env.example deploy/backend.env  and edit JWT_SECRET first."
  exit 1
fi

echo "==> Building backend image"
podman build -t "$BACKEND_IMAGE" -f deploy/backend.Containerfile .

echo "==> Building frontend image (baking EXPO_PUBLIC_BACKEND_URL=$DOMAIN_URL)"
podman build -t "$FRONTEND_IMAGE" \
  --build-arg EXPO_PUBLIC_BACKEND_URL="$DOMAIN_URL" \
  -f deploy/frontend.Containerfile .

echo "==> (Re)starting backend container (host network, loopback:8011)"
podman rm -f dragonkeeper-backend >/dev/null 2>&1 || true
podman run -d --name dragonkeeper-backend \
  --network=host \
  --env-file deploy/backend.env \
  --restart=always \
  "$BACKEND_IMAGE"

echo "==> (Re)starting frontend container (loopback:3081 -> 80)"
podman rm -f dragonkeeper-frontend >/dev/null 2>&1 || true
podman run -d --name dragonkeeper-frontend \
  -p 127.0.0.1:3081:80 \
  --restart=always \
  "$FRONTEND_IMAGE"

echo
echo "==> Containers:"
podman ps --filter name=dragonkeeper
echo
echo "Done. Quick checks:"
echo "  curl -s http://127.0.0.1:8011/api/        # -> {\"message\":\"Dragon Keeper API\"}"
echo "  curl -sI http://127.0.0.1:3081/ | head -1  # -> HTTP/1.1 200 OK"
