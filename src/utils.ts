import readenv from '@cm-ayf/readenv';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') dotenv.config();
/**
 * environment variables that are in use; always load from here
 */
export const env = (readenv as unknown as { default: typeof readenv }).default({
  BOT_TOKEN: {},
  production: {
    from: 'NODE_ENV',
    default: false,
    parse: (s) => s === 'production',
  },
});
