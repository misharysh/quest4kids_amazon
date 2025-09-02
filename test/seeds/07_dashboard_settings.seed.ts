import { DataSource } from 'typeorm';
import { DashboardSettings } from '../../src/dashboardSettings/dashboard-settings.entity';
import { User } from '../../src/users/user.entity';

function defaultLayout() {
  return {
    version: 1,
    widgets: [
      { key: 'points', x: 0, y: 0, w: 6, h: 2 },
      { key: 'tasks', x: 6, y: 0, w: 6, h: 4 },
    ],
  };
}

export default async function seedDashboard(ds: DataSource) {
  const repo = ds.getRepository(DashboardSettings);
  const uRepo = ds.getRepository(User);

  const rels = repo.metadata.relations.map((r) => r.propertyName);
  const cols = repo.metadata.columns.map((c) => c.propertyName);

  const users = await uRepo.find();
  if (!users.length) {
    console.log('[seed/dashboard] skipped (no users)');
    return;
  }

  const items: any[] = [];
  for (const u of users) {
    const s: any = {};

    if (rels.includes('user')) s.user = u;
    else if (cols.includes('userId')) s.userId = (u as any).id;

    if (cols.includes('layout')) s.layout = defaultLayout();
    // на всякий (если в entity другое имя)
    else if (cols.includes('config')) s.config = defaultLayout();
    else if (cols.includes('settings')) s.settings = defaultLayout();

    if (cols.includes('theme')) s.theme = 'light';
    if (cols.includes('language')) s.language = 'en';
    if (cols.includes('createdAt')) s.createdAt = new Date();
    if (cols.includes('updatedAt')) s.updatedAt = new Date();

    items.push(s);
  }

  await repo.save(items);
  console.log(`[seed/dashboard] inserted: ${items.length}`);
}
