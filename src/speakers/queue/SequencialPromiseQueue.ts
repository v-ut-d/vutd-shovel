export default class SequencialPromiseQueue {
  private head: Promise<void> = Promise.resolve();
  async exec<T>(fn: (release: () => void) => Promise<T>) {
    await this.head;
    let resolve = () => {
      this.head = Promise.resolve();
    };
    this.head = new Promise((ok) => {
      resolve = ok;
    });
    return fn(() => resolve());
  }
}
