import readenv from '@cm-ayf/readenv';

if (process.env.NODE_ENV !== 'production')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();

function assertsStringArray(target: unknown): asserts target is string[] {
  if (!Array.isArray(target) || !target.every((t) => typeof t === 'string'))
    throw new Error('not a string[]');
}

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
        assertsStringArray(parsed);
        return parsed;
      } catch (e) {
        console.error(e);
        return [];
      }
    },
  },
  production: {
    from: 'NODE_ENV',
    default: false,
    parse: (s) => s === 'production',
  },
});
