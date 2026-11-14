import { PutCommand, type DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { SubmissionModel } from '../model/submission.model.ts';

export const SUBMISSIONS_TABLE = 'Submissions';

export interface SubmissionDao {
  save(submission: SubmissionModel): Promise<void>;
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
}
