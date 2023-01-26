import readenv from '@cm-ayf/readenv';

if (process.env.NODE_ENV !== 'production')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();

/**
 * environment variables that are in use; always load from here
 */
export const env = readenv({
  BOT_TOKEN: {},
  VOICEVOX_URL: {
    default: 'http://127.0.0.1:50021',
  },
  MAX_CONCURRENCY: {
    default: 1,
  },
  production: {
    from: 'NODE_ENV',
    default: false,
    parse: (s) => s === 'production',
  },
});
