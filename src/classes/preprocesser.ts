import { Room } from '.';

/**
 * Preprocesser that is used before Open JTalk synthesizes voice.
 * one will be created when {@link Room}
 */
export default class Preprocesser {
  constructor(public readonly room: Room) {}

  /**
   * preprocesses the string.
   */
  exec(content: string): string {
    return content.replace(/<:(.+?):\d{18}>/, ':$1:').replace(
      // eslint-disable-next-line no-irregular-whitespace
      /https?:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+/g,
      'URL省略\n'
    );
  }
}
