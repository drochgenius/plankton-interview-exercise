import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { loadConfig } from '../apps/server/src/config/config.ts';
import { QUIZZES_TABLE } from '../apps/server/src/dao/quiz.dao.ts';
import { SUBMISSIONS_TABLE } from '../apps/server/src/dao/submission.dao.ts';

export { QUIZZES_TABLE, SUBMISSIONS_TABLE };

const config = loadConfig();

export const endpoint = config.dynamodbEndpoint;

export const client = new DynamoDBClient({
  region: config.region,
  endpoint,
  credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  maxAttempts: 1,
});

export const documentClient = DynamoDBDocumentClient.from(client);

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
