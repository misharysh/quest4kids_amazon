import { v4 as uuidv4 } from 'uuid';

export function generateUuidNoDashes(): string {
  // replaceAll('-', '') works in Node 20+, but in TypeScript may require lib ES2021. For full compatibility - replace(/-/g, '').
  return uuidv4().replace(/-/g, '');
}
