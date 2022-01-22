import readenv from '@cm-ayf/readenv';
import { Base, Client, Guild } from 'discord.js';
import Room from './classes/room';

if (process.env.NODE_ENV !== 'production')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();

/**
 * environment variables that are in use; always load from here
 */
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

function getClient(base: Base | Client) {
  return 'client' in base ? base.client : base;
}

/**
 * gets {@link Guild} with env.GUILD_ID.
 * @param base almost any discord.js class fits here.
 */
export async function getGuild(base: Base | Client): Promise<Guild> {
  return getClient(base).guilds.fetch(env.GUILD_ID);
}

/**
 * gets {@link Room} from env.DEBUG_TC_ID and env.DEBUG_VC_ID.
 * @param base almost any discord.js class fits here.
 */
export async function getDebugRoom(base: Base | Client): Promise<Room> {
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
