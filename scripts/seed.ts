// scripts/seed.ts
import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export type SeedContext = {
  USERS: number;
  LABELS: number;
  TASKS: number;
  COMPLETIONS: number;
  BADGES: number;
  USER_BADGES: number;
  NOTIFICATIONS: number;
  MESSAGES: number;
  TASK_STATUS_LOGS: number;
  RANDOM_SEED: string;
};

function n(name: string, def = 0) {
  const v = process.env[name];
  return v === undefined || v === '' ? def : Number(v);
}

function buildContext(): SeedContext {
  return {
    USERS: n('E2E_USERS', 3),
    LABELS: n('E2E_LABELS', 1),
    TASKS: n('E2E_TASKS', 5),
    COMPLETIONS: n('E2E_COMPLETIONS', 1),
    BADGES: n('E2E_BADGES', 2),
    USER_BADGES: n('E2E_USER_BADGES', 1),
    NOTIFICATIONS: n('E2E_NOTIFICATIONS', 1),
    MESSAGES: n('E2E_MESSAGES', 1),
    TASK_STATUS_LOGS: n('E2E_TASK_STATUS_LOGS', 0),
    RANDOM_SEED: process.env.E2E_SEED ?? 'e2e',
  };
}

export default async function runSeed() {
  const isTest = process.env.NODE_ENV === 'test';
  const url = process.env.DB_URL;
  if (!url) throw new Error('DB_URL is required (.env.e2e)');

  const ds = new DataSource({
    type: 'postgres',
    url,
    entities: ['src/**/*.entity{.ts,.js}'],
    ssl: isTest ? false : undefined,
  });

  await ds.initialize();

  const MIGR_TABLES = new Set(['migrations', 'typeorm_migrations']);
  const tables = ds.entityMetadatas
    .map((m) => `"${m.schema ?? 'public'}"."${m.tableName}"`)
    .filter((t) => !MIGR_TABLES.has(t.replace(/.*\."([^"]+)"$/, '$1')));

  if (tables.length) {
    await ds.query(`TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE;`);
  }

  const ctx = buildContext();
  const dir = path.resolve(process.cwd(), 'test', 'seeds');
  if (fs.existsSync(dir)) {
    const files = fs
      .readdirSync(dir)
      .filter((f) => /\.seed\.(ts|js)$/.test(f))
      .sort();
    for (const f of files) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(path.join(dir, f));
      const fn: (ds: DataSource, ctx: SeedContext) => Promise<void> =
        mod.default || mod.seed;
      if (typeof fn === 'function') {
        console.log(`[seed] run ${f}`);
        await fn(ds, ctx);
      }
    }
  }

  await ds.destroy();
  console.log('[seed] done');
}

// node -r ts-node/register scripts/seed.ts
if (require.main === module) {
  runSeed().catch((e) => {
    console.error('[seed] failed:', e);
    process.exit(1);
  });
}
