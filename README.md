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
