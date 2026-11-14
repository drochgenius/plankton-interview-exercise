import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import type { PublicQuiz, QuizSummary, Submission } from 'shared-types';
import { createApp } from '../app.ts';
import { NotFoundError, ValidationError } from '../services/errors.ts';
import type { QuizServiceApi } from './quiz.resource.ts';

const summary: QuizSummary = {
  id: 'sample',
  title: 'Sample',
  description: 'Desc',
  questionCount: 1,
};
const publicQuiz: PublicQuiz = {
  id: 'sample',
  title: 'Sample',
  description: 'Desc',
  questions: [{ id: 'q1', text: 'Q?', choices: [{ id: 'a', text: 'A' }] }],
};
const submission: Submission = {
  id: 'abc',
  quizId: 'sample',
  participantName: 'Sam',
  answers: [{ questionId: 'q1', choiceId: 'a' }],
  score: 1,
  total: 1,
  submittedAt: '2026-01-01T00:00:00.000Z',
};

const fakeService: QuizServiceApi = {
  async listQuizzes() {
    return [summary];
  },
  async getQuiz(id) {
    if (id === 'boom') throw new Error('database exploded');
    if (id !== 'sample') throw new NotFoundError('missing');
    return publicQuiz;
  },
  async submit(id, body) {
    if (id !== 'sample') throw new NotFoundError('missing');
    if ((body as { participantName?: string })?.participantName === '') {
      throw new ValidationError('participantName must be a non-empty string.');
    }
    return submission;
  },
};

describe('quiz resource', () => {
  let server: Server;
  let base: string;
  const originalError = console.error;

  before(async () => {
    console.error = () => {}; // keep the expected 500 log out of the test output
    server = createApp({ quizService: fakeService }).listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://localhost:${(server.address() as AddressInfo).port}`;
  });

  after(async () => {
    console.error = originalError;
    await new Promise((resolve) => server.close(resolve));
  });

  const post = (path: string, body: string) =>
    fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body });

  it('GET /api/quizzes returns summaries', async () => {
    const res = await fetch(`${base}/api/quizzes`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), [summary]);
  });

  it('GET /api/quizzes/:id returns a quiz without correctChoiceId', async () => {
    const res = await fetch(`${base}/api/quizzes/sample`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.deepEqual(JSON.parse(text), publicQuiz);
    assert.ok(!text.includes('correctChoiceId'));
  });

  it('GET /api/quizzes/:id returns 404 for an unknown quiz', async () => {
    const res = await fetch(`${base}/api/quizzes/other`);
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { error: 'missing' });
  });

  it('POST submissions returns 201 and the submission', async () => {
    const res = await post(
      '/api/quizzes/sample/submissions',
      '{"participantName":"Sam","answers":[]}',
    );
    assert.equal(res.status, 201);
    const text = await res.text();
    assert.deepEqual(JSON.parse(text), submission);
    assert.ok(!text.includes('correctChoiceId'));
  });

  it('POST submissions returns 400 on a validation error', async () => {
    const res = await post(
      '/api/quizzes/sample/submissions',
      '{"participantName":"","answers":[]}',
    );
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: 'participantName must be a non-empty string.' });
  });

  it('POST submissions returns 400 on malformed JSON', async () => {
    const res = await post('/api/quizzes/sample/submissions', '{not json');
    assert.equal(res.status, 400);
    assert.equal(typeof ((await res.json()) as { error: string }).error, 'string');
  });

  it('POST submissions returns 404 for an unknown quiz', async () => {
    const res = await post(
      '/api/quizzes/other/submissions',
      '{"participantName":"Sam","answers":[]}',
    );
    assert.equal(res.status, 404);
  });

  it('returns 500 with an error body for unexpected errors', async () => {
    const res = await fetch(`${base}/api/quizzes/boom`);
    assert.equal(res.status, 500);
    const body = (await res.json()) as { error: string };
    assert.ok(!body.error.includes('exploded'));
  });
});
