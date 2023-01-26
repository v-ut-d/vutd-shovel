import {
  AudioPlayer,
  createAudioResource,
  StreamType,
  AudioPlayerStatus,
} from '@discordjs/voice';
import { silenceOnError } from 'node-openjtalk-binding-discordjs';
import { Readable } from 'stream';
import { env } from '../../utils';
import AudioQueue, { QueueItem } from './AudioQueue';

export type AudioData = { data: Readable; streamType: StreamType };
export type Executor = () => Promise<AudioData>;

interface Chunk {
  executor: Executor;
  sequence: number;
}

export default class Scheduler {
  #synthesisQueue: Chunk[] = [];
  #playQueue = new AudioQueue();
  #player: AudioPlayer;
  #synthseq = 0;
  #concurrency = 0;

  constructor(player: AudioPlayer) {
    this.#player = player;
    this.#player.on('stateChange', (_, state) => {
      if (state.status === AudioPlayerStatus.Idle) this.#play();
    });
  }

  enqueue(executors: Executor[]) {
    for (const executor of executors) {
      //console.log('Enqueued:', this.#synthseq);
      this.#synthesisQueue.push({
        executor,
        sequence: this.#synthseq++,
      });
    }
    this.#synthesize();
  }

  #synthesize() {
    if (this.#concurrency > env.MAX_CONCURRENCY) return;
    //console.log('Concurrency:', this.#concurrency);

    const chunk = this.#synthesisQueue.shift();
    if (!chunk) return;

    this.#concurrency++;
    this.#doSynthesis(chunk, () => {
      this.#concurrency--;
      this.#synthesize();
    });
    this.#synthesize();
  }
  async #doSynthesis(chunk: Chunk, release: () => void) {
    //console.log('Synthesize:', chunk.sequence);

    const data = await chunk.executor();
    data.data.once('data', release);

    this.#playQueue.add(
      chunk.sequence,
      silenceOnError(data.data),
      data.streamType
    );
    this.#play();
  }

  async #play() {
    if (this.#player.state.status === AudioPlayerStatus.Idle) {
      const data = this.#playQueue.get();
      if (!data) return;

      this.#doPlay(data);
    }
  }
  #doPlay(data: QueueItem) {
    const resource = createAudioResource(Readable.from(data.data), {
      inputType: data.type,
    });
    this.#player.play(resource);
  }
}
