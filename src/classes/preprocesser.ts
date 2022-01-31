import { normalizeDiacritics } from 'normalize-text';
import { Room } from '.';
import alkana from '../../alkana.json';

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
    return normalizeDiacritics(content)
      .replace(/<:(.+?):\d{18}>/g, ':$1:')
      .replace(/[a-z]+/gi, (str) =>
        // 'as' assertion; `str in alkana` guarantees this
        str in alkana ? alkana[str as keyof typeof alkana] : str
      )
      .replace(
        // eslint-disable-next-line no-irregular-whitespace
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}(\/[^\s　]*)?/g,
        'URL省略\n'
      );
  }
}
