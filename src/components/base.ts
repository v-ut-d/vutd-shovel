import { MessageEmbed, MessageEmbedOptions } from 'discord.js';

export default abstract class BaseMessageEmbed extends MessageEmbed {
  constructor(data: MessageEmbedOptions) {
    super({
      color: '#798fda',
      ...data,
    });
  }
}
