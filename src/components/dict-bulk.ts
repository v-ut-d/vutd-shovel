import BaseMessageEmbed from './base';

/**
 * embed sent when user gets or sets voice setting.
 */
export default class DictBulkMessageEmbed extends BaseMessageEmbed {
  constructor(type: 'import-request');
  constructor(type: 'import-complete' | 'export', rows: number);
  constructor(
    type: 'import-request' | 'import-complete' | 'export',
    rows?: number
  ) {
    let description: string;
    switch (type) {
      case 'import-request':
        description = `\
サーバー単語辞書をインポートします。
5分以内にテキストファイルを添付したメッセージを送付してください。
テキストファイルの各行は\`<:alias:(id: 18 digits)>, 読み\`である必要があります。
複数のファイルを添付した場合、結合されたものが使用されます。`;
        break;
      case 'import-complete':
        description =
          'サーバー単語をインポートしました。インポート前のサーバー辞書を添付します。';
        break;
      case 'export':
        description = 'サーバー単語辞書を出力します。';
        break;
    }
    super({
      title: '辞書設定',
      description,
      fields:
        rows !== undefined
          ? [
              {
                name: '行数',
                value: rows.toString(),
              },
            ]
          : [],
    });
  }
}
