import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import runSeed from '../scripts/seed';

export default async function globalSetup() {
  const isTest = process.env.NODE_ENV === 'test';
  const url = process.env.DB_URL;
  if (!url) throw new Error('DB_URL is required for e2e');

  const ds = new DataSource({
    type: 'postgres',
    url,
    entities: ['src/**/*.entity{.ts,.js}'],
    migrations: ['src/migrations/*{.ts,.js}'],
    ssl: isTest ? false : undefined,
  });

  try {
    await ds.initialize();
    const applied = await ds.runMigrations();
    // eslint-disable-next-line no-console
    console.log(
      `[global-setup] migrations applied: ${applied.map((m) => m.name).join(', ') || 'none'}`,
    );
  } finally {
    await ds.destroy().catch(() => void 0);
  }

  if (process.env.E2E_CLEAN === '1' || process.env.E2E_SEED === '1') {
    await runSeed();
  }
}
