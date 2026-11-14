import { randomUUID } from 'node:crypto';
import type { Answer, PublicQuiz, QuizSummary, Submission } from 'shared-types';
import type { QuizDao } from '../dao/quiz.dao.ts';
import type { SubmissionDao } from '../dao/submission.dao.ts';
import type { QuizModel } from '../model/quiz.model.ts';
import { SubmissionModel } from '../model/submission.model.ts';
import { NotFoundError, ValidationError } from './errors.ts';

export const MAX_NAME_LENGTH = 50;

export class QuizService {
  quizDao: QuizDao;
  submissionDao: SubmissionDao;

  constructor(quizDao: QuizDao, submissionDao: SubmissionDao) {
    this.quizDao = quizDao;
    this.submissionDao = submissionDao;
  }

  async listQuizzes(): Promise<QuizSummary[]> {
    const quizzes = await this.quizDao.list();
    return quizzes.map((quiz) => quiz.toSummary());
  }

  async getQuiz(id: string): Promise<PublicQuiz> {
    const quiz = await this.findQuiz(id);
    return quiz.toPublic();
  }

  async submit(quizId: string, body: unknown): Promise<Submission> {
    const quiz = await this.findQuiz(quizId);
    const { participantName, answers } = this.validate(quiz, body);

    const score = this.score(quiz, answers);
    const submission = new SubmissionModel({
      id: randomUUID(),
      quizId: quiz.id,
      participantName,
      answers,
      score,
      total: quiz.questions.length,
      submittedAt: new Date().toISOString(),
    });
    await this.submissionDao.save(submission);
    return submission;
  }

  private async findQuiz(id: string): Promise<QuizModel> {
    const quiz = await this.quizDao.get(id);
    if (!quiz) throw new NotFoundError(`Quiz "${id}" was not found.`);
    return quiz;
  }

  private validate(quiz: QuizModel, body: unknown): { participantName: string; answers: Answer[] } {
    if (typeof body !== 'object' || body === null) {
      throw new ValidationError('The request body must be a JSON object.');
    }
    const { participantName, answers } = body as Record<string, unknown>;

    if (typeof participantName !== 'string' || participantName.trim() === '') {
      throw new ValidationError('participantName must be a non-empty string.');
    }
    if (participantName.trim().length > MAX_NAME_LENGTH) {
      throw new ValidationError(`participantName must be at most ${MAX_NAME_LENGTH} characters.`);
    }
    if (!Array.isArray(answers)) {
      throw new ValidationError('answers must be an array.');
    }

    const seen = new Set<string>();
    const validated: Answer[] = [];
    for (const item of answers) {
      const { questionId, choiceId } = (item ?? {}) as Record<string, unknown>;
      if (typeof questionId !== 'string' || typeof choiceId !== 'string') {
        throw new ValidationError('Each answer needs a questionId and a choiceId.');
      }
      const question = quiz.questions.find((q) => q.id === questionId);
      if (!question) {
        throw new ValidationError(`Unknown questionId "${questionId}".`);
      }
      if (!question.choices.some((c) => c.id === choiceId)) {
        throw new ValidationError(`Unknown choiceId "${choiceId}" for question "${questionId}".`);
      }
      if (seen.has(questionId)) {
        throw new ValidationError(`Question "${questionId}" is answered more than once.`);
      }
      seen.add(questionId);
      validated.push({ questionId, choiceId });
    }
    return { participantName: participantName.trim(), answers: validated };
  }

  /** Unanswered questions count as wrong. */
  private score(quiz: QuizModel, answers: Answer[]): number {
    return answers.filter((answer) => {
      const question = quiz.questions.find((q) => q.id === answer.questionId);
      return question?.correctChoiceId === answer.choiceId;
    }).length;
  }
}
