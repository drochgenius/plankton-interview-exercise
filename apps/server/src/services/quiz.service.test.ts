import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { InMemoryQuizDao, InMemorySubmissionDao } from '../test-helpers.ts';
import { NotFoundError, ValidationError } from './errors.ts';
import { QuizService } from './quiz.service.ts';

describe('QuizService', () => {
  let submissionDao: InMemorySubmissionDao;
  let service: QuizService;

  beforeEach(() => {
    submissionDao = new InMemorySubmissionDao();
    service = new QuizService(new InMemoryQuizDao(), submissionDao);
  });

  it('lists quiz summaries with a question count', async () => {
    const list = await service.listQuizzes();
    assert.deepEqual(list, [
      {
        id: 'sample',
        title: 'Sample',
        description: 'A tiny quiz for tests.',
        questionCount: 2,
      },
    ]);
  });

  it('returns a public quiz without correct answers', async () => {
    const quiz = await service.getQuiz('sample');
    assert.equal(quiz.questions.length, 2);
    assert.ok(!JSON.stringify(quiz).includes('correctChoiceId'));
  });

  it('throws NotFoundError for an unknown quiz', async () => {
    await assert.rejects(service.getQuiz('nope'), NotFoundError);
    await assert.rejects(
      service.submit('nope', { participantName: 'Sam', answers: [] }),
      NotFoundError,
    );
  });

  describe('scoring', () => {
    it('scores all correct answers', async () => {
      const result = await service.submit('sample', {
        participantName: 'Sam',
        answers: [
          { questionId: 'q1', choiceId: 'b' },
          { questionId: 'q2', choiceId: 'a' },
        ],
      });
      assert.equal(result.score, 2);
      assert.equal(result.total, 2);
    });

    it('scores zero when every answer is wrong', async () => {
      const result = await service.submit('sample', {
        participantName: 'Sam',
        answers: [
          { questionId: 'q1', choiceId: 'a' },
          { questionId: 'q2', choiceId: 'b' },
        ],
      });
      assert.equal(result.score, 0);
    });

    it('counts unanswered questions as wrong', async () => {
      const result = await service.submit('sample', {
        participantName: 'Sam',
        answers: [{ questionId: 'q1', choiceId: 'b' }],
      });
      assert.equal(result.score, 1);
      assert.equal(result.total, 2);
    });

    it('stores the submission with an id and a timestamp', async () => {
      const result = await service.submit('sample', { participantName: '  Sam  ', answers: [] });
      assert.equal(submissionDao.saved.length, 1);
      assert.equal(submissionDao.saved[0]?.id, result.id);
      assert.equal(result.participantName, 'Sam');
      assert.equal(result.quizId, 'sample');
      assert.equal(new Date(result.submittedAt).toISOString(), result.submittedAt);
    });
  });

  describe('validation', () => {
    const bad: [string, unknown][] = [
      ['a body that is not an object', 'hello'],
      ['a missing participantName', { answers: [] }],
      ['an empty participantName', { participantName: '   ', answers: [] }],
      ['a participantName that is not a string', { participantName: 5, answers: [] }],
      ['a participantName that is too long', { participantName: 'x'.repeat(51), answers: [] }],
      ['answers that are not an array', { participantName: 'Sam', answers: 'x' }],
      [
        'an answer with missing fields',
        { participantName: 'Sam', answers: [{ questionId: 'q1' }] },
      ],
      [
        'an unknown questionId',
        { participantName: 'Sam', answers: [{ questionId: 'q9', choiceId: 'a' }] },
      ],
      [
        'an unknown choiceId',
        { participantName: 'Sam', answers: [{ questionId: 'q1', choiceId: 'z' }] },
      ],
      [
        'a question answered twice',
        {
          participantName: 'Sam',
          answers: [
            { questionId: 'q1', choiceId: 'a' },
            { questionId: 'q1', choiceId: 'b' },
          ],
        },
      ],
    ];

    for (const [name, body] of bad) {
      it(`rejects ${name}`, async () => {
        await assert.rejects(service.submit('sample', body), ValidationError);
        assert.equal(submissionDao.saved.length, 0);
      });
    }
  });
});
