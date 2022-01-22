import { Room } from '../classes';
import BaseMessageEmbed from './base';

export default class EndMessageEmbed extends BaseMessageEmbed {
  constructor(room: Room) {
    super({
      title: '読み上げ終了',
      description: '読み上げを終了します。',
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
