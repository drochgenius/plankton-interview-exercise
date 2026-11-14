import type { Answer, PublicQuiz, QuizSummary, Submission } from 'shared-types';

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

export function listQuizzes(): Promise<QuizSummary[]> {
  return request('/api/quizzes');
}

export function getQuiz(id: string): Promise<PublicQuiz> {
  return request(`/api/quizzes/${encodeURIComponent(id)}`);
}

export function submitAnswers(
  quizId: string,
  participantName: string,
  answers: Answer[],
): Promise<Submission> {
  return request(`/api/quizzes/${encodeURIComponent(quizId)}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ participantName, answers }),
  });
}
