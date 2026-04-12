import { Quote } from '@/types';

interface Props {
  quote: Quote;
  canEdit: boolean;
  onEdit: (quote: Quote) => void;
  onDelete: (id: number) => void;
}

export default function QuoteCard({ quote, canEdit, onEdit, onDelete }: Props) {
  return (
    <div className="border-l-4 border-amber-400 bg-zinc-900 rounded-r-lg px-5 py-4 flex justify-between items-start gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-white italic leading-relaxed">
          <span aria-hidden="true">&ldquo;</span>
          {quote.text}
          <span aria-hidden="true">&rdquo;</span>
        </p>
        {quote.subtitle && (
          <p className="text-zinc-500 text-sm mt-1">{quote.subtitle}</p>
        )}
      </div>
      {canEdit && (
        <div className="flex gap-2 shrink-0 mt-1">
          <button
            aria-label="edit"
            onClick={() => onEdit(quote)}
            className="text-zinc-500 hover:text-amber-400 transition-colors text-sm"
          >
            ✏️
          </button>
          <button
            aria-label="delete"
            onClick={() => onDelete(quote.id)}
            className="text-zinc-500 hover:text-red-400 transition-colors text-sm"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}
