import readenv from '@cm-ayf/readenv';
import { Base, Client } from 'discord.js';
import dotenv from 'dotenv';
import Room from './classes/room';

dotenv.config();

export const env = readenv({
  BOT_TOKEN: {},
  GUILD_ID: {},
  DEBUG_VC_ID: { default: null },
  DEBUG_TC_ID: { default: null },
  production: {
    from: 'NODE_ENV',
    default: false,
    parse: (s) => s === 'production',
  },
});

export function getClient(base: Base | Client) {
  return 'client' in base ? base.client : base;
}

export async function getGuild(base: Base | Client) {
  return getClient(base).guilds.fetch(env.GUILD_ID);
}

export async function getDebugRoom(base: Base | Client) {
  const guild = await getGuild(base);
  const voice = env.DEBUG_VC_ID
    ? await guild.channels.fetch(env.DEBUG_VC_ID)
    : null;
  const text = env.DEBUG_TC_ID
    ? await guild.channels.fetch(env.DEBUG_TC_ID)
    : null;
  if (!voice?.isVoice()) throw new Error('invalid DEBUG_VC_ID');
  if (!text?.isText()) throw new Error('invalid DEBUG_VC_ID');
  return new Room(voice, text);
}
