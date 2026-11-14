import { screen } from '@testing-library/react';
import { json, mockFetch, quiz, renderApp } from '../test-utils';

afterEach(() => vi.unstubAllGlobals());

const ROUTE = '/quizzes/math-practice';
const quizRoute = { 'GET /api/quizzes/math-practice': () => json(quiz) };

describe('IntroPage', () => {
  it('shows loading, then the quiz details, steps and progress', async () => {
    mockFetch(quizRoute);
    renderApp(ROUTE);

    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(await screen.findByRole('heading', { name: 'Math Practice' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Type your name.',
      'Read each question.',
      'Tap the answer you think is right.',
      'Press Next to go on.',
      'See your score at the end!',
    ]);
    expect(screen.getByText('2 questions · 0 done · 2 left')).toBeInTheDocument();
  });

  it('shows an error when the quiz cannot be loaded', async () => {
    mockFetch({ 'GET /api/quizzes/math-practice': () => json({ error: 'Not found' }, 404) });
    renderApp(ROUTE);
    expect(await screen.findByRole('alert')).toHaveTextContent('We could not load this quiz');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('keeps Start disabled, with a hint, until a name is entered', async () => {
    mockFetch(quizRoute);
    const user = renderApp(ROUTE);
    const start = await screen.findByRole('button', { name: 'Start quiz' });

    expect(start).toBeDisabled();
    expect(screen.getByText('Type your name to start.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Your name'), '   ');
    expect(start).toBeDisabled();

    await user.type(screen.getByLabelText('Your name'), 'Sam');
    expect(start).toBeEnabled();
    expect(screen.queryByText('Type your name to start.')).not.toBeInTheDocument();
  });

  it('limits the name length', async () => {
    mockFetch(quizRoute);
    renderApp(ROUTE);
    expect(await screen.findByLabelText('Your name')).toHaveAttribute('maxlength', '50');
  });

  it('starts the quiz when Start is clicked', async () => {
    mockFetch(quizRoute);
    const user = renderApp(ROUTE);
    await user.type(await screen.findByLabelText('Your name'), 'Sam');
    await user.click(screen.getByRole('button', { name: 'Start quiz' }));
    expect(await screen.findByText(/Question 1 of 2/)).toBeInTheDocument();
  });

  it('starts the quiz when Enter is pressed with a name entered', async () => {
    mockFetch(quizRoute);
    const user = renderApp(ROUTE);
    await user.type(await screen.findByLabelText('Your name'), 'Sam{Enter}');
    expect(await screen.findByText(/Question 1 of 2/)).toBeInTheDocument();
  });

  it('does not start when Enter is pressed with no name', async () => {
    mockFetch(quizRoute);
    const user = renderApp(ROUTE);
    await user.type(await screen.findByLabelText('Your name'), '{Enter}');
    expect(screen.getByRole('button', { name: 'Start quiz' })).toBeInTheDocument();
    expect(screen.queryByText(/Question 1 of 2/)).not.toBeInTheDocument();
  });
});
