import BaseMessageEmbed from './base';

/**
 * embed sent when user gets or sets voice setting.
 */
export default class DictMessageEmbed extends BaseMessageEmbed {
  constructor(
    type: 'get' | 'set' | 'delete',
    wordFrom: string,
    wordTo: string
  ) {
    let description: string;
    switch (type) {
      case 'get':
        description =
          `${wordFrom}は以下のように登録されています：\n` +
          `'${wordFrom}'->'${wordTo}'`;
        break;
      case 'set':
        description =
          '辞書を以下のように更新しました：\n' +
          `:white_check_mark:  '${wordFrom}'->'${wordTo}'`;
        break;
      case 'delete':
        description =
          '単語を削除しました：\n' + `:x:  ~~'${wordFrom}'->'${wordTo}'~~`;
    }
    super({
      title: '辞書設定',
      description,
    });
  }
}
