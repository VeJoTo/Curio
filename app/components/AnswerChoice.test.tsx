import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AnswerChoice } from './AnswerChoice';

afterEach(cleanup);

describe('AnswerChoice accessibility', () => {
  it('announces correctness of the picked answer in its accessible name', () => {
    render(<AnswerChoice label="Mars" state="correct" disabled onPress={() => {}} />);
    expect(screen.getByRole('button', { name: 'Mars, correct' })).toBeTruthy();
  });

  it('announces a wrong pick and the unpicked correct answer', () => {
    const { rerender } = render(
      <AnswerChoice label="Venus" state="wrong" disabled onPress={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Venus, incorrect' })).toBeTruthy();

    rerender(<AnswerChoice label="Mars" state="mutedCorrect" disabled onPress={() => {}} />);
    expect(screen.getByRole('button', { name: 'Mars, correct answer' })).toBeTruthy();
  });

  it('reports the disabled state once answered', () => {
    render(<AnswerChoice label="Mars" state="correct" disabled onPress={() => {}} />);
    const button = screen.getByRole('button', { name: 'Mars, correct' });
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  it('an unanswered choice has a plain label and is not disabled', () => {
    render(<AnswerChoice label="Mars" state="idle" onPress={() => {}} />);
    const button = screen.getByRole('button', { name: 'Mars' });
    expect(button.getAttribute('aria-disabled')).not.toBe('true');
  });
});
