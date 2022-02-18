import BaseMessageEmbed from './base';

/**
 * embed sent when the bot starts reading.
 */
export default class HelpMessageEmbed extends BaseMessageEmbed {
  constructor() {
    super({
      title: '使い方',
      description:
        '読み上げbotの使い方は以下の通りです。チャット欄にスラッシュ(/)を入力すると使えるコマンド一覧が現れます。',
      fields: [
        {
          name: '読み上げ開始 `/start`',
          value:
            'このコマンドが送信されたテキストチャンネルで発言されたメッセージを読み上げるようになります。',
        },
        {
          name: '読み上げ終了 `/end`',
          value:
            '読み上げbotがボイスチャンネルに接続している状態で使用します。ボイスチャンネルから切断し、読み上げを終了します。',
        },
        {
          name: '読み上げ中断 `/cancel`',
          value:
            'メッセージを読み上げている最中に使用します。今行われている読み上げを中断します。',
        },
        {
          name: '読み上げ設定 `/voice`',
          value:
            '読み上げbotがボイスチャンネルに接続している状態で使用します。自分のメッセージを読み上げる声の設定を取得・変更します',
        },
      ],
    });
  }
}
