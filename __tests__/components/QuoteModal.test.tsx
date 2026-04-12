/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuoteModal from '@/components/QuoteModal';
import { Quote } from '@/types';

const existingQuote: Quote = {
  id: 1,
  text: 'Existing quote',
  subtitle: 'Some context',
  author_id: 1,
  author_name: 'Alice',
  created_at: '',
  updated_at: '',
};

describe('QuoteModal', () => {
  test('renders empty form when no quote is passed (new)', () => {
    render(<QuoteModal onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByPlaceholderText(/spruch/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/beschreibung/i)).toHaveValue('');
  });

  test('pre-fills form when editing an existing quote', () => {
    render(<QuoteModal quote={existingQuote} onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByPlaceholderText(/spruch/i)).toHaveValue('Existing quote');
    expect(screen.getByPlaceholderText(/beschreibung/i)).toHaveValue('Some context');
  });

  test('calls onClose when cancel button is clicked', () => {
    const onClose = jest.fn();
    render(<QuoteModal onClose={onClose} onSave={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /abbrechen/i }));
    expect(onClose).toHaveBeenCalled();
  });

  test('calls onSave with form data on submit', async () => {
    const onSave = jest.fn();
    render(<QuoteModal onClose={() => {}} onSave={onSave} />);
    await userEvent.type(screen.getByPlaceholderText(/spruch/i), 'New quote text');
    await userEvent.type(screen.getByPlaceholderText(/beschreibung/i), 'Context here');
    fireEvent.click(screen.getByRole('button', { name: /speichern/i }));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ text: 'New quote text', subtitle: 'Context here' });
    });
  });

  test('does not submit when text is empty', async () => {
    const onSave = jest.fn();
    render(<QuoteModal onClose={() => {}} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: /speichern/i }));
    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
    });
  });
});
