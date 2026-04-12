# Banter — Sprüche-App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-hosted quote collection web app with user auth, CRUD, live search, and a minimalist dark UI deployable via pm2 on Raspberry Pi.

**Architecture:** Next.js 14 App Router with TypeScript. SQLite via `better-sqlite3` (single file, no DB server). NextAuth.js with JWT sessions and a Credentials provider. All in one process — no separate backend.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, better-sqlite3, NextAuth.js v4, bcryptjs, Jest, React Testing Library

---

## File Map

| File | Responsibility |
|---|---|
| `types/index.ts` | Shared TypeScript interfaces |
| `types/next-auth.d.ts` | NextAuth session type extension |
| `lib/db.ts` | SQLite connection + all query functions |
| `lib/auth.ts` | NextAuth config (authOptions) |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth handler |
| `app/api/auth/register/route.ts` | POST /api/auth/register |
| `app/api/quotes/route.ts` | GET /api/quotes, POST /api/quotes |
| `app/api/quotes/random/route.ts` | GET /api/quotes/random |
| `app/api/quotes/[id]/route.ts` | PUT, DELETE /api/quotes/[id] |
| `components/SessionProvider.tsx` | Client-side NextAuth provider wrapper |
| `components/NavBar.tsx` | Navigation bar |
| `components/QuoteCard.tsx` | Single quote card with edit/delete |
| `components/QuoteModal.tsx` | Add/edit modal form |
| `app/layout.tsx` | Root layout with providers + NavBar |
| `app/page.tsx` | Homepage — random quote |
| `app/quotes/page.tsx` | All quotes with live search |
| `app/login/page.tsx` | Login form |
| `app/register/page.tsx` | Registration form |
| `next.config.js` | Webpack externals for better-sqlite3 |
| `ecosystem.config.js` | pm2 config for Pi deployment |
| `__tests__/lib/db.test.ts` | DB query function tests |
| `__tests__/api/quotes.test.ts` | Quote API route tests |
| `__tests__/api/register.test.ts` | Register API route tests |
| `__tests__/components/QuoteCard.test.tsx` | QuoteCard render tests |
| `__tests__/components/QuoteModal.test.tsx` | QuoteModal interaction tests |

---

## Task 1: Project Initialization

**Files:**
- Create: project root (via create-next-app)
- Create: `next.config.js`
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Create: `.env.local`
- Create: `.env.local.example`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd "C:/Users/chris/Claude_Projects"
npx create-next-app@14 banter_app --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
cd banter_app
```

Expected: Next.js 14 project created with TypeScript, Tailwind CSS, App Router.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install better-sqlite3 next-auth@4 bcryptjs
npm install --save-dev @types/better-sqlite3 @types/bcryptjs jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest @types/jest
```

- [ ] **Step 3: Configure next.config.js (webpack externals for better-sqlite3)**

Replace the contents of `next.config.js`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'better-sqlite3'];
    }
    return config;
  },
};

module.exports = nextConfig;
```

- [ ] **Step 4: Create jest.config.ts**

```typescript
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'node',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
};

export default createJestConfig(config);
```

- [ ] **Step 5: Create jest.setup.ts**

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 6: Add test script to package.json**

Open `package.json` and ensure the `scripts` section includes:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 7: Create .env.local**

```bash
cat > .env.local << 'EOF'
NEXTAUTH_SECRET=change-me-to-a-random-32-char-string
NEXTAUTH_URL=http://localhost:3000
DATABASE_PATH=./banter.db
EOF
```

- [ ] **Step 8: Create .env.local.example**

```bash
cat > .env.local.example << 'EOF'
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
DATABASE_PATH=./banter.db
EOF
```

- [ ] **Step 9: Update .gitignore**

Append to `.gitignore`:
```
banter.db
.env.local
.superpowers/
```

- [ ] **Step 10: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts at http://localhost:3000 with no errors. Stop with Ctrl+C.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: initialize Next.js 14 project with dependencies and jest config"
```

---

## Task 2: Shared Types

**Files:**
- Create: `types/index.ts`
- Create: `types/next-auth.d.ts`

- [ ] **Step 1: Create types/index.ts**

```typescript
export interface DbUser {
  id: number;
  name: string;
  email: string;
  password: string;
  is_admin: number; // SQLite boolean: 0 or 1
  created_at: string;
}

export interface Quote {
  id: number;
  text: string;
  subtitle: string | null;
  author_id: number;
  author_name: string;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Create types/next-auth.d.ts**

```typescript
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: number;
      name: string;
      email: string;
      is_admin: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: number;
    is_admin: boolean;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add types/
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Database Layer

**Files:**
- Create: `lib/db.ts`
- Create: `__tests__/lib/db.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/db.test.ts`:

```typescript
import Database from 'better-sqlite3';
import {
  initDb,
  createUser,
  getUserByEmail,
  getUserCount,
  getAllQuotes,
  getRandomQuote,
  createQuote,
  updateQuote,
  deleteQuote,
  getQuoteById,
} from '@/lib/db';

function makeTestDb() {
  const db = new Database(':memory:');
  initDb(db);
  return db;
}

describe('User queries', () => {
  test('createUser inserts a user and returns it', () => {
    const db = makeTestDb();
    const user = createUser(db, { name: 'Alice', email: 'alice@example.com', password: 'hashed' });
    expect(user.id).toBeDefined();
    expect(user.name).toBe('Alice');
    expect(user.email).toBe('alice@example.com');
    expect(user.is_admin).toBe(1); // first user is admin
  });

  test('second user is not admin', () => {
    const db = makeTestDb();
    createUser(db, { name: 'Alice', email: 'alice@example.com', password: 'hashed' });
    const bob = createUser(db, { name: 'Bob', email: 'bob@example.com', password: 'hashed' });
    expect(bob.is_admin).toBe(0);
  });

  test('getUserByEmail returns user or undefined', () => {
    const db = makeTestDb();
    createUser(db, { name: 'Alice', email: 'alice@example.com', password: 'hashed' });
    expect(getUserByEmail(db, 'alice@example.com')).toBeDefined();
    expect(getUserByEmail(db, 'nobody@example.com')).toBeUndefined();
  });
});

describe('Quote queries', () => {
  function seedDb() {
    const db = makeTestDb();
    const user = createUser(db, { name: 'Alice', email: 'alice@example.com', password: 'hashed' });
    return { db, user };
  }

  test('createQuote inserts a quote', () => {
    const { db, user } = seedDb();
    const quote = createQuote(db, { text: 'Hello world', subtitle: 'Test', author_id: user.id });
    expect(quote.id).toBeDefined();
    expect(quote.text).toBe('Hello world');
    expect(quote.subtitle).toBe('Test');
    expect(quote.author_name).toBe('Alice');
  });

  test('getAllQuotes returns all quotes with author_name', () => {
    const { db, user } = seedDb();
    createQuote(db, { text: 'Quote 1', subtitle: null, author_id: user.id });
    createQuote(db, { text: 'Quote 2', subtitle: 'sub', author_id: user.id });
    const quotes = getAllQuotes(db);
    expect(quotes).toHaveLength(2);
    expect(quotes[0].author_name).toBe('Alice');
  });

  test('getRandomQuote returns a quote or undefined when empty', () => {
    const db = makeTestDb();
    expect(getRandomQuote(db)).toBeUndefined();
    const user = createUser(db, { name: 'Alice', email: 'alice@example.com', password: 'hashed' });
    createQuote(db, { text: 'Only one', subtitle: null, author_id: user.id });
    expect(getRandomQuote(db)?.text).toBe('Only one');
  });

  test('updateQuote changes text and subtitle', () => {
    const { db, user } = seedDb();
    const quote = createQuote(db, { text: 'Old', subtitle: null, author_id: user.id });
    const updated = updateQuote(db, quote.id, { text: 'New', subtitle: 'Updated' });
    expect(updated?.text).toBe('New');
    expect(updated?.subtitle).toBe('Updated');
  });

  test('deleteQuote removes the quote', () => {
    const { db, user } = seedDb();
    const quote = createQuote(db, { text: 'To delete', subtitle: null, author_id: user.id });
    deleteQuote(db, quote.id);
    expect(getQuoteById(db, quote.id)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/lib/db.test.ts --no-coverage
```

Expected: FAIL — "Cannot find module '@/lib/db'"

- [ ] **Step 3: Implement lib/db.ts**

```typescript
import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { DbUser, Quote } from '@/types';

// Singleton connection for production use
let _db: DatabaseType | null = null;

export function getDb(): DatabaseType {
  if (!_db) {
    const dbPath = process.env.DATABASE_PATH
      ? path.resolve(process.env.DATABASE_PATH)
      : path.resolve('./banter.db');
    _db = new Database(dbPath);
    initDb(_db);
  }
  return _db;
}

export function initDb(db: DatabaseType): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      password   TEXT NOT NULL,
      is_admin   INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      text       TEXT NOT NULL,
      subtitle   TEXT,
      author_id  INTEGER NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TRIGGER IF NOT EXISTS quotes_updated_at
    AFTER UPDATE ON quotes
    FOR EACH ROW
    BEGIN
      UPDATE quotes SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `);
}

export function getUserCount(db: DatabaseType): number {
  return (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
}

export function createUser(
  db: DatabaseType,
  data: { name: string; email: string; password: string }
): DbUser {
  const isAdmin = getUserCount(db) === 0 ? 1 : 0;
  const result = db
    .prepare('INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)')
    .run(data.name, data.email, data.password, isAdmin);
  return db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(result.lastInsertRowid) as DbUser;
}

export function getUserByEmail(db: DatabaseType, email: string): DbUser | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as DbUser | undefined;
}

const QUOTE_SELECT = `
  SELECT q.*, u.name as author_name
  FROM quotes q
  JOIN users u ON u.id = q.author_id
`;

export function getAllQuotes(db: DatabaseType): Quote[] {
  return db.prepare(`${QUOTE_SELECT} ORDER BY q.created_at DESC`).all() as Quote[];
}

export function getRandomQuote(db: DatabaseType): Quote | undefined {
  return db.prepare(`${QUOTE_SELECT} ORDER BY RANDOM() LIMIT 1`).get() as Quote | undefined;
}

export function getQuoteById(db: DatabaseType, id: number): Quote | undefined {
  return db.prepare(`${QUOTE_SELECT} WHERE q.id = ?`).get(id) as Quote | undefined;
}

export function createQuote(
  db: DatabaseType,
  data: { text: string; subtitle: string | null; author_id: number }
): Quote {
  const result = db
    .prepare('INSERT INTO quotes (text, subtitle, author_id) VALUES (?, ?, ?)')
    .run(data.text, data.subtitle, data.author_id);
  return getQuoteById(db, result.lastInsertRowid as number)!;
}

export function updateQuote(
  db: DatabaseType,
  id: number,
  data: { text: string; subtitle: string | null }
): Quote | undefined {
  db.prepare('UPDATE quotes SET text = ?, subtitle = ? WHERE id = ?').run(
    data.text,
    data.subtitle,
    id
  );
  return getQuoteById(db, id);
}

export function deleteQuote(db: DatabaseType, id: number): void {
  db.prepare('DELETE FROM quotes WHERE id = ?').run(id);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/lib/db.test.ts --no-coverage
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/db.ts __tests__/lib/db.test.ts
git commit -m "feat: add database layer with SQLite queries"
```

---

## Task 4: NextAuth Configuration & Register API

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `app/api/auth/register/route.ts`
- Create: `__tests__/api/register.test.ts`

- [ ] **Step 1: Create lib/auth.ts**

```typescript
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getDb, getUserByEmail } from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const db = getDb();
        const user = getUserByEmail(db, credentials.email);
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          is_admin: Boolean(user.is_admin),
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = Number((user as { id: string }).id);
        token.is_admin = (user as { is_admin: boolean }).is_admin;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.is_admin = token.is_admin;
      return session;
    },
  },
  pages: { signIn: '/login' },
};
```

- [ ] **Step 2: Create app/api/auth/[...nextauth]/route.ts**

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

- [ ] **Step 3: Write failing register tests**

Create `__tests__/api/register.test.ts`:

```typescript
import { POST } from '@/app/api/auth/register/route';
import { NextRequest } from 'next/server';

// Use a fresh in-memory db per test
jest.mock('@/lib/db', () => {
  const Database = require('better-sqlite3');
  const { initDb, createUser, getUserByEmail, getUserCount } = jest.requireActual('@/lib/db');
  const db = new Database(':memory:');
  initDb(db);
  return {
    getDb: () => db,
    createUser,
    getUserByEmail,
    getUserCount,
  };
});

// bcrypt is slow in tests — mock it
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/auth/register', () => {
  test('returns 400 when fields are missing', async () => {
    const res = await POST(makeRequest({ email: 'a@b.com' }));
    expect(res.status).toBe(400);
  });

  test('returns 201 and user data on success', async () => {
    const res = await POST(makeRequest({ name: 'Alice', email: 'alice@test.com', password: 'secret123' }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe('Alice');
    expect(data.password).toBeUndefined(); // never expose password
  });

  test('returns 409 when email is already taken', async () => {
    await POST(makeRequest({ name: 'Alice', email: 'dupe@test.com', password: 'pass' }));
    const res = await POST(makeRequest({ name: 'Alice2', email: 'dupe@test.com', password: 'pass' }));
    expect(res.status).toBe(409);
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
npx jest __tests__/api/register.test.ts --no-coverage
```

Expected: FAIL — "Cannot find module '@/app/api/auth/register/route'"

- [ ] **Step 5: Create app/api/auth/register/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, createUser, getUserByEmail } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
  }

  const db = getDb();
  if (getUserByEmail(db, email)) {
    return NextResponse.json({ error: 'Email already in use.' }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = createUser(db, { name, email, password: hashed });

  return NextResponse.json(
    { id: user.id, name: user.name, email: user.email, is_admin: Boolean(user.is_admin) },
    { status: 201 }
  );
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx jest __tests__/api/register.test.ts --no-coverage
```

Expected: All 3 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/auth.ts app/api/auth/ __tests__/api/register.test.ts
git commit -m "feat: add NextAuth config and register API endpoint"
```

---

## Task 5: Quotes API Routes

**Files:**
- Create: `app/api/quotes/route.ts`
- Create: `app/api/quotes/random/route.ts`
- Create: `app/api/quotes/[id]/route.ts`
- Create: `__tests__/api/quotes.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/api/quotes.test.ts`:

```typescript
import { GET, POST } from '@/app/api/quotes/route';
import { GET as GET_RANDOM } from '@/app/api/quotes/random/route';
import { PUT, DELETE } from '@/app/api/quotes/[id]/route';
import { NextRequest } from 'next/server';

const mockQuotes = [
  { id: 1, text: 'Test quote', subtitle: 'Author', author_id: 1, author_name: 'Alice', created_at: '', updated_at: '' },
];

jest.mock('@/lib/db', () => ({
  getDb: jest.fn(),
  getAllQuotes: jest.fn(() => mockQuotes),
  getRandomQuote: jest.fn(() => mockQuotes[0]),
  createQuote: jest.fn(() => mockQuotes[0]),
  updateQuote: jest.fn(() => ({ ...mockQuotes[0], text: 'Updated' })),
  deleteQuote: jest.fn(),
  getQuoteById: jest.fn(() => mockQuotes[0]),
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { getAllQuotes, getRandomQuote, createQuote, updateQuote, deleteQuote, getQuoteById } from '@/lib/db';

function mockSession(id = 1, is_admin = false) {
  (getServerSession as jest.Mock).mockResolvedValue({ user: { id, is_admin } });
}
function noSession() {
  (getServerSession as jest.Mock).mockResolvedValue(null);
}

describe('GET /api/quotes', () => {
  test('returns all quotes', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockQuotes);
  });
});

describe('GET /api/quotes/random', () => {
  test('returns a random quote', async () => {
    const res = await GET_RANDOM();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.text).toBe('Test quote');
  });

  test('returns 404 when no quotes exist', async () => {
    (getRandomQuote as jest.Mock).mockReturnValueOnce(undefined);
    const res = await GET_RANDOM();
    expect(res.status).toBe(404);
  });
});

describe('POST /api/quotes', () => {
  test('returns 401 when not logged in', async () => {
    noSession();
    const req = new NextRequest('http://localhost/api/quotes', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello', subtitle: null }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  test('creates a quote when authenticated', async () => {
    mockSession(1);
    const req = new NextRequest('http://localhost/api/quotes', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello', subtitle: 'World' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  test('returns 400 when text is missing', async () => {
    mockSession(1);
    const req = new NextRequest('http://localhost/api/quotes', {
      method: 'POST',
      body: JSON.stringify({ subtitle: 'no text' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/quotes/[id]', () => {
  test('returns 401 when not logged in', async () => {
    noSession();
    const req = new NextRequest('http://localhost/api/quotes/1', {
      method: 'PUT',
      body: JSON.stringify({ text: 'Updated', subtitle: null }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PUT(req, { params: { id: '1' } });
    expect(res.status).toBe(401);
  });

  test('returns 403 when editing another user\'s quote', async () => {
    mockSession(2); // user 2, quote belongs to user 1
    const req = new NextRequest('http://localhost/api/quotes/1', {
      method: 'PUT',
      body: JSON.stringify({ text: 'Updated', subtitle: null }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PUT(req, { params: { id: '1' } });
    expect(res.status).toBe(403);
  });

  test('allows owner to edit', async () => {
    mockSession(1); // user 1 owns quote 1
    const req = new NextRequest('http://localhost/api/quotes/1', {
      method: 'PUT',
      body: JSON.stringify({ text: 'Updated', subtitle: null }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PUT(req, { params: { id: '1' } });
    expect(res.status).toBe(200);
  });

  test('allows admin to edit any quote', async () => {
    mockSession(99, true); // admin, different user
    const req = new NextRequest('http://localhost/api/quotes/1', {
      method: 'PUT',
      body: JSON.stringify({ text: 'Admin edit', subtitle: null }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PUT(req, { params: { id: '1' } });
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/quotes/[id]', () => {
  test('returns 403 when deleting another user\'s quote', async () => {
    mockSession(2);
    const req = new NextRequest('http://localhost/api/quotes/1', { method: 'DELETE' });
    const res = await DELETE(req, { params: { id: '1' } });
    expect(res.status).toBe(403);
  });

  test('allows owner to delete', async () => {
    mockSession(1);
    const req = new NextRequest('http://localhost/api/quotes/1', { method: 'DELETE' });
    const res = await DELETE(req, { params: { id: '1' } });
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/api/quotes.test.ts --no-coverage
```

Expected: FAIL — missing route modules.

- [ ] **Step 3: Create app/api/quotes/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb, getAllQuotes, createQuote } from '@/lib/db';

export async function GET() {
  const db = getDb();
  return NextResponse.json(getAllQuotes(db));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (!body.text) return NextResponse.json({ error: 'Text is required.' }, { status: 400 });

  const db = getDb();
  const quote = createQuote(db, {
    text: body.text,
    subtitle: body.subtitle ?? null,
    author_id: session.user.id,
  });
  return NextResponse.json(quote, { status: 201 });
}
```

- [ ] **Step 4: Create app/api/quotes/random/route.ts**

```typescript
import { NextResponse } from 'next/server';
import { getDb, getRandomQuote } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const quote = getRandomQuote(db);
  if (!quote) return NextResponse.json({ error: 'No quotes found.' }, { status: 404 });
  return NextResponse.json(quote);
}
```

- [ ] **Step 5: Create app/api/quotes/[id]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb, getQuoteById, updateQuote, deleteQuote } from '@/lib/db';

type Params = { params: { id: string } };

async function authorize(id: number) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: 'Unauthorized', status: 401 };
  const db = getDb();
  const quote = getQuoteById(db, id);
  if (!quote) return { error: 'Not found', status: 404 };
  if (quote.author_id !== session.user.id && !session.user.is_admin) {
    return { error: 'Forbidden', status: 403 };
  }
  return { session, db, quote };
}

export async function PUT(req: NextRequest, { params }: Params) {
  const id = Number(params.id);
  const auth = await authorize(id);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  if (!body.text) return NextResponse.json({ error: 'Text is required.' }, { status: 400 });

  const updated = updateQuote(auth.db, id, { text: body.text, subtitle: body.subtitle ?? null });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const id = Number(params.id);
  const auth = await authorize(id);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  deleteQuote(auth.db, id);
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx jest __tests__/api/quotes.test.ts --no-coverage
```

Expected: All 10 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add app/api/quotes/ __tests__/api/quotes.test.ts
git commit -m "feat: add quotes API routes with auth and permission checks"
```

---

## Task 6: NavBar Component

**Files:**
- Create: `components/NavBar.tsx`
- Create: `components/SessionProvider.tsx`

- [ ] **Step 1: Create components/SessionProvider.tsx**

This wraps the NextAuth provider (must be a Client Component):

```typescript
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

- [ ] **Step 2: Create components/NavBar.tsx**

```typescript
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function NavBar() {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
      <Link href="/" className="font-bold text-white text-lg tracking-tight">
        Banter
      </Link>
      <div className="flex items-center gap-6 text-sm text-zinc-400">
        <Link href="/quotes" className="hover:text-white transition-colors">
          Alle Sprüche
        </Link>
        {session ? (
          <div className="flex items-center gap-4">
            <span className="text-zinc-500">{session.user.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link href="/login" className="hover:text-white transition-colors">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/NavBar.tsx components/SessionProvider.tsx
git commit -m "feat: add NavBar and SessionProvider components"
```

---

## Task 7: QuoteCard Component

**Files:**
- Create: `components/QuoteCard.tsx`
- Create: `__tests__/components/QuoteCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/QuoteCard.test.tsx`:

```typescript
/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import QuoteCard from '@/components/QuoteCard';
import { Quote } from '@/types';

const quote: Quote = {
  id: 1,
  text: 'Das Leben ist schön.',
  subtitle: 'Max, 2024',
  author_id: 1,
  author_name: 'Alice',
  created_at: '',
  updated_at: '',
};

describe('QuoteCard', () => {
  test('renders quote text and subtitle', () => {
    render(<QuoteCard quote={quote} canEdit={false} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('Das Leben ist schön.')).toBeInTheDocument();
    expect(screen.getByText('Max, 2024')).toBeInTheDocument();
  });

  test('does not show edit/delete when canEdit is false', () => {
    render(<QuoteCard quote={quote} canEdit={false} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  test('shows edit and delete buttons when canEdit is true', () => {
    render(<QuoteCard quote={quote} canEdit={true} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  test('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<QuoteCard quote={quote} canEdit={true} onEdit={onEdit} onDelete={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(quote);
  });

  test('calls onDelete when delete button is clicked', () => {
    const onDelete = jest.fn();
    render(<QuoteCard quote={quote} canEdit={true} onEdit={() => {}} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith(quote.id);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/components/QuoteCard.test.tsx --no-coverage
```

Expected: FAIL — "Cannot find module '@/components/QuoteCard'"

- [ ] **Step 3: Create components/QuoteCard.tsx**

```typescript
import { Quote } from '@/types';

interface Props {
  quote: Quote;
  canEdit: boolean;
  onEdit: (quote: Quote) => void;
  onDelete: (id: number) => void;
}

export default function QuoteCard({ quote, canEdit, onEdit, onDelete }: Props) {
  return (
    <div className="border-l-4 border-amber-400 bg-zinc-900 rounded-r-lg px-5 py-4 flex justify-between items-start gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-white italic leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
        {quote.subtitle && (
          <p className="text-zinc-500 text-sm mt-1">{quote.subtitle}</p>
        )}
      </div>
      {canEdit && (
        <div className="flex gap-2 shrink-0 mt-1">
          <button
            aria-label="edit"
            onClick={() => onEdit(quote)}
            className="text-zinc-500 hover:text-amber-400 transition-colors text-sm"
          >
            ✏️
          </button>
          <button
            aria-label="delete"
            onClick={() => onDelete(quote.id)}
            className="text-zinc-500 hover:text-red-400 transition-colors text-sm"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/components/QuoteCard.test.tsx --no-coverage
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/QuoteCard.tsx __tests__/components/QuoteCard.test.tsx
git commit -m "feat: add QuoteCard component with edit/delete actions"
```

---

## Task 8: QuoteModal Component

**Files:**
- Create: `components/QuoteModal.tsx`
- Create: `__tests__/components/QuoteModal.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/QuoteModal.test.tsx`:

```typescript
/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuoteModal from '@/components/QuoteModal';
import { Quote } from '@/types';

const existingQuote: Quote = {
  id: 1,
  text: 'Existing quote',
  subtitle: 'Some context',
  author_id: 1,
  author_name: 'Alice',
  created_at: '',
  updated_at: '',
};

describe('QuoteModal', () => {
  test('renders empty form when no quote is passed (new)', () => {
    render(<QuoteModal onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByPlaceholderText(/spruch/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/beschreibung/i)).toHaveValue('');
  });

  test('pre-fills form when editing an existing quote', () => {
    render(<QuoteModal quote={existingQuote} onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByPlaceholderText(/spruch/i)).toHaveValue('Existing quote');
    expect(screen.getByPlaceholderText(/beschreibung/i)).toHaveValue('Some context');
  });

  test('calls onClose when cancel button is clicked', () => {
    const onClose = jest.fn();
    render(<QuoteModal onClose={onClose} onSave={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /abbrechen/i }));
    expect(onClose).toHaveBeenCalled();
  });

  test('calls onSave with form data on submit', async () => {
    const onSave = jest.fn();
    render(<QuoteModal onClose={() => {}} onSave={onSave} />);
    await userEvent.type(screen.getByPlaceholderText(/spruch/i), 'New quote text');
    await userEvent.type(screen.getByPlaceholderText(/beschreibung/i), 'Context here');
    fireEvent.click(screen.getByRole('button', { name: /speichern/i }));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ text: 'New quote text', subtitle: 'Context here' });
    });
  });

  test('does not submit when text is empty', async () => {
    const onSave = jest.fn();
    render(<QuoteModal onClose={() => {}} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: /speichern/i }));
    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/components/QuoteModal.test.tsx --no-coverage
```

Expected: FAIL — "Cannot find module '@/components/QuoteModal'"

- [ ] **Step 3: Create components/QuoteModal.tsx**

```typescript
'use client';

import { useState } from 'react';
import { Quote } from '@/types';

interface Props {
  quote?: Quote;
  onClose: () => void;
  onSave: (data: { text: string; subtitle: string }) => void;
}

export default function QuoteModal({ quote, onClose, onSave }: Props) {
  const [text, setText] = useState(quote?.text ?? '');
  const [subtitle, setSubtitle] = useState(quote?.subtitle ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onSave({ text: text.trim(), subtitle: subtitle.trim() });
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl">
        <h2 className="text-white font-semibold text-lg">
          {quote ? 'Spruch bearbeiten' : 'Neuer Spruch'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            placeholder="Spruch..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="bg-zinc-800 text-white placeholder-zinc-500 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            type="text"
            placeholder="Beschreibung / Quelle (optional)"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="bg-zinc-800 text-white placeholder-zinc-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-400 text-black font-semibold hover:bg-amber-300 transition-colors"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/components/QuoteModal.test.tsx --no-coverage
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Run all tests to verify nothing is broken**

```bash
npx jest --no-coverage
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add components/QuoteModal.tsx __tests__/components/QuoteModal.test.tsx
git commit -m "feat: add QuoteModal component for creating and editing quotes"
```

---

## Task 9: Root Layout

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Update app/globals.css**

Replace content with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  color-scheme: dark;
}
```

- [ ] **Step 2: Update app/layout.tsx**

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';
import NavBar from '@/components/NavBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Banter',
  description: 'Unsere Sprüche Sammlung',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="bg-black text-white">
      <body className={inter.className}>
        <SessionProvider>
          <div className="min-h-screen flex flex-col">
            <NavBar />
            <main className="flex-1">{children}</main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: configure root layout with dark theme, NavBar, and SessionProvider"
```

---

## Task 10: Login & Register Pages

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/register/page.tsx`

- [ ] **Step 1: Create app/login/page.tsx**

```typescript
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      setError('E-Mail oder Passwort falsch.');
    } else {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-8 text-center">Anmelden</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-zinc-900 text-white placeholder-zinc-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-zinc-900 text-white placeholder-zinc-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="bg-amber-400 text-black font-semibold py-3 rounded-lg hover:bg-amber-300 transition-colors"
          >
            Einloggen
          </button>
        </form>
        <p className="text-zinc-500 text-sm text-center mt-6">
          Noch kein Konto?{' '}
          <Link href="/register" className="text-amber-400 hover:underline">
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create app/register/page.tsx**

```typescript
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwörter stimmen nicht überein.');
      return;
    }
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Registrierung fehlgeschlagen.');
      return;
    }
    await signIn('credentials', { email, password, redirect: false });
    router.push('/');
    router.refresh();
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-8 text-center">Registrieren</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="bg-zinc-900 text-white placeholder-zinc-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-zinc-900 text-white placeholder-zinc-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-zinc-900 text-white placeholder-zinc-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            type="password"
            placeholder="Passwort bestätigen"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="bg-zinc-900 text-white placeholder-zinc-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="bg-amber-400 text-black font-semibold py-3 rounded-lg hover:bg-amber-300 transition-colors"
          >
            Konto erstellen
          </button>
        </form>
        <p className="text-zinc-500 text-sm text-center mt-6">
          Bereits registriert?{' '}
          <Link href="/login" className="text-amber-400 hover:underline">
            Einloggen
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/login/ app/register/
git commit -m "feat: add login and register pages"
```

---

## Task 11: Homepage

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace app/page.tsx**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QuoteModal from '@/components/QuoteModal';
import { Quote } from '@/types';

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function fetchRandom() {
    setLoading(true);
    const res = await fetch('/api/quotes/random');
    if (res.ok) {
      setQuote(await res.json());
    } else {
      setQuote(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchRandom();
  }, []);

  async function handleSave(data: { text: string; subtitle: string }) {
    await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setShowModal(false);
    fetchRandom();
  }

  function handleAddClick() {
    if (!session) {
      router.push('/login');
    } else {
      setShowModal(true);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      {loading ? (
        <p className="text-zinc-600 text-lg">…</p>
      ) : quote ? (
        <div className="max-w-xl w-full flex flex-col items-center gap-4">
          <span className="text-amber-400/40 text-6xl leading-none select-none">&ldquo;</span>
          <p className="text-white text-xl italic leading-relaxed -mt-6">{quote.text}</p>
          {quote.subtitle && (
            <p className="text-zinc-500 text-sm">{quote.subtitle}</p>
          )}
        </div>
      ) : (
        <p className="text-zinc-600">Noch keine Sprüche. Füge den ersten hinzu!</p>
      )}

      <div className="flex gap-3 mt-10">
        <button
          onClick={fetchRandom}
          className="px-5 py-2 rounded-full border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors text-sm"
        >
          🔀 Neuer Spruch
        </button>
        <button
          onClick={handleAddClick}
          className="px-5 py-2 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition-colors text-sm"
        >
          + Hinzufügen
        </button>
      </div>

      <Link
        href="/quotes"
        className="mt-8 text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
      >
        → Alle Sprüche ansehen
      </Link>

      {showModal && (
        <QuoteModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify homepage in browser**

```bash
npm run dev
```

Open http://localhost:3000. You should see the dark homepage with "🔀 Neuer Spruch" and "+ Hinzufügen" buttons. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add homepage with random quote and add-quote modal"
```

---

## Task 12: All Quotes Page with Search

**Files:**
- Create: `app/quotes/page.tsx`

- [ ] **Step 1: Create app/quotes/page.tsx**

```typescript
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import QuoteCard from '@/components/QuoteCard';
import QuoteModal from '@/components/QuoteModal';
import { Quote } from '@/types';

export default function QuotesPage() {
  const { data: session } = useSession();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState('');
  const [editQuote, setEditQuote] = useState<Quote | null>(null);
  const [showModal, setShowModal] = useState(false);

  async function loadQuotes() {
    const res = await fetch('/api/quotes');
    if (res.ok) setQuotes(await res.json());
  }

  useEffect(() => {
    loadQuotes();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return quotes;
    return quotes.filter(
      (quote) =>
        quote.text.toLowerCase().includes(q) ||
        (quote.subtitle ?? '').toLowerCase().includes(q)
    );
  }, [quotes, search]);

  function canEdit(quote: Quote) {
    if (!session) return false;
    return quote.author_id === session.user.id || session.user.is_admin;
  }

  async function handleSave(data: { text: string; subtitle: string }) {
    if (editQuote) {
      await fetch(`/api/quotes/${editQuote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
    setShowModal(false);
    setEditQuote(null);
    loadQuotes();
  }

  async function handleDelete(id: number) {
    if (!confirm('Spruch wirklich löschen?')) return;
    await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
    loadQuotes();
  }

  function handleEdit(quote: Quote) {
    setEditQuote(quote);
    setShowModal(true);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">
          Alle Sprüche{' '}
          <span className="text-zinc-600 font-normal text-base">({filtered.length})</span>
        </h1>
        {session && (
          <button
            onClick={() => { setEditQuote(null); setShowModal(true); }}
            className="px-4 py-2 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition-colors text-sm"
          >
            + Neu
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Suchen..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-zinc-900 text-white placeholder-zinc-500 rounded-lg px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-amber-400"
      />

      {filtered.length === 0 ? (
        <p className="text-zinc-600 text-center py-12">
          {search ? 'Keine Sprüche gefunden.' : 'Noch keine Sprüche vorhanden.'}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              canEdit={canEdit(quote)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <QuoteModal
          quote={editQuote ?? undefined}
          onClose={() => { setShowModal(false); setEditQuote(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Open http://localhost:3000/quotes. Register an account, add quotes, verify search filters in real-time. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add app/quotes/
git commit -m "feat: add all-quotes page with live search and edit/delete"
```

---

## Task 13: Final Test Run & Deployment Setup

**Files:**
- Create: `ecosystem.config.js`

- [ ] **Step 1: Run full test suite**

```bash
npx jest --no-coverage
```

Expected: All tests PASS. Fix any failures before continuing.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: Build completes with no errors. Fix any TypeScript errors reported.

- [ ] **Step 3: Create ecosystem.config.js for pm2**

```javascript
module.exports = {
  apps: [
    {
      name: 'banter',
      script: 'node_modules/.bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
```

- [ ] **Step 4: Commit**

```bash
git add ecosystem.config.js
git commit -m "chore: add pm2 ecosystem config for Raspberry Pi deployment"
```

- [ ] **Step 5: Deployment instructions (run on Raspberry Pi)**

Copy project to Pi and run:
```bash
# Install Node.js 20+ on Pi if not present
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# In project directory:
npm install
npm run build

# Set up environment
cp .env.local.example .env.local
# Edit .env.local: set NEXTAUTH_SECRET (use: openssl rand -base64 32)
# Edit .env.local: set NEXTAUTH_URL=http://<pi-ip>:3000

# Start with pm2
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # follow the printed command to enable autostart
```

---
