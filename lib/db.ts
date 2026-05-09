import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { DbUser, Quote } from '@/types';

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
      username   TEXT NOT NULL UNIQUE,
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
  data: { name: string; username: string; password: string }
): DbUser {
  const isAdmin = getUserCount(db) === 0 ? 1 : 0;
  const result = db
    .prepare('INSERT INTO users (name, username, password, is_admin) VALUES (?, ?, ?, ?)')
    .run(data.name, data.username, data.password, isAdmin);
  return db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(result.lastInsertRowid) as DbUser;
}

export function getUserByUsername(db: DatabaseType, username: string): DbUser | undefined {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as DbUser | undefined;
}

const QUOTE_SELECT = `
  SELECT q.*, u.name as author_name
  FROM quotes q
  JOIN users u ON
cat > lib/auth.ts << 'EOF'
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getDb, getUserByUsername } from '@/lib/db';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required.');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Benutzername', type: 'text' },
        password: { label: 'Passwort', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const db = getDb();
        const user = getUserByUsername(db, credentials.username);
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return {
          id: String(user.id),
          name: user.name,
          username: user.username,
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
        token.is_admin = (user as unknown as { is_admin: boolean }).is_admin;
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
