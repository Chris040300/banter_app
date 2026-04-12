import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, createUser, getUserByEmail } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
  }

  if (name.length > 64 || email.length > 254 || password.length > 128) {
    return NextResponse.json({ error: 'Input zu lang.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Passwort muss mindestens 8 Zeichen lang sein.' }, { status: 400 });
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
