import { Room } from '../classes';
import BaseMessageEmbed from './base';

export default class StartMessageEmbed extends BaseMessageEmbed {
  constructor(room: Room) {
    super({
      title: '読み上げ開始',
      description: `${room.voiceChannel}に接続しました。${room.textChannel}のメッセージを読み上げます。`,
    });
  }
}
