import hello from './hello';

test('greet', () => {
  expect(hello('test')).toBe('Hello, test!');
});
