import readenv from '@cm-ayf/readenv';

if (process.env.NODE_ENV !== 'production')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();

/**
 * environment variables that are in use; always load from here
 */
export const env = readenv({
  BOT_TOKEN: {},
  production: {
    from: 'NODE_ENV',
    default: false,
    parse: (s) => s === 'production',
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type COR_Args<T> = T extends (...args: any) => any ? Parameters<T> : never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type COR_Return<T> = T extends (...args: any) => any ? ReturnType<T> : T;

export function CallOrReturn<T>(val: T, ...args: COR_Args<T>): COR_Return<T> {
  return typeof val === 'function' ? val(...(args as unknown[])) : val;
}
