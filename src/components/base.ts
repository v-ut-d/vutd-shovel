import { APIEmbed, EmbedBuilder } from 'discord.js';

/**
 * @abstract
 * base abstract class for any embed sent by this bot.
 * give `super` additional {@link MessageEmbedOptions}.
 */
export default abstract class BaseMessageEmbed extends EmbedBuilder {
  constructor(data: APIEmbed) {
    super({
      color: 0x798fda,
      ...data,
    });
  }
}
