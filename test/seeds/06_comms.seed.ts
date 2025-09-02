import { DataSource } from 'typeorm';
import { SeedContext } from '../../scripts/seed';
import { Notification } from '../../src/notifications/notification.entity';
import { Message } from '../../src/messages/message.entity';
import { User } from '../../src/users/user.entity';
import { getEnumTypeName, getEnumValues } from './_utils';

export default async function seedComms(ds: DataSource, ctx: SeedContext) {
  const nCount = ctx.NOTIFICATIONS;
  const mCount = ctx.MESSAGES;

  const uRepo = ds.getRepository(User);
  const users = await uRepo.find();
  if (!users.length) {
    console.log('[seed/comms] skipped (no users)');
    return;
  }

  if (nCount) {
    const nRepo = ds.getRepository(Notification);
    const nCols = nRepo.metadata.columns.map((c) => c.propertyName);
    const nRels = nRepo.metadata.relations.map((r) => r.propertyName);
    const nTable = nRepo.metadata.tableName;

    let typeVal: string | undefined;
    if (nCols.includes('type')) {
      const enumName = await getEnumTypeName(ds, nTable, 'type');
      if (enumName) {
        const vals = await getEnumValues(ds, enumName);
        if (vals.length) typeVal = vals[0];
      }
    }

    const nItems: any[] = [];
    for (let i = 0; i < nCount; i++) {
      const user = users[i % users.length];
      const n: any = {};

      if (nRels.includes('user')) n.user = user;
      else if (nCols.includes('userId')) n.userId = (user as any).id;

      if (nCols.includes('message'))
        n.message = `Seeded notification #${i + 1}`;
      else if (nCols.includes('body')) n.body = `Seeded notification #${i + 1}`;
      else if (nCols.includes('content'))
        n.content = `Seeded notification #${i + 1}`;
      else if (nCols.includes('text')) n.text = `Seeded notification #${i + 1}`;

      // доп. поля, если есть
      if (nCols.includes('title')) n.title = `Notice ${i + 1}`;
      if (typeVal !== undefined) n.type = typeVal;
      if (nCols.includes('isRead')) n.isRead = false;
      if (nCols.includes('createdAt')) n.createdAt = new Date();

      nItems.push(n);
    }
    await nRepo.save(nItems);
    console.log(`[seed/notifications] inserted: ${nItems.length}`);
  } else {
    console.log('[seed/notifications] skipped (NOTIFICATIONS=0)');
  }

  if (mCount && users.length >= 2) {
    const mRepo = ds.getRepository(Message);
    const mCols = mRepo.metadata.columns.map((c) => c.propertyName);
    const mRels = mRepo.metadata.relations.map((r) => r.propertyName);

    const mItems: any[] = [];
    for (let i = 0; i < mCount; i++) {
      const sender = users[i % users.length];
      const receiver = users[(i + 1) % users.length];
      const msg: any = {};

      if (mRels.includes('sender')) msg.sender = sender;
      else if (mCols.includes('senderId')) msg.senderId = (sender as any).id;

      if (mRels.includes('receiver')) msg.receiver = receiver;
      else if (mCols.includes('receiverId'))
        msg.receiverId = (receiver as any).id;

      if (mCols.includes('content')) msg.content = `Hello ${i + 1}`;
      else if (mCols.includes('text')) msg.text = `Hello ${i + 1}`;
      else if (mCols.includes('message')) msg.message = `Hello ${i + 1}`;

      if (mCols.includes('isRead')) msg.isRead = false;
      if (mCols.includes('createdAt')) msg.createdAt = new Date();

      mItems.push(msg);
    }
    await mRepo.save(mItems);
    console.log(`[seed/messages] inserted: ${mItems.length}`);
  } else if (mCount) {
    console.log('[seed/messages] skipped (need at least 2 users)');
  }
}
