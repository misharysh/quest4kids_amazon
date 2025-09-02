import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';

export async function makeBearerToken(ds: DataSource) {
  const user = await ds.query('select id, email, role from "user" limit 1;');
  if (!user?.[0]) throw new Error('No users in DB. Seed first.');
  const payload: any = {
    sub: user[0].id,
    email: user[0].email,
    role: user[0].role,
  };
  const jwt = new JwtService({ secret: process.env.JWT_SECRET || 'quest4kids' });
  return jwt.sign(payload, { expiresIn: process.env.JWT_EXPIRES_IN || '60m' });
}

/** Сгенерировать токен на конкретного пользователя, с возможной подменой роли (по умолчанию 'admin'). */
export async function makeBearerTokenFor(ds: DataSource, userId: string, role = 'admin') {
  const user = await ds.query('select id, email from "user" where id = $1 limit 1;', [userId]);
  if (!user?.[0]) throw new Error('User not found for token');
  const payload: any = { sub: user[0].id, email: user[0].email, role };
  const jwt = new JwtService({ secret: process.env.JWT_SECRET || 'quest4kids' });
  return jwt.sign(payload, { expiresIn: process.env.JWT_EXPIRES_IN || '60m' });
}

export function correlationHeaders() {
  const id = `e2e-${Date.now()}`;
  return {
    'x-correlation-id': id,
    'x-trace-id': id,
  };
}
