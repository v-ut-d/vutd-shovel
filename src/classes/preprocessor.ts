import type { Room } from '.';
import alkana from '../../data/alkana.json';
import emoji from '../../data/emoji.json';
import { prisma } from '../database/prisma';

const TO_BE_ESCAPED = '\\*+.?{}()[]^$-|/';

const URL_REPLACER = [
  // eslint-disable-next-line no-irregular-whitespace
  /https?:\/\/[^\s　]*/g,
  'URL省略\n',
] as const;

const GUILD_EMOJI_REPLACER = (dict: Map<string, string>) =>
  [
    /<:(.+?):(\d{18})>/g,
    (emoji: string, name: string, id: string) => dict.get(id) ?? `:${name}:`,
  ] as const;

const UNICODE_EMOJI_REPLACER = [
  new RegExp(
    Object.keys(emoji)
      .map((s) => (TO_BE_ESCAPED.includes(s) ? `\\${s}` : s))
      .join('|'),
    'g'
  ),
  // 'as' assertion; regexp above guarantees this
  (str: string) => emoji[str as keyof typeof emoji],
] as const;

const ENGLISH_WORD_REPLACER = [
  /([a-z]+) ?/gi,
  // 'as' assertion; `str in alkana` guarantees this
  (_: unknown, str: string) =>
    str in alkana ? alkana[str as keyof typeof alkana] : str,
] as const;

const WARA_REPLACER = [
  /(?<!\w)w+(?!\w)/gi,
  (str: string) => (str.length > 1 ? 'わらわら' : 'わら'),
] as const;

const OMIT_REPLACER = [/^(.{100}).+$/s, '$1\n以下略'] as const;

/**
 * Preprocessor that is used before Open JTalk synthesizes voice.
 * one will be created when {@link Room}
 */
export default class Preprocessor {
  private GuildEmojiDict = new Map<string, string>();

  constructor(public readonly room: Room) {
    this.loadEmojiDict().catch((e) => console.error(e));
  }

  /**
   * (Re)Loads emoji dictionary.
   * Call this method when the dictionary is updated.
   *
   * @memberof Preprocessor
   */
  public async loadEmojiDict() {
    const emojis = await prisma.emoji.findMany({
      where: {
        guildId: this.room.guildId,
      },
    });
    this.GuildEmojiDict.clear();
    emojis.forEach((emoji) => {
      this.GuildEmojiDict.set(emoji.emojiId, emoji.pronounciation);
    });
  }

  /**
   * preprocesses the string.
   */
  exec(content: string): string {
    return content
      .replace(...URL_REPLACER)
      .replace(...GUILD_EMOJI_REPLACER(this.GuildEmojiDict))
      .replace(...UNICODE_EMOJI_REPLACER)
      .replace(...ENGLISH_WORD_REPLACER)
      .replace(...WARA_REPLACER)
      .replace(...OMIT_REPLACER);
  }
}
