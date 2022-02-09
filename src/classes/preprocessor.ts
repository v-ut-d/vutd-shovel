import { Collection } from 'discord.js';
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
      .replace(...this.#guildEmojiReplacer)
      .replace(...UNICODE_EMOJI_REPLACER)
      .replace(...ENGLISH_WORD_REPLACER)
      .replace(...WARA_REPLACER)
      .replace(...OMIT_REPLACER);
  }
}
