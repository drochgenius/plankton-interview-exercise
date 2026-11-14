import { render, screen } from '@testing-library/react';
import { QuizProgress } from './QuizProgress';

const states = () => screen.getAllByTestId('segment').map((s) => s.getAttribute('data-state'));

describe('QuizProgress', () => {
  it('intro: nothing done, nothing current', () => {
    render(<QuizProgress total={5} completed={0} current={null} />);
    expect(states()).toEqual(['remaining', 'remaining', 'remaining', 'remaining', 'remaining']);
    expect(screen.getByText('5 questions · 0 done · 5 left')).toBeInTheDocument();
  });

  it('middle question', () => {
    render(<QuizProgress total={5} completed={1} current={1} />);
    expect(states()).toEqual(['completed', 'current', 'remaining', 'remaining', 'remaining']);
    expect(screen.getByText('Question 2 of 5 · 1 done · 3 left')).toBeInTheDocument();
  });

  it('last question', () => {
    render(<QuizProgress total={5} completed={4} current={4} />);
    expect(states()).toEqual(['completed', 'completed', 'completed', 'completed', 'current']);
    expect(screen.getByText('Question 5 of 5 · 4 done · 0 left')).toBeInTheDocument();
  });

  it('result: everything done', () => {
    render(<QuizProgress total={5} completed={5} current={null} />);
    expect(states()).toEqual(['completed', 'completed', 'completed', 'completed', 'completed']);
    expect(screen.getByText('5 questions · 5 done · 0 left')).toBeInTheDocument();
  });

  it('exposes progressbar ARIA attributes', () => {
    render(<QuizProgress total={5} completed={2} current={2} />);
    const bar = screen.getByRole('progressbar', { name: 'Quiz progress' });
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '5');
    expect(bar).toHaveAttribute('aria-valuenow', '2');
  });
});
