import Preprocessor from './preprocessor';

import Room from './room';
jest.mock('./room');
const RoomMock = Room as jest.Mock;

jest.mock('../database', () => {
  return {
    __esModule: true,
    prisma: {
      emoji: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    },
  };
});

const pillow =
  '春はあけぼの。やうやう白くなりゆく山ぎは、すこしあかりて、紫だちたる 雲のほそくたなびきたる。　夏は夜。月のころはさらなり。やみもなほ、蛍の多く飛びちがひたる。また、 ただ一つ二つなど、ほのかにうち光りて行くもをかし';

describe('Test Preprocessor', () => {
  const preprocessor = new Preprocessor(new RoomMock());

  it('Replaces English words to Katakana', () => {
    expect(preprocessor.exec('english word')).toBe('イングリッシュワード');
    expect(preprocessor.exec('Capitalized word')).toBe(
      'キャピタライズドワード'
    );
    expect(preprocessor.exec('typo ingored')).toBe('タイポingored');
  });

  it('Separate CamelCase', () => {
    expect(preprocessor.exec('CamelCase')).toBe('キャメルケイス');
    expect(preprocessor.exec('jsCamelCase')).toBe('jsキャメルケイス');
    expect(preprocessor.exec('CamleCsae')).toBe('camlecsae');
  });

  it('Separate snake_case', () => {
    expect(preprocessor.exec('snake_case')).toBe('スネイクケイス');
    expect(preprocessor.exec('snkae_csae')).toBe('snkaecsae');
  });

  it('Separate kebab-case', () => {
    expect(preprocessor.exec('kebab-case')).toBe('カバブケイス');
    expect(preprocessor.exec('kebba-csae')).toBe('kebbacsae');
  });

  it('Replace basic URLs', () => {
    expect(preprocessor.exec('http://example.com')).toBe('ユーアールエル省略 ');
    expect(preprocessor.exec('https://example.com/')).toBe(
      'ユーアールエル省略 '
    );
    expect(preprocessor.exec('https://example.com/abc?search=c&d=c')).toBe(
      'ユーアールエル省略 '
    );
    expect(preprocessor.exec('hogehttps://example.com/abc fuga')).toBe(
      'hogeユーアールエル省略  fuga'
    );
    expect(preprocessor.exec('hogehttps://example.com/abc\nfuga')).toBe(
      'hogeユーアールエル省略 \nfuga'
    );
  });

  it('Do not replace other protocols', () => {
    expect(preprocessor.exec('ftp://example.com')).toBe(
      'ftp:スラッシュスラッシュイグザンプル.コム'
    );
  });

  it('Replace Japanese URLs', () => {
    expect(preprocessor.exec('http://日本語.com/')).toBe('ユーアールエル省略 ');
    expect(preprocessor.exec('http://xn--wgv71a119e.com/')).toBe(
      'ユーアールエル省略 '
    );
  });

  it('Replace CodeBlocks', () => {
    expect(preprocessor.exec('```ts\nCodeBlock\n```')).toBe('コードブロック ');
    expect(preprocessor.exec('?```CodeBlock```?```AnotherCodeBlock```?')).toBe(
      '?コードブロック ?コードブロック ?'
    );
    expect(preprocessor.exec('?```CodeBlock\n``?```AnotherCodeBlock```?')).toBe(
      '?コードブロック アナザーコウドブロック```?'
    );
  });

  it('Replace Spoilers', () => {
    expect(preprocessor.exec('||Spoiler||')).toBe(' ');
    expect(preprocessor.exec('||\n?||')).toBe('パイプパイプ\n?パイプパイプ');
    expect(preprocessor.exec('||Spoiler||?||Spoiler||?')).toBe(' ? ?');
    expect(preprocessor.exec('||Spoiler|?||Spoiler||?')).toBe(
      ' スポイラーパイプパイプ?'
    );
  });

  it('Replace GUILD Emojis', () => {
    expect(preprocessor.exec('<:emoji:618391439964133143>')).toBe(':emoji:');
    expect(preprocessor.exec('This is an <:E:618391439964133143>moji')).toBe(
      'ジスイズアン:e:moji'
    );
  });

  it('Do not replace non-guild-emojis', () => {
    expect(preprocessor.exec('<:emojiR:18391439964133143>')).toBe(
      '小なり:emojir:18391439964133143大なり'
    );
    expect(preprocessor.exec(':emojiR:618391439964133143>')).toBe(
      ':emojir:618391439964133143大なり'
    );
    expect(preprocessor.exec('<:emojiR618391439964133143>')).toBe(
      '小なり:emojir618391439964133143大なり'
    );
    expect(preprocessor.exec('<:emojiR:618391439964133143')).toBe(
      '小なり:emojir:618391439964133143'
    );
  });

  it('Replace WARA', () => {
    expect(preprocessor.exec('w')).toBe('わら');
    expect(preprocessor.exec('わらw')).toBe('わらわら');
    expect(preprocessor.exec('わらww')).toBe('わらわらわら');
    expect(preprocessor.exec('わら ww')).toBe('わら わらわら');
    expect(preprocessor.exec('わらwwwwwwwwwwwwww')).toBe('わらわらわら');
    expect(preprocessor.exec('わら\nw')).toBe('わら\nわら');
  });

  it('Do not replace trap-WARA', () => {
    expect(preprocessor.exec('woow')).toBe('woow');
    expect(preprocessor.exec('whatw')).toBe('whatw');
  });

  it('Replace too long sentence', () => {
    expect(preprocessor.exec(pillow.substring(0, 100))).toBe(
      pillow.substring(0, 100)
    );
    expect(preprocessor.exec(pillow.substring(0, 101))).toBe(
      pillow.substring(0, 100) + ' 以下略'
    );
  });

  it('Replace too long sentence(with URL)', () => {
    const url = 'http://example.com ';
    expect(preprocessor.exec(url + pillow.substring(0, 89))).toBe(
      'ユーアールエル省略  ' + pillow.substring(0, 89)
    );
    expect(preprocessor.exec(url + pillow.substring(0, 90))).toBe(
      'ユーアールエル省略  ' + pillow.substring(0, 89) + ' 以下略'
    );
  });
});
