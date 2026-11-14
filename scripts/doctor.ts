import { spawnSync } from 'node:child_process';
import { ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { client, documentClient, endpoint, QUIZZES_TABLE, SUBMISSIONS_TABLE } from './dynamo.ts';

interface Result {
  ok: boolean;
  detail: string;
}

const checks: [string, () => Promise<Result> | Result][] = [
  [
    'Node version is 24 or newer',
    () => {
      const major = Number(process.versions.node.split('.')[0]);
      return { ok: major >= 24, detail: `found ${process.versions.node}` };
    },
  ],
  [
    'Container runtime (docker or podman) is on the path',
    () => {
      for (const command of ['docker', 'podman']) {
        if (spawnSync(command, ['--version'], { stdio: 'ignore' }).status === 0) {
          return { ok: true, detail: `found ${command}` };
        }
      }
      return { ok: false, detail: 'install Docker or Podman' };
    },
  ],
  [
    `DynamoDB Local answers at ${endpoint}`,
    async () => {
      try {
        await client.send(new ListTablesCommand({}), { abortSignal: AbortSignal.timeout(3000) });
        return { ok: true, detail: 'reachable' };
      } catch {
        return { ok: false, detail: 'run "docker compose up -d" (or "podman compose up -d")' };
      }
    },
  ],
  [
    'Tables exist and Quizzes has items',
    async () => {
      try {
        const { TableNames = [] } = await client.send(new ListTablesCommand({}));
        const missing = [QUIZZES_TABLE, SUBMISSIONS_TABLE].filter((t) => !TableNames.includes(t));
        if (missing.length > 0)
          return { ok: false, detail: `missing ${missing.join(', ')}. Run "pnpm seed"` };
        const { Count = 0 } = await documentClient.send(
          new ScanCommand({ TableName: QUIZZES_TABLE, Limit: 1 }),
        );
        return Count > 0
          ? { ok: true, detail: 'found' }
          : { ok: false, detail: 'Quizzes is empty. Run "pnpm seed"' };
      } catch {
        return { ok: false, detail: 'could not read DynamoDB Local' };
      }
    },
  ],
];

let failed = false;
for (const [name, run] of checks) {
  const { ok, detail } = await run();
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} (${detail})`);
  if (!ok) failed = true;
}
process.exit(failed ? 1 : 0);
