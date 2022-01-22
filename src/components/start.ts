import { Room } from '../classes';
import BaseMessageEmbed from './base';

/**
 * embed sent when the bot starts reading.
 */
export default class StartMessageEmbed extends BaseMessageEmbed {
  constructor(room: Room) {
    super({
      title: '読み上げ開始',
      description:
        '読み上げを開始します。終了したい時は`/end`を実行してください。',
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
