import path from 'path';
import { SpeakerOptions } from '../classes';
import BaseMessageEmbed from './base';

/**
 * embed sent when user gets or sets voice setting.
 */
export default class VoiceMessageEmbed extends BaseMessageEmbed {
  constructor(type: 'get' | 'set', options: SpeakerOptions) {
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
      fields: [
        {
          name: '声質',
          value: path.basename(options.htsvoice).replace(/\..*?$/, ''),
        },
        {
          name: '声の高さ',
          value: options.tone.toFixed(2),
          inline: true,
        },
        {
          name: '声の速さ',
          value: options.speed.toFixed(2),
          inline: true,
        },
        {
          name: '声の抑揚',
          value: options.f0.toFixed(2),
          inline: true,
        },
      ],
    });
  }
}
