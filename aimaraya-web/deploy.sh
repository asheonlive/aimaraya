#!/usr/bin/env bash
#
# AI MARAYA — Artlist relay one-command deploy (Ubuntu/Debian VPS).
#
# Sets up a Python venv, installs Playwright + Chromium, writes a .env with a
# generated relay secret (if one doesn't exist), installs a systemd service so
# the relay survives reboots, starts it, and prints the health check + the
# values you need to paste into Vercel.
#
#   bash deploy.sh
#
# Re-running is safe: it keeps an existing .env/secret and just updates code.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$APP_DIR/.env"
PORT="${RELAY_PORT:-8800}"
SERVICE_NAME="artlist-relay"

echo "==> AI MARAYA Artlist relay deploy"
echo "    dir:  $APP_DIR"
echo "    port: $PORT"

# --- system deps ---
if command -v apt-get >/dev/null 2>&1; then
  echo "==> Installing system packages (python venv, etc.)"
  sudo apt-get update -y
  sudo apt-get install -y python3-venv python3-pip curl
fi

# --- python venv ---
echo "==> Creating virtualenv"
python3 -m venv "$APP_DIR/venv"
# shellcheck disable=SC1091
source "$APP_DIR/venv/bin/activate"
pip install --upgrade pip >/dev/null
pip install -r "$APP_DIR/requirements.txt"

echo "==> Installing Playwright Chromium + OS deps"
python -m playwright install --with-deps chromium

# --- .env / secret ---
if [ ! -f "$ENV_FILE" ]; then
  echo "==> Creating $ENV_FILE (fill in your Artlist credentials)"
  SECRET="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
  cat > "$ENV_FILE" <<EOF
# ---- Artlist relay config ----
RELAY_SECRET=$SECRET
ARTLIST_EMAIL=CHANGE_ME@example.com
ARTLIST_PASSWORD=CHANGE_ME
RELAY_PORT=$PORT
RELAY_HEADLESS=1
# ARTLIST_GEN_URL=https://app.artlist.io/ai/video
# ARTLIST_DEBUG=1
EOF
  chmod 600 "$ENV_FILE"
  echo "    !! Edit $ENV_FILE and set ARTLIST_EMAIL / ARTLIST_PASSWORD, then re-run."
else
  echo "==> Keeping existing $ENV_FILE"
fi

# --- systemd service ---
if command -v systemctl >/dev/null 2>&1; then
  echo "==> Installing systemd service: $SERVICE_NAME"
  sudo tee "/etc/systemd/system/$SERVICE_NAME.service" >/dev/null <<EOF
[Unit]
Description=AI MARAYA Artlist relay
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
ExecStart=$APP_DIR/venv/bin/python $APP_DIR/artlist_relay.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
  sudo systemctl daemon-reload
  sudo systemctl enable "$SERVICE_NAME"
  sudo systemctl restart "$SERVICE_NAME"
  sleep 3
else
  echo "==> systemd not found; start manually with:"
  echo "    source venv/bin/activate && python artlist_relay.py"
fi

# --- health check ---
echo "==> Health check"
set +e
HEALTH="$(curl -fsS "http://127.0.0.1:$PORT/health" 2>/dev/null)"
set -e
echo "    $HEALTH"

echo
echo "============================================================"
echo " Relay deployed. Values to give Claude / add to Vercel:"
echo "   ARTLIST_RELAY_URL    = http://<THIS_VPS_PUBLIC_IP>:$PORT"
echo "   ARTLIST_RELAY_SECRET = $(grep '^RELAY_SECRET=' "$ENV_FILE" | cut -d= -f2-)"
echo "============================================================"
echo
echo "If 'configured' is false above, edit $ENV_FILE (Artlist email/password)"
echo "then run:  sudo systemctl restart $SERVICE_NAME"
echo "Logs:      journalctl -u $SERVICE_NAME -f"
