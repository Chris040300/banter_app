'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function NavBar() {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
      <Link href="/" className="font-bold text-white text-lg tracking-tight">
        Best of Dudettentalk
      </Link>
      <div className="flex items-center gap-6 text-sm text-zinc-400">
        <Link href="/quotes" className="hover:text-white transition-colors">
          Alle Sprüche
        </Link>
        {session ? (
          <div className="flex items-center gap-4">
            <span className="text-zinc-500">{session.user.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link href="/login" className="hover:text-white transition-colors">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
