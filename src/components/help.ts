import BaseMessageEmbed from './base';

/**
 * embed sent when the bot starts reading.
 */
export default class HelpMessageEmbed extends BaseMessageEmbed {
  constructor() {
    super({
      title: '使い方',
      description:
        'テキストチャンネルでの発言をボイスチャンネルで読み上げるbotです。\nチャット欄にスラッシュ(/)を入力するとコマンド一覧が現れます。',
      fields: [
        {
          name: '`/start` 読み上げ開始',
          value: 'テキストチャンネルでの発言を読み上げるようになります。',
        },
        {
          name: '`/end` 読み上げ終了',
          value:
            '読み上げbotをボイスチャンネルから切断し、読み上げを終了します。',
        },
        {
          name: '`/cancel` 読み上げ中断',
          value:
            '今行われている読み上げを中断します。メッセージを読み上げている最中に使用します。',
        },
        {
          name: '`/voice` 読み上げ設定',
          value: '自分のメッセージを読み上げる声の設定を取得・変更します。',
        },
      ],
    });
  }
}
