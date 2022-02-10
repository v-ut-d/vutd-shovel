import BaseMessageEmbed from './base';

/**
 * embed sent when user gets or sets voice setting.
 */
export default class EmojiBulkMessageEmbed extends BaseMessageEmbed {
  constructor(type: 'import-request');
  constructor(type: 'import-complete' | 'export' | 'keys', rows: number);
  constructor(
    type: 'import-request' | 'import-complete' | 'export' | 'keys',
    rows?: number
  ) {
    let description: string;
    switch (type) {
      case 'import-request':
        description = `\
サーバー絵文字辞書をインポートします。
5分以内にテキストファイルを添付したメッセージを送付してください。
テキストファイルの各行は\`<:alias:(id: 18 digits)>, 読み\`である必要があります。
複数のファイルを添付した場合、結合されたものが使用されます。`;
        break;
      case 'import-complete':
        description = 'サーバー絵文字をインポートしました。';
        break;
      case 'export':
        description = 'サーバー絵文字辞書を出力します。';
        break;
      case 'keys':
        description = `\
サーバー絵文字辞書に含まれていない絵文字の一覧を出力します。
各行は\`<:alias:(id: 18 digits)>, \`となっています。
それぞれの行の末尾に読みを付け足して保存し、 \`/emoji-bulk import\` してください。`;
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
