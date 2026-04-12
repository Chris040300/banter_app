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
