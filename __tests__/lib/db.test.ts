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
