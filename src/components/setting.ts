import type { GuildSettings } from '@prisma/client';
import BaseMessageEmbed from './base';

export interface SettingMessageEmbedData {
  setting: GuildSettings;
  numberOfEmojis: number;
  numberOfDictEntries: number;
}

/**
 * embed sent when user gets or sets guild setting.
 */
export default class SettingMessageEmbed extends BaseMessageEmbed {
  constructor(type: 'get' | 'set', data: SettingMessageEmbedData) {
    let description: string;
    switch (type) {
      case 'get':
        description = '現在のサーバー設定は以下の通りです：';
        break;
      case 'set':
        description = 'サーバー設定を以下のように変更しました：';
        break;
    }
    super({
      title: 'サーバー設定',
      description,
      fields: [
        {
          name: '複数行読み上げ',
          value: data.setting.readMultiLine ? 'ON' : 'OFF',
          inline: true,
        },
        {
          name: '名前読み上げ',
          value: data.setting.readSpeakersName ? 'ON' : 'OFF',
          inline: true,
        },
        {
          name: '絵文字読み上げ',
          value: data.setting.readEmojis ? 'ON' : 'OFF',
          inline: true,
        },
        {
          name: '読み上げ文字数上限',
          value: data.setting.omitThreshold.toString(),
          inline: true,
        },
        {
          name: '登録絵文字数',
          value: data.numberOfEmojis.toString(),
          inline: true,
        },
        {
          name: '登録単語数',
          value: data.numberOfDictEntries.toString(),
          inline: true,
        },
      ],
    });
  }
}
