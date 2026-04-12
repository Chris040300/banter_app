# Banter — Sprüche-App Design Spec

**Datum:** 2026-04-12

## Überblick

Eine selbst gehostete Web-App zum Sammeln, Anzeigen und Verwalten von Sprüchen (Quotes). Betrieben auf einem Raspberry Pi, zugänglich für eine kleine Gruppe von Freunden mit individuellen Benutzerkonten.

---

## Stack

| Komponente | Technologie |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Datenbank | SQLite via `better-sqlite3` |
| Auth | NextAuth.js (Credentials Provider) |
| Passwort-Hashing | `bcryptjs` |
| Prozess-Manager | `pm2` (Raspberry Pi Deployment) |

---

## Architektur

Alles läuft als ein einziger Next.js-Prozess. Kein separater Datenbankserver nötig — SQLite speichert alles in einer einzigen Datei (`banter.db`) auf dem Pi.

```
banter_app/
├── app/
│   ├── page.tsx                  ← Homepage (Random Spruch)
│   ├── quotes/
│   │   └── page.tsx              ← Alle Sprüche
│   ├── login/
│   │   └── page.tsx              ← Login-Seite
│   ├── register/
│   │   └── page.tsx              ← Registrierung
│   └── api/
│       ├── auth/[...nextauth]/   ← NextAuth Handler
│       └── quotes/
│           ├── route.ts          ← GET (alle), POST (neu)
│           ├── random/
│           │   └── route.ts      ← GET (zufälliger Spruch)
│           └── [id]/
│               └── route.ts      ← PUT (bearbeiten), DELETE
├── components/
│   ├── QuoteCard.tsx             ← Wiederverwendbare Spruch-Karte
│   ├── QuoteModal.tsx            ← Modal: Spruch hinzufügen/bearbeiten
│   └── NavBar.tsx                ← Navigation
├── lib/
│   └── db.ts                     ← SQLite-Verbindung & Queries
└── banter.db                     ← SQLite-Datenbankdatei (gitignored)
```

---

## Datenmodell

### User
```sql
CREATE TABLE users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,  -- bcrypt hash
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Quote
```sql
CREATE TABLE quotes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  text       TEXT NOT NULL,
  subtitle   TEXT,           -- z. B. "Max beim Frühstück, 2024"
  author_id  INTEGER NOT NULL REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trigger: updated_at bei jedem UPDATE automatisch setzen
CREATE TRIGGER quotes_updated_at
AFTER UPDATE ON quotes
FOR EACH ROW
BEGIN
  UPDATE quotes SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

---

## Seiten

### Homepage (`/`)

- **Design:** Dunkel, minimalistisch — der Spruch steht im Mittelpunkt
- **Inhalte:**
  - Zentrierter Random-Spruch (Text + Subtitle)
  - Button "🔀 Neuer Spruch" — lädt neuen Spruch per API ohne Seitenneuladung
  - Button "+ Hinzufügen" — öffnet Modal (nur wenn eingeloggt; sonst Redirect zu `/login`)
  - Link "→ Alle Sprüche" unten
- **Auth:** Lesen ohne Login möglich

### Alle Sprüche (`/quotes`)

- **Design:** Scrollbare Karten-Liste, dunkles Theme
- **Suche:** Suchfeld oben auf der Seite — filtert live (client-seitig) nach Spruchtext und Subtitle
- **Karten-Format:** Farbiger linker Rand, Spruchtext (kursiv) + Subtitle darunter
- **Pro Karte (wenn eingeloggt):**
  - Edit-Icon (✏️): sichtbar für eigene Sprüche + Admins
  - Delete-Icon (🗑️): sichtbar für eigene Sprüche + Admins
- **Auth:** Lesen ohne Login möglich

### Login (`/login`)

- E-Mail + Passwort Formular
- Link zur Registrierung

### Registrierung (`/register`)

- Name, E-Mail, Passwort (+ Bestätigung)
- Offen — jeder Freund kann sich selbst registrieren
- Nach Registrierung: automatisch eingeloggt, Redirect zu `/`

---

## Komponenten

### `QuoteCard`
Props: `quote: { id, text, subtitle, author }`, `canEdit: boolean`
Zeigt Spruch + Subtitle. Bei `canEdit=true` werden Edit/Delete-Icons eingeblendet.

### `QuoteModal`
Props: `quote?: Quote` (leer = neu, befüllt = bearbeiten), `onClose`, `onSave`
Formular mit zwei Feldern: Spruchtext (Textarea) + Subtitle (Input).
Speichert per `POST /api/quotes` oder `PUT /api/quotes/[id]`.

### `NavBar`
Links: "Banter" (Logo/Home), "Alle Sprüche", Login/Logout + Username

---

## API Routes

| Method | Route | Auth | Beschreibung |
|---|---|---|---|
| `GET` | `/api/quotes` | — | Alle Sprüche |
| `GET` | `/api/quotes/random` | — | Zufälliger Spruch |
| `POST` | `/api/quotes` | ✅ | Neuen Spruch erstellen |
| `PUT` | `/api/quotes/[id]` | ✅ | Spruch bearbeiten (eigener oder Admin) |
| `DELETE` | `/api/quotes/[id]` | ✅ | Spruch löschen (eigener oder Admin) |
| `POST` | `/api/auth/register` | — | Neuen User registrieren |

---

## Auth & Berechtigungen

- **Lesen:** Kein Login erforderlich (öffentlich)
- **Hinzufügen:** Eingeloggte User
- **Bearbeiten/Löschen:** Nur der Ersteller des Spruchs
- **Admin:** Erster registrierter User wird Admin (kann alle Sprüche bearbeiten/löschen)
- Sessions via NextAuth.js JWT-Strategie

---

## Deployment (Raspberry Pi)

```bash
# Build
npm run build

# Start mit pm2
pm2 start npm --name banter -- start
pm2 save
pm2 startup  # Autostart bei Neustart
```

- Port: `3000` (optional via Nginx Reverse Proxy auf Port 80 weitergeleitet)
- `banter.db` liegt im Projektroot, wird von Git ignoriert
- `.env.local` mit `NEXTAUTH_SECRET` und `NEXTAUTH_URL`

---

## Nicht im Scope (bewusst weggelassen)

- Tags / Kategorien (kann später ergänzt werden)
- Like/Reaction-System
- E-Mail-Verifizierung bei Registrierung
