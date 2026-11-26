import type { Submission } from 'shared-types';
import { sessionReducer, type QuizSessionState } from './quizSession.reducer';

const questions = [
  { id: 'q1', text: 'One?', choices: [{ id: 'a', text: 'A' }] },
  { id: 'q2', text: 'Two?', choices: [{ id: 'a', text: 'A' }] },
];

const started = (): QuizSessionState =>
  sessionReducer(null, { type: 'start', quizId: 'quiz', participantName: 'Sam', questions })!;

describe('sessionReducer', () => {
  it('start creates a fresh session at the first question', () => {
    expect(started()).toEqual({
      quizId: 'quiz',
      participantName: 'Sam',
      questions,
      currentIndex: 0,
      answers: {},
      score: null,
      submission: null,
    });
  });

  it('start replaces an earlier session', () => {
    const old = sessionReducer(started(), { type: 'selectAnswer', choiceId: 'a' });
    const fresh = sessionReducer(old, {
      type: 'start',
      quizId: 'quiz',
      participantName: 'Alex',
      questions,
    });
    expect(fresh?.answers).toEqual({});
    expect(fresh?.participantName).toBe('Alex');
  });

  it('selectAnswer records the choice for the current question and can change it', () => {
    let state: ReturnType<typeof sessionReducer> = started();
    state = sessionReducer(state, { type: 'selectAnswer', choiceId: 'a' });
    expect(state?.answers).toEqual({ q1: 'a' });
    state = sessionReducer(state, { type: 'selectAnswer', choiceId: 'b' });
    expect(state?.answers).toEqual({ q1: 'b' });
  });

  it('next moves on and stops at the last question', () => {
    let state: ReturnType<typeof sessionReducer> = started();
    state = sessionReducer(state, { type: 'next' });
    expect(state?.currentIndex).toBe(1);
    state = sessionReducer(state, { type: 'next' });
    expect(state?.currentIndex).toBe(1);
  });

  it('finish stores the submission', () => {
    const submission: Submission = {
      id: 's1',
      quizId: 'quiz',
      participantName: 'Sam',
      answers: [],
      score: 1,
      total: 2,
      submittedAt: '2026-01-01T00:00:00.000Z',
    };
    expect(sessionReducer(started(), { type: 'finish', submission })?.submission).toEqual(
      submission,
    );
  });

  it('ignores actions when there is no session', () => {
    expect(sessionReducer(null, { type: 'next' })).toBeNull();
    expect(sessionReducer(null, { type: 'selectAnswer', choiceId: 'a' })).toBeNull();
  });
});
