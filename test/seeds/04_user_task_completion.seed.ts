import { DataSource } from 'typeorm';
import { SeedContext } from '../../scripts/seed';
import { UserTaskCompletion } from '../../src/users/user-task-completion.entity';
import { User } from '../../src/users/user.entity';
import { Task } from '../../src/tasks/task.entity';

export default async function seedCompletions(
  ds: DataSource,
  ctx: SeedContext,
) {
  const count = ctx.COMPLETIONS;
  if (!count) return;

  const repo = ds.getRepository(UserTaskCompletion);
  const userRepo = ds.getRepository(User);
  const taskRepo = ds.getRepository(Task);
  const cols = repo.metadata.columns.map((c) => c.propertyName);
  const rels = repo.metadata.relations.map((r) => r.propertyName);

  const users = await userRepo.find();
  const tasks = await taskRepo.find();
  if (!users.length || !tasks.length) return;

  const items: any[] = [];
  for (let i = 0; i < Math.min(count, tasks.length); i++) {
    const u = users[i % users.length];
    const t = tasks[i];
    const c: any = {};
    if (rels.includes('user')) c.user = u;
    if (rels.includes('task')) c.task = t;
    if (cols.includes('completedAt')) c.completedAt = new Date();
    if (cols.includes('isCompleted')) c.isCompleted = true;
    items.push(c);
  }
  await repo.save(items);
  console.log(`[seed/completions] inserted: ${items.length}`);
}
