export interface Config {
  port: number;
  region: string;
  dynamodbEndpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: Number(env.PORT ?? 3001),
    region: env.AWS_REGION ?? 'us-east-1',
    dynamodbEndpoint: env.DYNAMODB_ENDPOINT ?? 'http://localhost:8000',
    // DynamoDB Local accepts any credentials. These are dummy values.
    accessKeyId: env.AWS_ACCESS_KEY_ID ?? 'local',
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY ?? 'local',
  };
}
