import type { Room } from '../classes';
import BaseMessageEmbed from './base';

/**
 * embed sent when the bot ends reading.
 */
export default class EndMessageEmbed extends BaseMessageEmbed {
  constructor(room: Room, descprefix?: string) {
    super({
      title: '読み上げ終了',
      description: (descprefix ?? '') + '読み上げを終了します。',
      fields: [
        {
          name: 'ボイスチャンネル',
          value: `${room.voiceChannel}`,
        },
        ...[room.textChannel].map((tc) => ({
          name: 'テキストチャンネル',
          value: `${tc}`,
          inline: true,
        })),
      ],
    });
  }
}
