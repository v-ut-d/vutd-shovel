import type { APIEmbedField } from 'discord.js';
import BaseMessageEmbed from './base';

/**
 * embed sent when user gets or sets voice setting.
 */
export default class VoiceMessageEmbed extends BaseMessageEmbed {
  constructor(type: 'get' | 'set', fields: APIEmbedField[]) {
    let description: string;
    switch (type) {
      case 'get':
        description = '現在の読み上げ設定は以下の通りです：';
        break;
      case 'set':
        description = '読み上げ設定を以下のように変更しました：';
        break;
    }
    super({
      title: '読み上げ設定',
      description,
      fields,
    });
  }
}
