import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, createUser, getUserByUsername } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, username, password } = body;

  if (!name || !username || !password) {
    return NextResponse.json({ error: 'Name, Benutzername und Passwort sind erforderlich.' }, { status: 400 });
  }

  if (name.length > 64 || username.length > 64 || password.length > 128) {
    return NextResponse.json({ error: 'Input zu lang.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Passwort muss mindestens 8 Zeichen lang sein.' }, { status: 400 });
  }

  const db = getDb();
  if (getUserByUsername(db, username)) {
    return NextResponse.json({ error: 'Benutzername bereits vergeben.' }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = createUser(db, { name, username, password: hashed });

  return NextResponse.json(
    { id: user.id, name: user.name, username: user.username, is_admin: Boolean(user.is_admin) },
    { status: 201 }
  );
}
