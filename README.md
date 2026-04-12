# Banter 🗣️

Eine selbst gehostete Sprüche-Sammlung für dich und deine Freunde. Jeder kann Sprüche lesen, eigene hinzufügen und bearbeiten.

## Features

- **Homepage** — Zufälliger Spruch mit einem Klick neu laden
- **Alle Sprüche** — Übersicht mit Live-Suche
- **Benutzerkonten** — Individuelle Accounts, erster registrierter User wird Admin
- **Sprüche verwalten** — Hinzufügen, bearbeiten und löschen (eigene Sprüche oder als Admin alle)

---

## Lokale Entwicklung

```bash
# 1. Repository klonen
git clone https://github.com/Chris040300/banter_app.git
cd banter_app

# 2. Abhängigkeiten installieren
npm install

# 3. Umgebungsvariablen einrichten
cp .env.local.example .env.local
# .env.local öffnen und NEXTAUTH_SECRET setzen (beliebiger langer zufälliger String)

# 4. Entwicklungsserver starten
npm run dev
```

App läuft auf http://localhost:3000

---

## Deployment auf Raspberry Pi

### Voraussetzungen

- Raspberry Pi mit Raspberry Pi OS (oder vergleichbares Linux)
- Node.js 20+ installiert
- `pm2` als Prozess-Manager

### Schritt 1: Node.js installieren (falls nicht vorhanden)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # sollte v20.x.x ausgeben
```

### Schritt 2: Repository klonen und bauen

```bash
git clone https://github.com/Chris040300/banter_app.git
cd banter_app
npm install
npm run build
```

### Schritt 3: Umgebungsvariablen einrichten

```bash
cp .env.local.example .env.local
nano .env.local
```

Folgende Werte eintragen:

```
NEXTAUTH_SECRET=<zufälliger String, z. B. mit: openssl rand -base64 32>
NEXTAUTH_URL=http://<IP-Adresse-des-Pi>:3000
DATABASE_PATH=./banter.db
```

> Die IP-Adresse des Pi herausfinden: `hostname -I`

### Schritt 4: pm2 installieren und App starten

```bash
npm install -g pm2

# App starten
pm2 start ecosystem.config.js

# pm2 beim Neustart automatisch starten
pm2 save
pm2 startup
# Den angezeigten Befehl kopieren und ausführen (beginnt mit "sudo env PATH=...")
```

### Schritt 5: Prüfen ob alles läuft

```bash
pm2 status          # sollte "banter" als "online" anzeigen
pm2 logs banter     # Logs anzeigen
```

App erreichbar unter: `http://<IP-Adresse-des-Pi>:3000`

### App im lokalen Netzwerk erreichbar machen

Falls du die App auch von anderen Geräten im Netzwerk erreichst, stelle sicher dass Port 3000 in der Firewall freigegeben ist:

```bash
sudo ufw allow 3000
```

### Updates einspielen

```bash
cd banter_app
git pull
npm install
npm run build
pm2 restart banter
```

### Nützliche pm2-Befehle

```bash
pm2 status          # Status aller Apps
pm2 logs banter     # Live-Logs anzeigen
pm2 restart banter  # App neu starten
pm2 stop banter     # App stoppen
pm2 delete banter   # App aus pm2 entfernen
```

---

## Online hosten mit Cloudflare Tunnel (öffentlich erreichbar)

Mit einem **Cloudflare Tunnel** wird dein Raspberry Pi von überall auf der Welt erreichbar — ohne Port-Forwarding, ohne feste IP, mit kostenlosem SSL.

**Was du brauchst:**
- Einen Cloudflare-Account (kostenlos)
- Eine Domain (z. B. bei Cloudflare Registrar ~8€/Jahr für `.de`)
- Den laufenden Banter-Pi aus dem Deployment-Abschnitt oben

---

### Teil 1: Domain bei Cloudflare kaufen

1. Gehe auf [cloudflare.com](https://cloudflare.com) → Account erstellen (kostenlos)
2. Im Dashboard links auf **Domain Registration → Register Domains** klicken
3. Gewünschten Domainnamen suchen (z. B. `meinbanter.de`) und kaufen (~8€/Jahr)
4. **WHOIS-Schutz** ist bei Cloudflare automatisch aktiviert — deine Adresse bleibt privat
5. **Automatische Verlängerung** aktivieren (Standard) — sonst läuft die Domain ab

> Die Domain ist sofort aktiv. DNS wird automatisch auf Cloudflare eingestellt.

---

### Teil 2: Cloudflare Tunnel einrichten (auf dem Pi)

#### cloudflared installieren

```bash
# ARM64 (Raspberry Pi 4 / 5):
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o cloudflared

# ARM32 (Raspberry Pi 3 oder älter):
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm -o cloudflared

sudo mv cloudflared /usr/local/bin/
sudo chmod +x /usr/local/bin/cloudflared
cloudflared --version  # prüfen ob Installation geklappt hat
```

#### Mit Cloudflare verbinden

```bash
cloudflared tunnel login
```

Ein Link wird angezeigt → im Browser öffnen → mit deinem Cloudflare-Account einloggen → Deine Domain auswählen und authorisieren.

#### Tunnel erstellen

```bash
cloudflared tunnel create banter
```

Das erstellt einen Tunnel und gibt eine **Tunnel-ID** aus (sieht aus wie `abc12345-...`). Diese ID brauchst du gleich.

#### Subdomain dem Tunnel zuweisen

```bash
cloudflared tunnel route dns banter banter.deinedomain.de
```

Ersetze `deinedomain.de` mit deiner echten Domain. Du kannst auch `www.deinedomain.de` oder direkt `deinedomain.de` nehmen.

#### Tunnel-Konfigurationsdatei erstellen

```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Folgenden Inhalt einfügen (Tunnel-ID und Domain anpassen):

```yaml
tunnel: <deine-tunnel-id>
credentials-file: /home/<dein-username>/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: banter.deinedomain.de
    service: http://localhost:3000
  - service: http_status:404
```

> Den Benutzernamen herausfinden: `whoami`
> Die Tunnel-ID aus dem vorherigen Schritt verwenden

#### Tunnel testen

```bash
cloudflared tunnel run banter
```

Jetzt sollte die App unter `https://banter.deinedomain.de` erreichbar sein (SSL wird automatisch eingerichtet). Mit `Ctrl+C` stoppen.

---

### Teil 3: .env.local anpassen

Jetzt wo die App eine öffentliche URL hat, muss `NEXTAUTH_URL` aktualisiert werden:

```bash
nano ~/banter_app/.env.local
```

Wert ändern:

```
NEXTAUTH_URL=https://banter.deinedomain.de
```

App neu starten:

```bash
pm2 restart banter
```

---

### Teil 4: Tunnel als Dienst einrichten (startet automatisch)

```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared  # automatisch bei jedem Neustart starten
```

Prüfen ob der Dienst läuft:

```bash
sudo systemctl status cloudflared
```

---

### Ergebnis

Nach diesem Setup:

- ✅ App erreichbar unter `https://banter.deinedomain.de`
- ✅ SSL-Zertifikat automatisch (kostenlos)
- ✅ Startet automatisch wenn der Pi hochfährt
- ✅ Kein Port-Forwarding am Router nötig
- ✅ Funktioniert auch hinter einem Mobilfunk-Anschluss (kein öffentliche IP nötig)

---

### Troubleshooting

**Tunnel läuft, aber App nicht erreichbar:**
```bash
pm2 status          # prüfen ob banter "online" ist
pm2 logs banter     # Fehler in der App anzeigen
```

**Cloudflare Tunnel Logs anzeigen:**
```bash
sudo journalctl -u cloudflared -f
```

**NEXTAUTH_SECRET Fehler:**
Sicherstellen dass `.env.local` einen `NEXTAUTH_SECRET` enthält:
```bash
openssl rand -base64 32  # sicheren Wert generieren
```

---

## Tests ausführen

```bash
npm test
```

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) |
| Sprache | TypeScript |
| Styling | Tailwind CSS |
| Datenbank | SQLite (better-sqlite3) |
| Auth | NextAuth.js v4 (JWT) |
| Deployment | pm2 |
