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
