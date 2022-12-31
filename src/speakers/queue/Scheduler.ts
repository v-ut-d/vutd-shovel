import {
  AudioPlayer,
  createAudioResource,
  StreamType,
  AudioPlayerStatus,
} from '@discordjs/voice';
import { Collection } from 'discord.js';
import { silenceOnError } from 'node-openjtalk-binding-discordjs';
import { Readable } from 'stream';
import { env } from '../../utils';

export type AudioData = { data: Readable; streamType: StreamType };
type BufferdAudioData = { data?: Buffer; streamType: StreamType };
export type Executor = () => Promise<AudioData>;

interface Chunk {
  executor: Executor;
  sequence: number;
}

export default class Scheduler {
  #synthesisQueue: Chunk[] = [];
  #playQueue: Collection<number, BufferdAudioData> = new Collection();
  #player: AudioPlayer;
  #synthseq = 0;
  #playseq = 0;
  #concurrency = 0;

  constructor(player: AudioPlayer) {
    this.#player = player;
    this.#player.on('stateChange', (_, state) => {
      if (state.status === AudioPlayerStatus.Idle) this.#play();
    });
  }

  enqueue(executors: Executor[]) {
    for (const executor of executors) {
      this.#synthesisQueue.push({
        executor,
        sequence: this.#synthseq++,
      });
    }
    this.#synthesize();
  }

  #synthesize() {
    if (this.#concurrency > env.MAX_CONCURRENCY) return;
    this.#concurrency++;
    this.#synthesizeFirst(() => {
      this.#concurrency--;
      this.#synthesize();
    });
    this.#synthesize();
  }
  async #synthesizeFirst(release: () => void) {
    const chunk = this.#synthesisQueue.shift();
    if (!chunk) return;
    const data = await chunk.executor();
    data.data.once('data', release);

    const buf = await this.#streamToBuffer(silenceOnError(data.data));
    this.#playQueue.set(chunk.sequence, {
      data: buf,
      streamType: data.streamType,
    });
    this.#play();
  }

  async #play() {
    if (this.#player.state.status === AudioPlayerStatus.Idle) {
      if (
        this.#synthesisQueue.length > 0 &&
        this.#playseq >= this.#synthseq - 1
      )
        return;
      const data = this.#playQueue.get(this.#playseq);
      if (!data) return;
      this.#playQueue.delete(this.#playseq);
      this.#playFirst(data);
      this.#playseq++;
    }
  }
  #playFirst(data: BufferdAudioData) {
    if (!data.data) return;
    const resource = createAudioResource(Readable.from(data.data), {
      inputType: data?.streamType ?? StreamType.Raw,
    });
    this.#player.play(resource);
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
