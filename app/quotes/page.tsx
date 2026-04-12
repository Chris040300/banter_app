'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import QuoteCard from '@/components/QuoteCard';
import QuoteModal from '@/components/QuoteModal';
import { Quote } from '@/types';

export default function QuotesPage() {
  const { data: session } = useSession();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState('');
  const [editQuote, setEditQuote] = useState<Quote | null>(null);
  const [showModal, setShowModal] = useState(false);

  async function loadQuotes() {
    const res = await fetch('/api/quotes');
    if (res.ok) setQuotes(await res.json());
  }

  useEffect(() => {
    loadQuotes();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return quotes;
    return quotes.filter(
      (quote) =>
        quote.text.toLowerCase().includes(q) ||
        (quote.subtitle ?? '').toLowerCase().includes(q)
    );
  }, [quotes, search]);

  function canEdit(quote: Quote) {
    if (!session) return false;
    return quote.author_id === session.user.id || session.user.is_admin;
  }

  async function handleSave(data: { text: string; subtitle: string }) {
    if (editQuote) {
      await fetch(`/api/quotes/${editQuote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
    setShowModal(false);
    setEditQuote(null);
    loadQuotes();
  }

  async function handleDelete(id: number) {
    if (!confirm('Spruch wirklich löschen?')) return;
    await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
    loadQuotes();
  }

  function handleEdit(quote: Quote) {
    setEditQuote(quote);
    setShowModal(true);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">
          Alle Sprüche{' '}
          <span className="text-zinc-600 font-normal text-base">({filtered.length})</span>
        </h1>
        {session && (
          <button
            onClick={() => { setEditQuote(null); setShowModal(true); }}
            className="px-4 py-2 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition-colors text-sm"
          >
            + Neu
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Suchen..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-zinc-900 text-white placeholder-zinc-500 rounded-lg px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-amber-400"
      />

      {filtered.length === 0 ? (
        <p className="text-zinc-600 text-center py-12">
          {search ? 'Keine Sprüche gefunden.' : 'Noch keine Sprüche vorhanden.'}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              canEdit={canEdit(quote)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <QuoteModal
          quote={editQuote ?? undefined}
          onClose={() => { setShowModal(false); setEditQuote(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
