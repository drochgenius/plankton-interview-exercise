import { Router } from 'express';
import type { QuizService } from '../services/quiz.service.ts';
import { asyncHandler } from './async-handler.ts';

export type QuizServiceApi = Pick<QuizService, 'listQuizzes' | 'getQuiz' | 'submit'>;

export function createQuizRouter(service: QuizServiceApi): Router {
  const router = Router();

  router.get(
    '/quizzes',
    asyncHandler(async (_req, res) => {
      res.json(await service.listQuizzes());
    }),
  );

  router.get(
    '/quizzes/:id',
    asyncHandler(async (req, res) => {
      res.json(await service.getQuiz(req.params.id as string));
    }),
  );

  router.post(
    '/quizzes/:id/submissions',
    asyncHandler(async (req, res) => {
      const submission = await service.submit(req.params.id as string, req.body);
      res.status(201).json(submission);
    }),
  );

  return router;
}
