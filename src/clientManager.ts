import { env } from './utils';
import ClientManager from './classes/client';

export const clientManager = new ClientManager(
  env.BOT_TOKEN,
  env.SECONDARY_BOT_TOKEN
);
