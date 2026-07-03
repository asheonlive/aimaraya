# Deploying the AI MARAYA backend

This backend now uses only your real, legitimate accounts: Comfy Cloud for
generation and Stripe for payment. No third-party account pooling, no
credit-bypass tricks.

## 0. Before you start

- A domain (or subdomain) you control, e.g. `api.aimaraya.com`, pointed at
  your VPS's IP address (an A record in your DNS provider).
- SSH access to the VPS.
- Real secrets: MongoDB connection string, JWT secret, Stripe key, Comfy
  Cloud credentials.

## 1. Install Docker on the VPS

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

## 2. Get this code onto the VPS

Push this `aimaraya` folder to your own GitHub repo (or `scp` it up directly),
then on the VPS:

```bash
git clone <your-repo-url> aimaraya
cd aimaraya
```

## 3. Fill in real environment values

```bash
cp deploy/backend.env.example deploy/backend.env
nano deploy/backend.env   # MONGO_URL, JWT_SECRET, STRIPE_API_KEY, COMFY_*
```

## 4. Build and start the backend

```bash
cd deploy
docker compose up -d --build
docker compose logs -f backend
```

Backend now listens on `127.0.0.1:8001` only (nginx handles the internet-facing side).

## 5. nginx + HTTPS

```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
sudo cp nginx.conf.example /etc/nginx/sites-available/aimaraya-api
sudo nano /etc/nginx/sites-available/aimaraya-api   # set your real domain
sudo ln -s /etc/nginx/sites-available/aimaraya-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.YOUR_DOMAIN.com
```

Test: `curl https://api.YOUR_DOMAIN.com/api/` should return
`{"status":"ok","service":"AI MARAYA"}`.

## 6. Point the live frontend at it

Edit both `vercel.json` (repo root) and `frontend/vercel.json` - replace
`api.YOUR_DOMAIN.com` with your real domain from step 5. Commit and push to
the `asheonlive/aimaraya` GitHub repo connected to the `aimaraya-web` Vercel
project - it will redeploy automatically.

## 7. Smoke test

- Register a new account (real email/password)
- Generate one image
- Buy a credit pack (Stripe test mode first, then live)
- Confirm `/success` shows credits added
