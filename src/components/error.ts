import BaseMessageEmbed from './base';

export default class ErrorMessageEmbed extends BaseMessageEmbed {
  constructor(description: string, reason?: string) {
    super({
      title: 'エラー',
      description,
      fields: reason ? [{ name: '理由', value: reason }] : undefined,
    });
  }
}
