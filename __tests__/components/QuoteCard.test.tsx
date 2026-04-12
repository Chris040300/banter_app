/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import QuoteCard from '@/components/QuoteCard';
import { Quote } from '@/types';

const quote: Quote = {
  id: 1,
  text: 'Das Leben ist schön.',
  subtitle: 'Max, 2024',
  author_id: 1,
  author_name: 'Alice',
  created_at: '',
  updated_at: '',
};

describe('QuoteCard', () => {
  test('renders quote text and subtitle', () => {
    render(<QuoteCard quote={quote} canEdit={false} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('Das Leben ist schön.')).toBeInTheDocument();
    expect(screen.getByText('Max, 2024')).toBeInTheDocument();
  });

  test('does not show edit/delete when canEdit is false', () => {
    render(<QuoteCard quote={quote} canEdit={false} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  test('shows edit and delete buttons when canEdit is true', () => {
    render(<QuoteCard quote={quote} canEdit={true} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  test('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<QuoteCard quote={quote} canEdit={true} onEdit={onEdit} onDelete={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(quote);
  });

  test('calls onDelete when delete button is clicked', () => {
    const onDelete = jest.fn();
    render(<QuoteCard quote={quote} canEdit={true} onEdit={() => {}} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith(quote.id);
  });
});
