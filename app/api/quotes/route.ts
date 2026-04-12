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

  if (body.text.length > 2000 || (body.subtitle && body.subtitle.length > 200)) {
    return NextResponse.json({ error: 'Input zu lang.' }, { status: 400 });
  }

  const db = getDb();
  const quote = createQuote(db, {
    text: body.text,
    subtitle: body.subtitle ?? null,
    author_id: session.user.id,
  });
  return NextResponse.json(quote, { status: 201 });
}
