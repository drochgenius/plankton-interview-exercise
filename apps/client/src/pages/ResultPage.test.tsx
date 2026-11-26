import { screen } from '@testing-library/react';
import { json, makeSubmission, mockFetch, quiz, renderApp } from '../test-utils';

afterEach(() => vi.unstubAllGlobals());

async function finishWithScore(score: number, total = 5) {
  mockFetch({
    'GET /api/quizzes/math-practice': () => json(quiz),
    'POST /api/quizzes/math-practice/score': () => json(makeSubmission(score, total), 201),
  });
  const user = renderApp('/quizzes/math-practice');
  await user.type(await screen.findByLabelText('Your name'), 'Sam');
  await user.click(screen.getByRole('button', { name: 'Start quiz' }));
  await user.click((await screen.findAllByRole('radio'))[0]!);
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await user.click(screen.getAllByRole('radio')[0]!);
  await user.click(screen.getByRole('button', { name: 'Finish' }));
  await screen.findByRole('heading', { name: /You got/ });
  return user;
}

describe('ResultPage', () => {
  it('redirects to the intro page when there is no session', async () => {
    mockFetch({ 'GET /api/quizzes/math-practice': () => json(quiz) });
    renderApp('/quizzes/math-practice/result');
    expect(await screen.findByLabelText('Your name')).toBeInTheDocument();
  });

  it('shows the score, a full progress bar and a link back to the list', async () => {
    await finishWithScore(4);
    expect(screen.getByRole('heading', { name: 'You got 4 out of 5' })).toBeInTheDocument();
    expect(screen.getByText('5 questions · 5 done · 0 left')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to quizzes' })).toHaveAttribute('href', '/');
  });

  it('shows the perfect message for 100%', async () => {
    await finishWithScore(5);
    expect(screen.getByText('Perfect! You got every question right!')).toBeInTheDocument();
  });

  it('shows the great job message for 60% or more', async () => {
    await finishWithScore(3);
    expect(screen.getByText('Great job! You did well.')).toBeInTheDocument();
  });

  it('shows the nice try message for under 60%', async () => {
    await finishWithScore(2);
    expect(screen.getByText('Nice try! Practice makes you stronger.')).toBeInTheDocument();
  });

  it('does not save the score until Submit Score is pressed', async () => {
    const fetchMock = mockFetch({
      'GET /api/quizzes/math-practice': () => json(quiz),
      'POST /api/quizzes/math-practice/score': () => json({ score: 4, total: 5 }),
      'POST /api/quizzes/math-practice/submissions': () => json(makeSubmission(4), 201),
      'GET /api/quizzes/math-practice/scoreboard': () => json({ passed: [], failed: [] }),
    });
    const user = renderApp('/quizzes/math-practice');
    await user.type(await screen.findByLabelText('Your name'), 'Sam');
    await user.click(screen.getByRole('button', { name: 'Start quiz' }));
    await user.click((await screen.findAllByRole('radio'))[0]!);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getAllByRole('radio')[0]!);
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    await screen.findByRole('heading', { name: 'You got 4 out of 5' });

    const submissionCalls = () =>
      fetchMock.mock.calls.filter(([input]) => String(input).endsWith('/submissions')).length;
    expect(submissionCalls()).toBe(0);

    await user.click(screen.getByRole('button', { name: 'Submit Score' }));
    expect(await screen.findByRole('heading', { name: 'Passing scoreboard' })).toBeInTheDocument();
    expect(submissionCalls()).toBe(1);
  });

  it('opens the failed scoreboard for a failing score and switches back and forth', async () => {
    mockFetch({
      'GET /api/quizzes/math-practice': () => json(quiz),
      'POST /api/quizzes/math-practice/score': () => json({ score: 1, total: 5 }),
      'POST /api/quizzes/math-practice/submissions': () => json(makeSubmission(1), 201),
      'GET /api/quizzes/math-practice/scoreboard': () => json({ passed: [], failed: [] }),
    });
    const user = renderApp('/quizzes/math-practice');
    await user.type(await screen.findByLabelText('Your name'), 'Sam');
    await user.click(screen.getByRole('button', { name: 'Start quiz' }));
    await user.click((await screen.findAllByRole('radio'))[0]!);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getAllByRole('radio')[0]!);
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    await user.click(await screen.findByRole('button', { name: 'Submit Score' }));

    expect(await screen.findByRole('heading', { name: 'Failed scoreboard' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Switch Scoreboard' }));
    expect(screen.getByRole('heading', { name: 'Passing scoreboard' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Switch Scoreboard' }));
    expect(screen.getByRole('heading', { name: 'Failed scoreboard' })).toBeInTheDocument();
  });

  it('highlights the player’s own row on the scoreboard', async () => {
    mockFetch({
      'GET /api/quizzes/math-practice': () => json(quiz),
      'POST /api/quizzes/math-practice/score': () => json({ score: 4, total: 5 }),
      'POST /api/quizzes/math-practice/submissions': () => json(makeSubmission(4), 201),
      'GET /api/quizzes/math-practice/scoreboard': () =>
        json({
          passed: [
            {
              id: 'sub-1',
              participantName: 'Sam',
              score: 4,
              total: 5,
              submittedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          failed: [],
        }),
    });
    const user = renderApp('/quizzes/math-practice');
    await user.type(await screen.findByLabelText('Your name'), 'Sam');
    await user.click(screen.getByRole('button', { name: 'Start quiz' }));
    await user.click((await screen.findAllByRole('radio'))[0]!);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getAllByRole('radio')[0]!);
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    await user.click(await screen.findByRole('button', { name: 'Submit Score' }));

    expect(await screen.findByText('(you)')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /Sam/ })).toHaveTextContent('Sam (you)');
  });

  it('leaves the scoreboard closed when the player goes back without submitting', async () => {
    const user = await finishWithScore(1);
    await user.click(screen.getByRole('link', { name: 'Back to quizzes' }));
    expect(screen.queryByRole('heading', { name: /scoreboard/i })).not.toBeInTheDocument();
  });

  it('does not show correct answers', async () => {
    await finishWithScore(4);
    expect(screen.queryByText(/correct answer/i)).not.toBeInTheDocument();
  });
});
