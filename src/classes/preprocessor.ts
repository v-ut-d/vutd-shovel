import { Collection } from 'discord.js';
import type { Room } from '.';
import { prisma } from '../database';
import alkana from '../data/alkana.json';
import emoji from '../data/emoji.json';

const TO_BE_ESCAPED = '\\*+.?{}()[]^$-|/';

const URL_REPLACER = [
  // eslint-disable-next-line no-irregular-whitespace
  /https?:\/\/[^\s　]*/g,
  'URL省略 ',
] as const;

const CODEBLOCK_REPLACER = [/```.*?```/gs, 'コードブロック '] as const;

const SPOILER_REPLACER = [/\|\|.*?\|\|/g, ' '] as const;

const GUILD_EMOJI_REPLACER = (dict: Collection<string, string>) =>
  [
    /<:(.+?):(\d{18})>/g,
    (_: unknown, name: string, id: string) => dict.get(id) ?? `:${name}:`,
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

const CAMEL_CASE_REPLACER = [/([a-z]+)(?=[A-Z])/g, '$1 '] as const;

const ENGLISH_WORD_REPLACER = [
  /([a-z]+)[ _-]?/gi,
  (_: unknown, str: string) => {
    str = str.toLowerCase();
    // 'as' assertion; `str in alkana` guarantees this
    return str in alkana ? alkana[str as keyof typeof alkana] : str;
  },
] as const;

const WARA_REPLACER = [
  /(?<!\w)w+(?!\w)/gi,
  (str: string) => (str.length > 1 ? 'わらわら' : 'わら'),
] as const;

const NEWLINE_SPACE_REPLACER = [/[\n\r\s]/g, ' '] as const;

const OMIT_REPLACER = [/^(.{100}).+$/s, '$1 以下略'] as const;

/**
 * Preprocessor that is used before Open JTalk synthesizes voice.
 * one will be created when {@link Room}
 */
export default class Preprocessor {
  #guildEmojiDict = new Collection<string, string>();
  #guildEmojiReplacer = GUILD_EMOJI_REPLACER(this.#guildEmojiDict);
  dictLoadPromise;

  constructor(readonly room: Room) {
    this.dictLoadPromise = this.loadEmojiDict();
  }

  /**
   * (Re)Loads emoji dictionary.
   * Call this method when the dictionary is updated.
   *
   * @memberof Preprocessor
   */
  async loadEmojiDict() {
    const emojis = await prisma.emoji.findMany({
      where: {
        guildId: this.room.guildId,
      },
    });
    this.#guildEmojiDict.clear();
    emojis.forEach((emoji) => {
      this.#guildEmojiDict.set(emoji.emojiId, emoji.pronounciation);
    });
  }

  /**
   * preprocesses the string.
   */
  exec(content: string): string {
    return content
      .replace(...URL_REPLACER)
      .replace(...CODEBLOCK_REPLACER)
      .replace(...SPOILER_REPLACER)
      .replace(...this.#guildEmojiReplacer)
      .replace(...UNICODE_EMOJI_REPLACER)
      .replace(...CAMEL_CASE_REPLACER)
      .replace(...ENGLISH_WORD_REPLACER)
      .replace(...WARA_REPLACER)
      .replace(...NEWLINE_SPACE_REPLACER)
      .replace(...OMIT_REPLACER);
  }
}
