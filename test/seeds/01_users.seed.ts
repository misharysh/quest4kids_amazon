import { DataSource } from 'typeorm';
import { SeedContext } from '../../scripts/seed';
import { User } from '../../src/users/user.entity';
import * as bcrypt from 'bcrypt';

function detRand(seed: string) {
  let h = 2166136261 ^ seed.length;
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 0xffffffff;
  };
}

export default async function seedUsers(ds: DataSource, ctx: SeedContext) {
  const repo = ds.getRepository(User);
  const cols = repo.metadata.columns.map((c) => c.propertyName);
  const count = ctx.USERS;
  if (!count) return;

  const plain = process.env.E2E_PASSWORD ?? '123456';
  const hash = bcrypt.hashSync(plain, 10);

  const rnd = detRand(ctx.RANDOM_SEED);
  const items: any[] = [];
  for (let i = 0; i < count; i++) {
    const n = Math.floor(rnd() * 1e6);
    const u: any = {};
    if (cols.includes('email')) u.email = `e2e_user_${n}@test.local`;
    if (cols.includes('name')) u.name = `E2E User ${n}`;
    if (cols.includes('displayName')) u.displayName = `E2E User ${n}`;

    // ← критично: ставим ХЭШ в то поле, которое реально существует
    if (cols.includes('password')) u.password = hash;
    if (cols.includes('passwordHash')) u.passwordHash = hash;

    // не трогаем enum-роль — пусть БД подставит дефолт
    if (cols.includes('createdAt')) u.createdAt = new Date();
    if (cols.includes('updatedAt')) u.updatedAt = new Date();
    items.push(u);
  }

  await repo.save(items);
  console.log(`[seed/users] inserted: ${items.length} (password=${plain})`);
}
