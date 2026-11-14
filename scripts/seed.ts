import {
  CreateTableCommand,
  DeleteTableCommand,
  ListTablesCommand,
  ResourceNotFoundException,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import {
  client,
  documentClient,
  endpoint,
  QUIZZES_TABLE,
  sleep,
  SUBMISSIONS_TABLE,
} from './dynamo.ts';
import { quizzes } from './quizzes.ts';

const WAIT_SECONDS = 30;

async function waitForDynamo(): Promise<void> {
  const deadline = Date.now() + WAIT_SECONDS * 1000;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      await client.send(new ListTablesCommand({}));
      return;
    } catch (error) {
      lastError = error;
      await sleep(1000);
    }
  }
  console.error(
    `DynamoDB Local did not answer at ${endpoint} within ${WAIT_SECONDS} seconds.\n` +
      'Start it with "docker compose up -d" (or "podman compose up -d") and try again.\n' +
      `Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
  process.exit(1);
}

async function recreateTable(name: string, keys: { name: string; type: 'HASH' | 'RANGE' }[]) {
  try {
    await client.send(new DeleteTableCommand({ TableName: name }));
  } catch (error) {
    if (!(error instanceof ResourceNotFoundException)) throw error;
  }
  await client.send(
    new CreateTableCommand({
      TableName: name,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: keys.map((k) => ({ AttributeName: k.name, AttributeType: 'S' })),
      KeySchema: keys.map((k) => ({ AttributeName: k.name, KeyType: k.type })),
    }),
  );
  await waitUntilTableExists({ client, maxWaitTime: 30 }, { TableName: name });
}

await waitForDynamo();
await recreateTable(QUIZZES_TABLE, [{ name: 'id', type: 'HASH' }]);
await recreateTable(SUBMISSIONS_TABLE, [
  { name: 'quizId', type: 'HASH' },
  { name: 'id', type: 'RANGE' },
]);

for (const quiz of quizzes) {
  await documentClient.send(new PutCommand({ TableName: QUIZZES_TABLE, Item: quiz }));
}

console.log(`Seeded ${quizzes.length} quizzes into ${endpoint}.`);
