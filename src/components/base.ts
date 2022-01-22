import { MessageEmbed, MessageEmbedOptions } from 'discord.js';

/**
 * @abstract
 * base abstract class for any embed sent by this bot.
 * give `super` additional {@link MessageEmbedOptions}.
 */
export default abstract class BaseMessageEmbed extends MessageEmbed {
  constructor(data: MessageEmbedOptions) {
    super({
      color: '#798fda',
      ...data,
    });
  }
}
