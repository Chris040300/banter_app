import { NextResponse } from 'next/server';
import { getDb, getRandomQuote } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const quote = getRandomQuote(db);
  if (!quote) return NextResponse.json({ error: 'No quotes found.' }, { status: 404 });
  return NextResponse.json(quote);
}
