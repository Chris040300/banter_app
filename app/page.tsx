'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QuoteModal from '@/components/QuoteModal';
import { Quote } from '@/types';

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function fetchRandom() {
    setLoading(true);
    const res = await fetch('/api/quotes/random');
    if (res.ok) {
      setQuote(await res.json());
    } else {
      setQuote(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchRandom();
  }, []);

  async function handleSave(data: { text: string; subtitle: string }) {
    await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setShowModal(false);
    fetchRandom();
  }

  function handleAddClick() {
    if (!session) {
      router.push('/login');
    } else {
      setShowModal(true);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      {loading ? (
        <p className="text-zinc-600 text-lg">…</p>
      ) : quote ? (
        <div className="max-w-xl w-full flex flex-col items-center gap-4">
          <span className="text-amber-400/40 text-6xl leading-none select-none">&ldquo;</span>
          <p className="text-white text-xl italic leading-relaxed -mt-6">{quote.text}</p>
          {quote.subtitle && (
            <p className="text-zinc-500 text-sm">{quote.subtitle}</p>
          )}
        </div>
      ) : (
        <p className="text-zinc-600">Noch keine Sprüche. Füge den ersten hinzu!</p>
      )}

      <div className="flex gap-3 mt-10">
        <button
          onClick={fetchRandom}
          className="px-5 py-2 rounded-full border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors text-sm"
        >
          🔀 Neuer Spruch
        </button>
        <button
          onClick={handleAddClick}
          className="px-5 py-2 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition-colors text-sm"
        >
          + Hinzufügen
        </button>
      </div>

      <Link
        href="/quotes"
        className="mt-8 text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
      >
        → Alle Sprüche ansehen
      </Link>

      {showModal && (
        <QuoteModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  );
}
