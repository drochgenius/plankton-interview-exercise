import { screen } from '@testing-library/react';
import { json, mockFetch, renderApp, summaries } from '../test-utils';

afterEach(() => vi.unstubAllGlobals());

describe('QuizListPage', () => {
  it('shows a loading message, then the quizzes', async () => {
    mockFetch({ 'GET /api/quizzes': () => json(summaries) });
    renderApp('/');

    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(await screen.findByRole('heading', { name: 'Math Practice' })).toBeInTheDocument();
    expect(screen.getByText('Numbers and fractions.')).toBeInTheDocument();
    expect(screen.getByText('2 questions')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Choose English Practice' })).toHaveAttribute(
      'href',
      '/quizzes/english-practice',
    );
  });

  it('does not show the progress indicator', async () => {
    mockFetch({ 'GET /api/quizzes': () => json(summaries) });
    renderApp('/');
    await screen.findByRole('heading', { name: 'Math Practice' });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows an error and can try again', async () => {
    let calls = 0;
    mockFetch({
      'GET /api/quizzes': () => (++calls === 1 ? json({ error: 'down' }, 500) : json(summaries)),
    });
    const user = renderApp('/');

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not load the quizzes');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Math Practice' })).toBeInTheDocument();
  });
});
