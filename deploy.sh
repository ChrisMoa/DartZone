#!/bin/bash
# DartZone deployment script
# Usage: ./deploy.sh [--build-remote | --build-local]
#   --build-remote (default): sync source, install deps and build on server
#   --build-local:            build locally first, then sync build artifacts
#
# Configuration via environment variables or .env.deploy:
#   DEPLOY_HOST   - SSH target, e.g. root@192.168.2.221
#   DEPLOY_DIR    - Remote directory, default: /opt/dartzone

set -e

# Load optional local config (not committed to git)
if [ -f .env.deploy ]; then
  # shellcheck disable=SC1091
  source .env.deploy
fi

REMOTE="${DEPLOY_HOST:?'DEPLOY_HOST is not set. Create a .env.deploy file or export DEPLOY_HOST=user@host'}"
REMOTE_DIR="${DEPLOY_DIR:-/opt/dartzone}"
BUILD_MODE="${1:---build-remote}"

echo "🎯 DartZone Deploy → $REMOTE"
echo "================================"

if [ "$BUILD_MODE" = "--build-local" ]; then
  # --- Local build, push artifacts ---
  echo "📦 Building locally..."
  npm run build

  echo "🔄 Syncing build artifacts to server..."
  rsync -avz --delete \
    --exclude='node_modules' \
    --exclude='.svelte-kit' \
    --exclude='tests' \
    --exclude='playwright-report' \
    --exclude='test-results' \
    --exclude='coverage' \
    --exclude='data' \
    --exclude='.git' \
    --exclude='*.log' \
    ./ "$REMOTE:$REMOTE_DIR/"

  echo "🔧 Installing production deps on server (for native modules)..."
  ssh "$REMOTE" "cd $REMOTE_DIR && npm install --omit=dev --ignore-scripts=false"

else
  # --- Push source, build on server (default) ---
  echo "🔄 Syncing source to server..."
  rsync -avz --delete \
    --exclude='node_modules' \
    --exclude='.svelte-kit' \
    --exclude='build' \
    --exclude='tests' \
    --exclude='playwright-report' \
    --exclude='test-results' \
    --exclude='coverage' \
    --exclude='data' \
    --exclude='.git' \
    --exclude='*.log' \
    ./ "$REMOTE:$REMOTE_DIR/"

  echo "🔧 Installing deps and building on server..."
  ssh "$REMOTE" "cd $REMOTE_DIR && npm install && npm run build"
fi

# Write runtime environment variables to server
echo "🔐 Writing runtime environment to server..."
{
  echo "DARTZONE_DB_PATH=${DARTZONE_DB_PATH:-data/dartzone.db}"
  [ -n "$GITHUB_TOKEN" ] && echo "GITHUB_TOKEN=$GITHUB_TOKEN"
} | ssh "$REMOTE" "cat > $REMOTE_DIR/.env"

# Ensure systemd service loads the .env file
echo "🔧 Ensuring systemd EnvironmentFile is configured..."
ssh "$REMOTE" "grep -q 'EnvironmentFile' /etc/systemd/system/dartzone.service 2>/dev/null || \
  (sed -i '/\[Service\]/a EnvironmentFile=$REMOTE_DIR/.env' /etc/systemd/system/dartzone.service && systemctl daemon-reload)"

echo "🔁 Restarting DartZone service..."
ssh "$REMOTE" "systemctl restart dartzone"

echo ""
echo "✅ Deployment done!"
echo "🌐 http://$REMOTE"
