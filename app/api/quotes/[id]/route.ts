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
