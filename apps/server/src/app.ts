import express, { type Express } from 'express';
import { errorHandler } from './resource/error-handler.ts';
import { createQuizRouter, type QuizServiceApi } from './resource/quiz.resource.ts';

export interface AppServices {
  quizService: QuizServiceApi;
}

export function createApp({ quizService }: AppServices): Express {
  const app = express();
  app.use(express.json());
  app.use('/api', createQuizRouter(quizService));
  app.use(errorHandler);
  return app;
}
