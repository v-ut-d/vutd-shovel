import { StreamType } from '@discordjs/voice';
import { Collection } from 'discord.js';
import type { Readable } from 'stream';
import prism from 'prism-media';

const FFMPEG_PCM_ARGUMENTS = [
  '-analyzeduration',
  '0',
  '-loglevel',
  '0',
  '-f',
  's16le',
  '-ar',
  '48000',
  '-ac',
  '2',
];

export interface QueueItem {
  type: StreamType;
  data: Buffer;
}

export default class AudioQueue {
  #seq = 0;
  #queue: Collection<number, QueueItem> = new Collection();

  async add(seq: number, data: Readable, type: StreamType) {
    switch (type) {
      case StreamType.Raw:
        this.#queue.set(seq, { type, data: await this.#streamToBuffer(data) });
        break;
      case StreamType.Arbitrary: {
        const toRaw = new prism.FFmpeg({ args: FFMPEG_PCM_ARGUMENTS });
        this.#queue.set(seq, {
          type: StreamType.Raw,
          data: await this.#streamToBuffer(data.pipe(toRaw)),
        });
        break;
      }
      default:
        this.#queue.set(seq, { type, data: await this.#streamToBuffer(data) });
        break;
    }
  }

  get(): QueueItem | undefined {
    let data = this.#getFirst();
    if (!data || data.type !== StreamType.Raw) return data;

    const buf: Buffer[] = [];
    while (data) {
      buf.push(data.data);
      data = this.#getFirst(StreamType.Raw);
    }

    return {
      type: StreamType.Raw,
      data: Buffer.concat(buf),
    };
  }

  #getFirst(type?: StreamType) {
    const data = this.#queue.get(this.#seq);
    if (!data || (type && data.type !== type)) return;
    this.#queue.delete(this.#seq);
    this.#seq++;
    return data;
  }

  #streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve) => {
      const buffers: Uint8Array[] = [];
      stream.on('readable', () => {
        for (;;) {
          const buffer = stream.read();
          if (!buffer) {
            break;
          }
          buffers.push(buffer);
        }
      });
      stream.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });
  }
}
