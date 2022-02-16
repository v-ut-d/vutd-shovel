import type { GuildSettings } from '@prisma/client';
import BaseMessageEmbed from './base';

/**
 * embed sent when user gets or sets guild setting.
 */
export default class SettingMessageEmbed extends BaseMessageEmbed {
  constructor(
    type: 'get' | 'set',
    setting: GuildSettings,
    dictRoleName: string,
    numberOfEmojis: number,
    numberOfDictEntries: number
  ) {
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
          value: setting.readMultiLine ? 'ON' : 'OFF',
        },
        {
          name: '名前読み上げ',
          value: setting.readSpeakersName ? 'ON' : 'OFF',
        },
        {
          name: '絵文字読み上げ',
          value: setting.readEmojis ? 'ON' : 'OFF',
        },
        {
          name: '読み上げ文字数上限',
          value: setting.omitThreashold.toString(),
        },
        {
          name: '辞書書き込みロール',
          value: dictRoleName,
        },
        {
          name: '登録絵文字数',
          value: numberOfEmojis.toString(),
        },
        {
          name: '登録単語数',
          value: numberOfDictEntries.toString(),
        },
      ],
    });
  }
}
