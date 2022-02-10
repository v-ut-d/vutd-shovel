import readenv from '@cm-ayf/readenv';
import type { Base, Client, Guild } from 'discord.js';

if (process.env.NODE_ENV !== 'production')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();

/**
 * environment variables that are in use; always load from here
 */
export const env = readenv({
  BOT_TOKEN: {},
  SECONDARY_BOT_TOKEN: {
    default: [] as string[],
    parse: (s) => {
      try {
        const parsed = JSON.parse(s);
        if (
          Array.isArray(parsed) &&
          parsed.every((t) => typeof t === 'string')
        ) {
          // 'as' assertion; parsed.every above guarantees this
          return parsed as string[];
        } else {
          return [];
        }
      } catch (e) {
        console.error(e);
        return [];
      }
    },
  },
  GUILD_ID: {},
  MANAGE_ID: {},
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
