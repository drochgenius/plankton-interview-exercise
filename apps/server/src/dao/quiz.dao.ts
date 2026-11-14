import { GetCommand, ScanCommand, type DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { Quiz } from 'shared-types';
import { QuizModel } from '../model/quiz.model.ts';

export const QUIZZES_TABLE = 'Quizzes';

export interface QuizDao {
  list(): Promise<QuizModel[]>;
  get(id: string): Promise<QuizModel | undefined>;
}

export class DynamoQuizDao implements QuizDao {
  client: DynamoDBDocumentClient;

  constructor(client: DynamoDBDocumentClient) {
    this.client = client;
  }

  async list(): Promise<QuizModel[]> {
    const items: Quiz[] = [];
    let startKey: Record<string, unknown> | undefined;
    do {
      const result = await this.client.send(
        new ScanCommand({ TableName: QUIZZES_TABLE, ExclusiveStartKey: startKey }),
      );
      items.push(...((result.Items ?? []) as Quiz[]));
      startKey = result.LastEvaluatedKey;
    } while (startKey);
    return items.map((item) => new QuizModel(item)).sort((a, b) => a.title.localeCompare(b.title));
  }

  async get(id: string): Promise<QuizModel | undefined> {
    const result = await this.client.send(
      new GetCommand({ TableName: QUIZZES_TABLE, Key: { id } }),
    );
    return result.Item ? new QuizModel(result.Item as Quiz) : undefined;
  }
}
