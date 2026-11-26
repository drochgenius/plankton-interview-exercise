import { PutCommand, QueryCommand, type DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { Submission } from 'shared-types';
import type { SubmissionModel } from '../model/submission.model.ts';

export const SUBMISSIONS_TABLE = 'Submissions';

export interface SubmissionDao {
  save(submission: SubmissionModel): Promise<void>;
  listByQuiz(quizId: string): Promise<Submission[]>;
}

export class DynamoSubmissionDao implements SubmissionDao {
  client: DynamoDBDocumentClient;

  constructor(client: DynamoDBDocumentClient) {
    this.client = client;
  }

  async save(submission: SubmissionModel): Promise<void> {
    await this.client.send(
      new PutCommand({ TableName: SUBMISSIONS_TABLE, Item: { ...submission } }),
    );
  }

  async listByQuiz(quizId: string): Promise<Submission[]> {
    const items: Submission[] = [];
    let startKey: Record<string, unknown> | undefined;
    do {
      const result = await this.client.send(
        new QueryCommand({
          TableName: SUBMISSIONS_TABLE,
          KeyConditionExpression: 'quizId = :quizId',
          ExpressionAttributeValues: { ':quizId': quizId },
          ExclusiveStartKey: startKey,
        }),
      );
      items.push(...((result.Items ?? []) as Submission[]));
      startKey = result.LastEvaluatedKey;
    } while (startKey);
    return items;
  }
}
