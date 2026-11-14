import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import type { PublicQuiz, QuizSummary, Submission } from 'shared-types';
import { App } from './App';
import { routerFuture } from './routerFuture';
import { QuizSessionProvider } from './session/QuizSessionContext';

export const summaries: QuizSummary[] = [
  {
    id: 'math-practice',
    title: 'Math Practice',
    description: 'Numbers and fractions.',
    questionCount: 2,
  },
  {
    id: 'english-practice',
    title: 'English Practice',
    description: 'Words and sentences.',
    questionCount: 3,
  },
];

export const quiz: PublicQuiz = {
  id: 'math-practice',
  title: 'Math Practice',
  description: 'Numbers and fractions.',
  questions: [
    {
      id: 'q1',
      text: 'What is 2 plus 2?',
      choices: [
        { id: 'a', text: '3' },
        { id: 'b', text: '4' },
      ],
    },
    {
      id: 'q2',
      text: 'Which is larger?',
      choices: [
        { id: 'a', text: '9' },
        { id: 'b', text: '4' },
      ],
    },
  ],
};

export function makeSubmission(score: number, total = 5): Submission {
  return {
    id: 'sub-1',
    quizId: quiz.id,
    participantName: 'Sam',
    answers: [],
    score,
    total,
    submittedAt: '2026-01-01T00:00:00.000Z',
  };
}

type Handler = () => Response | Promise<Response>;

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Replaces fetch. Keys look like "GET /api/quizzes". Unknown calls fail the test. */
export function mockFetch(routes: Record<string, Handler>) {
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${String(input)}`;
    const handler = routes[key];
    if (!handler) throw new Error(`Unexpected fetch: ${key}`);
    return handler();
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

/** Stands in for the browser Back button, which MemoryRouter does not have. */
function HistoryProbe() {
  const navigate = useNavigate();
  return <button onClick={() => navigate(-1)}>test: previous page</button>;
}

export function renderApp(route: string) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[route]} future={routerFuture}>
      <QuizSessionProvider>
        <App />
        <HistoryProbe />
      </QuizSessionProvider>
    </MemoryRouter>,
  );
  return user;
}
