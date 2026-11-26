import type { Quiz } from 'shared-types';
import type { QuizDao } from './dao/quiz.dao.ts';
import type { SubmissionDao } from './dao/submission.dao.ts';
import { QuizModel } from './model/quiz.model.ts';
import type { SubmissionModel } from './model/submission.model.ts';

export const sampleQuiz: Quiz = {
  id: 'sample',
  title: 'Sample',
  description: 'A tiny quiz for tests.',
  questions: [
    {
      id: 'q1',
      text: 'What is $2 \\times 3$?',
      choices: [
        { id: 'a', text: '5' },
        { id: 'b', text: '6' },
      ],
      correctChoiceId: 'b',
    },
    {
      id: 'q2',
      text: 'Pick the larger number.',
      choices: [
        { id: 'a', text: '9' },
        { id: 'b', text: '4' },
      ],
      correctChoiceId: 'a',
    },
  ],
};

export class InMemoryQuizDao implements QuizDao {
  quizzes: QuizModel[];

  constructor(quizzes: Quiz[] = [sampleQuiz]) {
    this.quizzes = quizzes.map((q) => new QuizModel(q));
  }

  async list(): Promise<QuizModel[]> {
    return this.quizzes;
  }

  async get(id: string): Promise<QuizModel | undefined> {
    return this.quizzes.find((q) => q.id === id);
  }
}

export class InMemorySubmissionDao implements SubmissionDao {
  saved: SubmissionModel[] = [];

  async save(submission: SubmissionModel): Promise<void> {
    this.saved.push(submission);
  }

  async listByQuiz(quizId: string): Promise<SubmissionModel[]> {
    return this.saved.filter((s) => s.quizId === quizId);
  }
}
