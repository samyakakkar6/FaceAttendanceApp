#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND="$ROOT/frontend"
BACKEND="$ROOT/backend"
MODELS="$FRONTEND/public/models"

# ── colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()  { echo -e "${GREEN}✔ $*${NC}"; }
inf() { echo -e "${YELLOW}▶ $*${NC}"; }
err() { echo -e "${RED}✖ $*${NC}"; exit 1; }

# ── Node check ────────────────────────────────────────────────────────────────
NODE_VER=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1)
[ -z "$NODE_VER" ] && err "Node.js not found. Run: brew install node"
[ "$NODE_VER" -lt 20 ] && err "Node $NODE_VER too old. Run: brew install node"
ok "Node $(node --version)"

# ── Install deps if needed ────────────────────────────────────────────────────
if [ ! -d "$BACKEND/node_modules" ]; then
  inf "Installing backend deps..."
  (cd "$BACKEND" && npm install --silent)
fi
ok "Backend deps ready"

if [ ! -d "$FRONTEND/node_modules" ]; then
  inf "Installing frontend deps..."
  (cd "$FRONTEND" && npm install --silent)
fi
ok "Frontend deps ready"

# ── Download face-api.js models if missing ────────────────────────────────────
MODELS_OK=true
for f in tiny_face_detector_model-weights_manifest.json \
          face_landmark_68_tiny_model-weights_manifest.json \
          face_recognition_model-weights_manifest.json; do
  [ ! -f "$MODELS/$f" ] && MODELS_OK=false && break
done

if [ "$MODELS_OK" = false ]; then
  inf "Downloading face-api.js model weights (~7 MB)..."
  mkdir -p "$MODELS"
  BASE="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
  FILES=(
    tiny_face_detector_model-weights_manifest.json
    tiny_face_detector_model-shard1
    face_landmark_68_tiny_model-weights_manifest.json
    face_landmark_68_tiny_model-shard1
    face_recognition_model-weights_manifest.json
    face_recognition_model-shard1
    face_recognition_model-shard2
  )
  for f in "${FILES[@]}"; do
    curl -fsSL --retry 3 --retry-delay 1 "$BASE/$f" -o "$MODELS/$f" || err "Failed to download $f"
    echo -n "."
  done
  echo ""
fi
ok "face-api.js models ready"

# ── Start backend ─────────────────────────────────────────────────────────────
inf "Starting backend on http://localhost:3000 ..."
(cd "$BACKEND" && node server.js) &
BACKEND_PID=$!

# wait for backend to be ready
for i in $(seq 1 20); do
  curl -sf http://localhost:3000/health >/dev/null 2>&1 && break
  sleep 0.5
done
ok "Backend running (PID $BACKEND_PID)"

# ── Start frontend dev server ─────────────────────────────────────────────────
inf "Starting frontend dev server on http://localhost:9000 ..."
(cd "$FRONTEND" && npx quasar dev) &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  FaceAttend is booting!${NC}"
echo -e "${GREEN}  Frontend → http://localhost:9000${NC}"
echo -e "${GREEN}  Backend  → http://localhost:3000${NC}"
echo -e "${GREEN}  Admin    → admin@company.com / Admin@123${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Press Ctrl+C to stop both servers."

# ── Cleanup on exit ───────────────────────────────────────────────────────────
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT INT TERM
wait
