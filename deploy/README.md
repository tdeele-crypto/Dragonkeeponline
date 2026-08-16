# Deploying Dragon Keeper on your Contabo VPS (dragonkeeper.deele.dk)

Runs alongside your existing `indkoeb` app **without touching it**:

| Piece            | Where it runs                          | Port (loopback)      |
|------------------|----------------------------------------|----------------------|
| Backend (FastAPI)| podman container, `--network=host`     | 127.0.0.1:**8011**   |
| Frontend (SPA)   | podman container (nginx)               | 127.0.0.1:**3081**   |
| MongoDB          | your existing host `mongod`            | 127.0.0.1:27017, DB `dragonkeeper` |
| Public entry     | host nginx (80/443) -> reverse proxy   | dragonkeeper.deele.dk|

Port 8001 is already used on your server, so this app uses 8011 / 3081 instead.

---

## Step 0 - DNS
Create an **A record**: `dragonkeeper.deele.dk` -> your VPS public IP. Wait for it to resolve.

## Step 1 - Get the code onto the VPS
In Emergent: **Save -> Save to Github**. Then on the VPS:
```bash
sudo mkdir -p /opt && cd /opt
git clone <your-repo-url> dragonkeeper
cd /opt/dragonkeeper
```

## Step 2 - Backend secrets
```bash
cp deploy/backend.env.example deploy/backend.env
# generate a strong secret and paste it into JWT_SECRET:
openssl rand -hex 32
nano deploy/backend.env
```
Keep `MONGO_URL=mongodb://127.0.0.1:27017` and `DB_NAME=dragonkeeper`
(only change MONGO_URL if your host mongod requires auth - see the example file).

## Step 3 - Build & run the containers
```bash
bash deploy/deploy.sh
```
This builds both images and starts `dragonkeeper-backend` and `dragonkeeper-frontend`.
On first start the backend auto-creates the superadmin and seeds a default care plan.

Verify locally:
```bash
curl -s http://127.0.0.1:8011/api/          # {"message":"Dragon Keeper API"}
curl -sI http://127.0.0.1:3081/ | head -1    # HTTP/1.1 200 OK
```

## Step 4 - Host nginx site
```bash
sudo cp deploy/nginx-dragonkeeper.conf /etc/nginx/sites-available/dragonkeeper.deele.dk
sudo ln -sf /etc/nginx/sites-available/dragonkeeper.deele.dk /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```
Check: visiting http://dragonkeeper.deele.dk should now load the app.

## Step 5 - HTTPS
```bash
sudo apt-get install -y certbot python3-certbot-nginx    # if not already installed
sudo certbot --nginx -d dragonkeeper.deele.dk
```
certbot adds the 443 block + http->https redirect automatically.

## Step 6 - Survive reboots
```bash
sudo systemctl enable podman-restart.service
```
(The containers were started with `--restart=always`.)

## Log in
Open **https://dragonkeeper.deele.dk** and sign in as the superadmin:
- **thorbjorn74@msn.com / Selma2026!**
Change this password flow / create real users as needed.

---

## Updating later
```bash
cd /opt/dragonkeeper
git pull
bash deploy/deploy.sh        # rebuilds + restarts both containers
sudo systemctl reload nginx  # only if you changed the host nginx config
```

## Handy commands
```bash
podman logs -f dragonkeeper-backend
podman logs -f dragonkeeper-frontend
podman ps --filter name=dragonkeeper
podman restart dragonkeeper-backend dragonkeeper-frontend
```

## Notes
- **indkoeb is untouched**: different ports (8011/3081) and a different Mongo DB
  name (`dragonkeeper`).
- **Translation** of custom item names is an Emergent-only feature and is OFF
  when self-hosted (no Emergent key) - names are simply saved as typed in both
  languages. Everything else works fully.
- If your host `mongod` has authentication enabled, put credentials in
  `MONGO_URL` (see `deploy/backend.env.example`).
