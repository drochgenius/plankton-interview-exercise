import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { Submission } from 'shared-types';
import { InMemoryQuizDao, InMemorySubmissionDao } from '../test-helpers.ts';
import { SubmissionModel } from '../model/submission.model.ts';
import { NotFoundError, ValidationError } from './errors.ts';
import { buildScoreboard, QuizService } from './quiz.service.ts';

// The sample quiz has 2 questions. Correct answers: q1 = b, q2 = a.
const correct = [
  { questionId: 'q1', choiceId: 'b' },
  { questionId: 'q2', choiceId: 'a' },
];
const oneRight = [
  { questionId: 'q1', choiceId: 'b' },
  { questionId: 'q2', choiceId: 'b' },
];

function sub(id: string, participantName: string, score: number, submittedAt: string): Submission {
  return {
    id,
    quizId: 'sample',
    participantName,
    answers: [],
    score,
    total: 2,
    submittedAt,
  };
}

describe('buildScoreboard', () => {
  it('puts scores at the pass mark (50%) or above on the passed board, highest first', () => {
    const board = buildScoreboard([
      sub('a', 'Low', 1, '2026-01-01T00:00:00Z'),
      sub('b', 'High', 2, '2026-01-01T00:00:01Z'),
      sub('c', 'Mid', 1, '2026-01-01T00:00:02Z'),
    ]);
    // Low and Mid tie on score 1, so the earlier submission (Low) comes first.
    assert.deepEqual(
      board.passed.map((e) => e.participantName),
      ['High', 'Low', 'Mid'],
    );
    assert.deepEqual(board.failed, []);
  });

  it('puts scores under the pass mark on the failed board, lowest first', () => {
    const board = buildScoreboard([
      sub('a', 'Zero', 0, '2026-01-01T00:00:00Z'),
      sub('b', 'Mid', 1, '2026-01-01T00:00:01Z'),
      sub('c', 'Other', 0, '2026-01-01T00:00:02Z'),
    ]);
    assert.deepEqual(
      board.failed.map((e) => e.participantName),
      ['Zero', 'Other'],
    );
    assert.deepEqual(
      board.passed.map((e) => e.participantName),
      ['Mid'],
    );
  });

  it('treats exactly 50% as passing and anything below it as failing', () => {
    const board = buildScoreboard([sub('a', 'Half', 1, '2026-01-01T00:00:00Z')]);
    assert.equal(board.passed.length, 1);
    assert.equal(board.failed.length, 0);
  });

  it('keeps the earlier submission first when scores are equal', () => {
    const board = buildScoreboard([
      sub('late', 'Late', 2, '2026-01-01T00:00:05Z'),
      sub('early', 'Early', 2, '2026-01-01T00:00:01Z'),
    ]);
    assert.deepEqual(
      board.passed.map((e) => e.id),
      ['early', 'late'],
    );
  });

  it('keeps every submission with the same name', () => {
    const board = buildScoreboard([
      sub('1', 'Sam', 2, '2026-01-01T00:00:00Z'),
      sub('2', 'Sam', 2, '2026-01-01T00:00:01Z'),
    ]);
    assert.equal(board.passed.length, 2);
    assert.deepEqual(
      board.passed.map((e) => e.id),
      ['1', '2'],
    );
  });

  it('returns only the public fields for each entry', () => {
    const board = buildScoreboard([sub('a', 'Sam', 2, '2026-01-01T00:00:00Z')]);
    assert.deepEqual(Object.keys(board.passed[0]!).sort(), [
      'id',
      'participantName',
      'score',
      'submittedAt',
      'total',
    ]);
  });
});

describe('QuizService score and scoreboard', () => {
  let submissionDao: InMemorySubmissionDao;
  let service: QuizService;

  beforeEach(() => {
    submissionDao = new InMemorySubmissionDao();
    service = new QuizService(new InMemoryQuizDao(), submissionDao);
  });

  it('score checks the answers without saving anything', async () => {
    const result = await service.score('sample', { participantName: 'Sam', answers: correct });
    assert.deepEqual(result, { score: 2, total: 2 });
    assert.equal(submissionDao.saved.length, 0);
  });

  it('score rejects bad input the same way submit does', async () => {
    await assert.rejects(
      service.score('sample', { participantName: '', answers: [] }),
      ValidationError,
    );
    await assert.rejects(
      service.score('nope', { participantName: 'Sam', answers: [] }),
      NotFoundError,
    );
  });

  it('submit saves the score and the scoreboard shows it', async () => {
    await service.submit('sample', { participantName: 'Sam', answers: oneRight });
    const board = await service.getScoreboard('sample');
    assert.equal(board.passed.length, 1);
    assert.equal(board.passed[0]!.participantName, 'Sam');
    assert.equal(board.passed[0]!.score, 1);
  });

  it('only includes submissions for the requested quiz', async () => {
    submissionDao.saved.push(
      new SubmissionModel({
        ...sub('other', 'Elsewhere', 2, '2026-01-01T00:00:00Z'),
        quizId: 'other',
      }),
    );
    const board = await service.getScoreboard('sample');
    assert.deepEqual(board, { passed: [], failed: [] });
  });

  it('getScoreboard throws NotFoundError for an unknown quiz', async () => {
    await assert.rejects(service.getScoreboard('nope'), NotFoundError);
  });
});
