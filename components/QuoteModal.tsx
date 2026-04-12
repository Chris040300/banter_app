'use client';

import { useState } from 'react';
import { Quote } from '@/types';

interface Props {
  quote?: Quote;
  onClose: () => void;
  onSave: (data: { text: string; subtitle: string }) => void;
}

export default function QuoteModal({ quote, onClose, onSave }: Props) {
  const [text, setText] = useState(quote?.text ?? '');
  const [subtitle, setSubtitle] = useState(quote?.subtitle ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onSave({ text: text.trim(), subtitle: subtitle.trim() });
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl">
        <h2 className="text-white font-semibold text-lg">
          {quote ? 'Spruch bearbeiten' : 'Neuer Spruch'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            placeholder="Spruch..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="bg-zinc-800 text-white placeholder-zinc-500 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            type="text"
            placeholder="Beschreibung / Quelle (optional)"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="bg-zinc-800 text-white placeholder-zinc-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-400 text-black font-semibold hover:bg-amber-300 transition-colors"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
