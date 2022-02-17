import { PrismaClient } from '@prisma/client';
import { env } from '../utils';

export const prisma = new PrismaClient({
  log: env.production ? [] : ['query', 'info', 'warn', 'error'],
});
