import { createApp } from './app.ts';
import { loadConfig } from './config/config.ts';
import { createDocumentClient } from './config/dynamo.ts';
import { DynamoQuizDao } from './dao/quiz.dao.ts';
import { DynamoSubmissionDao } from './dao/submission.dao.ts';
import { QuizService } from './services/quiz.service.ts';

const config = loadConfig();
const client = createDocumentClient(config);
const quizService = new QuizService(new DynamoQuizDao(client), new DynamoSubmissionDao(client));
const app = createApp({ quizService });

app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
});
