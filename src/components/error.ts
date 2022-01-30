import BaseMessageEmbed from './base';

/**
 * embed sent when any error occured with the bot.
 */
export default class ErrorMessageEmbed extends BaseMessageEmbed {
  constructor(description: string, error?: unknown) {
    super({
      title: 'エラー',
      description,
      fields:
        error instanceof Error
          ? [{ name: '理由', value: error.message }]
          : undefined,
    });
  }
}
