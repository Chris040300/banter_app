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
