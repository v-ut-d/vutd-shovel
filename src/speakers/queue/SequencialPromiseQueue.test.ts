import SequencialPromiseQueue from './SequencialPromiseQueue';

describe('Queue', () => {
  it('Sequence', async () => {
    const queue = new SequencialPromiseQueue();
    const fn = jest.fn();
    await Promise.all([
      queue.exec(async (end) => {
        expect(fn).toHaveBeenCalledTimes(0);
        fn();
        end();
      }),
      queue.exec(async (end) => {
        expect(fn).toHaveBeenCalledTimes(1);
        fn();
        end();
      }),
      queue.exec(async (end) => {
        expect(fn).toHaveBeenCalledTimes(2);
        fn();
        end();
      }),
    ]);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
