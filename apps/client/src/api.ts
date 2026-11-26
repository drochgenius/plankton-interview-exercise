import type { Answer, PublicQuiz, QuizSummary, Score, Scoreboard, Submission } from 'shared-types';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // The body was not JSON. Keep the default message.
    }
    throw new ApiError(message, response.status);
  }
  return (await response.json()) as T;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function listQuizzes(): Promise<QuizSummary[]> {
  return request('/api/quizzes');
}

export function getQuiz(id: string): Promise<PublicQuiz> {
  return request(`/api/quizzes/${encodeURIComponent(id)}`);
}

/** Checks the answers and returns the score. Nothing is saved. */
export function scoreAnswers(
  quizId: string,
  participantName: string,
  answers: Answer[],
): Promise<Score> {
  return post(`/api/quizzes/${encodeURIComponent(quizId)}/score`, { participantName, answers });
}

/** Saves the submission. */
export function submitAnswers(
  quizId: string,
  participantName: string,
  answers: Answer[],
): Promise<Submission> {
  return post(`/api/quizzes/${encodeURIComponent(quizId)}/submissions`, {
    participantName,
    answers,
  });
}

export function getScoreboard(quizId: string): Promise<Scoreboard> {
  return request(`/api/quizzes/${encodeURIComponent(quizId)}/scoreboard`);
}
