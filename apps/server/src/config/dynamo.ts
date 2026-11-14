import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { Config } from './config.ts';

export function createDocumentClient(config: Config): DynamoDBDocumentClient {
  const client = new DynamoDBClient({
    region: config.region,
    endpoint: config.dynamodbEndpoint,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  return DynamoDBDocumentClient.from(client, { marshallOptions: { removeUndefinedValues: true } });
}
