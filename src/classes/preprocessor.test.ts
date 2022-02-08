import Preprocessor from './preprocessor';
import Room from './room';
jest.mock('./room');

const RoomMock = Room as jest.Mock;

const pillow =
  '春はあけぼの。やうやう白くなりゆく山ぎは、すこしあかりて、紫だちたる 雲のほそくたなびきたる。　夏は夜。月のころはさらなり。やみもなほ、蛍の多く飛びちがひたる。また、 ただ一つ二つなど、ほのかにうち光りて行くもをかし';

describe('Test Preprocessor', () => {
  const preprocessor = new Preprocessor(new RoomMock());

  it('Replace basic URLs', () => {
    expect(preprocessor.exec('http://example.com')).toBe('URL省略\n');
    expect(preprocessor.exec('https://example.com/')).toBe('URL省略\n');
    expect(preprocessor.exec('https://example.com/abc?search=c&d=c')).toBe(
      'URL省略\n'
    );
    expect(preprocessor.exec('hogehttps://example.com/abc fuga')).toBe(
      'hogeURL省略\n fuga'
    );
    expect(preprocessor.exec('hogehttps://example.com/abc\nfuga')).toBe(
      'hogeURL省略\n\nfuga'
    );
  });

  it('Do not replace other protocols', () => {
    expect(preprocessor.exec('ftp://example.com')).toBe(
      'ftp:スラッシュスラッシュイグザンプル.コム'
    );
  });

  it('Replace Japanese URLs', () => {
    expect(preprocessor.exec('http://日本語.com/')).toBe('URL省略\n');
    expect(preprocessor.exec('http://xn--wgv71a119e.com/')).toBe('URL省略\n');
  });

  it('Replace GUILD Emojis', () => {
    expect(preprocessor.exec('<:emoji:618391439964133143>')).toBe(':emoji:');
    expect(preprocessor.exec('This is an <:E:618391439964133143>moji')).toBe(
      'Thisイズアン:E:moji'
    );
  });

  it('Do not replace non-guild-emojis', () => {
    expect(preprocessor.exec('<:emojiR:18391439964133143>')).toBe(
      '小なり:emojiR:18391439964133143大なり'
    );
    expect(preprocessor.exec(':emojiR:618391439964133143>')).toBe(
      ':emojiR:618391439964133143大なり'
    );
    expect(preprocessor.exec('<:emojiR618391439964133143>')).toBe(
      '小なり:emojiR618391439964133143大なり'
    );
    expect(preprocessor.exec('<:emojiR:618391439964133143')).toBe(
      '小なり:emojiR:618391439964133143'
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
      pillow.substring(0, 100) + '\n以下略'
    );
  });

  it('Replace too long sentence(with URL)', () => {
    const url = 'http://example.com ';
    expect(preprocessor.exec(url + pillow.substring(0, 93))).toBe(
      'URL省略\n ' + pillow.substring(0, 93)
    );
    // expect(preprocessor.exec(url + pillow.substring(0, 94))).toBe(
    //   'URL省略\n ' + pillow.substring(0, 93) + '\n以下略'
    // );
  });
});
