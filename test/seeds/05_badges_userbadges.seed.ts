import { DataSource } from 'typeorm';
import { SeedContext } from '../../scripts/seed';
import { Badge } from '../../src/badges/badge.entity';
import { UserBadge } from '../../src/badges/user-badge.entity';
import { User } from '../../src/users/user.entity';
import { getEnumTypeName, getEnumValues } from './_utils';

export default async function seedBadges(ds: DataSource, ctx: SeedContext) {
  const badgeRepo = ds.getRepository(Badge);
  const userBadgeRepo = ds.getRepository(UserBadge);
  const userRepo = ds.getRepository(User);

  const bCols = badgeRepo.metadata.columns.map((c) => c.propertyName);
  const tableName = badgeRepo.metadata.tableName;
  const countB = ctx.BADGES;

  let labelValues: string[] = [];
  if (bCols.includes('label')) {
    const enumName = await getEnumTypeName(ds, tableName, 'label');
    if (enumName) {
      labelValues = await getEnumValues(ds, enumName);
    }
  }

  const badges: any[] = [];
  for (let i = 0; i < countB; i++) {
    const b: any = {};
    if (bCols.includes('name')) b.name = `E2E Badge ${i + 1}`;
    if (bCols.includes('requiredPoints')) b.requiredPoints = (i + 1) * 10;

    if (bCols.includes('label') && labelValues.length) {
      b.label = labelValues[i % labelValues.length];
    }

    badges.push(b);
  }

  if (badges.length) {
    await badgeRepo.save(badges);
    console.log(`[seed/badges] inserted: ${badges.length}`);
  } else {
    console.log('[seed/badges] skipped (BADGES=0)');
  }

  const countUB = ctx.USER_BADGES;
  if (!countUB) {
    console.log('[seed/user_badges] skipped (USER_BADGES=0)');
    return;
  }

  const users = await userRepo.find();
  const allBadges = await badgeRepo.find();
  if (!users.length || !allBadges.length) {
    console.log('[seed/user_badges] skipped (no users or badges)');
    return;
  }

  const ubCols = userBadgeRepo.metadata.columns.map((c) => c.propertyName);
  const ubRels = userBadgeRepo.metadata.relations.map((r) => r.propertyName);

  const ubItems: any[] = [];
  for (let i = 0; i < countUB; i++) {
    const user = users[i % users.length];
    const badge = allBadges[i % allBadges.length];

    const ub: any = {};
    if (ubRels.includes('user')) ub.user = user;
    if (ubRels.includes('badge')) ub.badge = badge;

    if (!ub.user && ubCols.includes('userId')) ub.userId = (user as any).id;
    if (!ub.badge && ubCols.includes('badgeId')) ub.badgeId = (badge as any).id;

    for (const dt of ['awardedAt', 'assignedAt', 'createdAt']) {
      if (ubCols.includes(dt)) {
        ub[dt] = new Date();
        break;
      }
    }

    ubItems.push(ub);
  }

  if (ubItems.length) {
    await userBadgeRepo.save(ubItems);
    console.log(`[seed/user_badges] inserted: ${ubItems.length}`);
  }
}
