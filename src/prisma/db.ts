import 'dotenv/config';
import 'temporal-polyfill/global';
if (!('Temporal' in globalThis)) {
  import('@js-temporal/polyfill').then(({ Temporal }) => {
    (globalThis as Record<string, unknown>).Temporal = Temporal;
  }).catch(() => {});
}
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const contractJson = require('./contract.json') as unknown;

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});
