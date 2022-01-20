import readenv from '@cm-ayf/readenv';
import { Base, Client } from 'discord.js';

export const env = readenv({
  BOT_TOKEN: {},
  GUILD_ID: {},
});

export function getClient(base: Base | Client) {
  return 'client' in base ? base.client : base;
}

export async function getGuild(base: Base | Client) {
  return getClient(base).guilds.fetch(env.GUILD_ID);
}
