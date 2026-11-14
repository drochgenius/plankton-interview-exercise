import { screen, within } from '@testing-library/react';
import { json, mockFetch, quiz, renderApp } from '../test-utils';

afterEach(() => vi.unstubAllGlobals());

const quizRoute = { 'GET /api/quizzes/math-practice': () => json(quiz) };

async function startQuiz(routes: Record<string, () => Response | Promise<Response>> = {}) {
  const fetchMock = mockFetch({ ...quizRoute, ...routes });
  const user = renderApp('/quizzes/math-practice');
  await user.type(await screen.findByLabelText('Your name'), 'Sam');
  await user.click(screen.getByRole('button', { name: 'Start quiz' }));
  await screen.findByText(/Question 1 of 2/);
  return { user, fetchMock };
}

describe('QuestionPage', () => {
  it('redirects to the intro page when there is no session', async () => {
    mockFetch(quizRoute);
    renderApp('/quizzes/math-practice/play');
    expect(await screen.findByLabelText('Your name')).toBeInTheDocument();
  });

  it('shows the progress and keeps Next disabled, with a hint, until a choice is selected', async () => {
    const { user } = await startQuiz();

    expect(screen.getByText('Question 1 of 2 · 0 done · 1 left')).toBeInTheDocument();
    const next = screen.getByRole('button', { name: 'Next' });
    expect(next).toBeDisabled();
    expect(screen.getByText('Pick an answer to go on.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('radio')[0]!);
    expect(next).toBeEnabled();
    expect(screen.queryByText('Pick an answer to go on.')).not.toBeInTheDocument();
  });

  it('lets the player change the choice before clicking Next', async () => {
    const { user } = await startQuiz();
    const [first, second] = screen.getAllByRole('radio');
    await user.click(first!);
    await user.click(second!);
    expect(first).not.toBeChecked();
    expect(second).toBeChecked();
  });

  it('shows Finish on the last question and Next before it', async () => {
    const { user } = await startQuiz();
    await user.click(screen.getAllByRole('radio')[0]!);
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText(/Question 2 of 2/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finish' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('submits every answer on Finish and shows the result', async () => {
    const { user, fetchMock } = await startQuiz({
      'POST /api/quizzes/math-practice/submissions': () =>
        json(
          {
            id: 's1',
            quizId: 'math-practice',
            participantName: 'Sam',
            answers: [],
            score: 1,
            total: 2,
            submittedAt: '2026-01-01T00:00:00.000Z',
          },
          201,
        ),
    });
    await user.click(screen.getAllByRole('radio')[0]!);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getAllByRole('radio')[1]!);
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    expect(await screen.findByText('You got 1 out of 2')).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')!;
    const body = JSON.parse(post[1]!.body as string);
    expect(body.participantName).toBe('Sam');
    expect(body.answers).toHaveLength(2);
    expect(body.answers.map((a: { questionId: string }) => a.questionId).sort()).toEqual([
      'q1',
      'q2',
    ]);
  });

  it('shows the server error on a failed submission, keeps the answers and can try again', async () => {
    let calls = 0;
    const { user } = await startQuiz({
      'POST /api/quizzes/math-practice/submissions': () =>
        ++calls === 1
          ? json({ error: 'participantName must be a non-empty string.' }, 400)
          : json(
              {
                id: 's1',
                quizId: 'math-practice',
                participantName: 'Sam',
                answers: [],
                score: 2,
                total: 2,
                submittedAt: 'x',
              },
              201,
            ),
    });
    await user.click(screen.getAllByRole('radio')[0]!);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getAllByRole('radio')[0]!);
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Oops! We could not save your score. Please try again.');
    expect(alert).toHaveTextContent('participantName must be a non-empty string.');
    expect(screen.getAllByRole('radio')[0]).toBeChecked();

    await user.click(within(document.body).getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('You got 2 out of 2')).toBeInTheDocument();
  });
});
