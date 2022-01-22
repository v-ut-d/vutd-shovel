import { createAudioResource, StreamType } from '@discordjs/voice';
import { Snowflake, User } from 'discord.js';
import { readdirSync } from 'fs';
import path from 'path';
import {
  OpenJTalkOptions,
  silenceOnError,
  synthesis,
} from 'node-openjtalk-binding-discordjs';

const voiceDir = path.join(__dirname, 'voice');

interface LocalOpenJTalkOptions extends OpenJTalkOptions {
  htsvoice: string;
  speech_speed_rate: number;
  additional_half_tone: number;
  weight_of_GV_for_log_F0: number;
}

interface Options {
  tone: number;
  speed: number;
  f0: number;
  htsvoice: string;
}

/**
 * represents one member's voice synthesizer.
 */
export default class Speaker {
  /**
   * array of htsvoice file paths currently available.
   */
  static readonly htsvoices = readdirSync(voiceDir)
    .map((model) =>
      readdirSync(path.join(voiceDir, model))
        .filter((file) => file.startsWith(model))
        .map((file) => path.join(voiceDir, model, file))
    )
    .reduce((pre, cur) => [...pre, ...cur]);

  static #randomOptions(snowflake?: Snowflake): LocalOpenJTalkOptions {
    try {
      if (!snowflake) throw new Error('no snowflake');
      const match = snowflake.match(/(\d\d)(\d\d)(\d\d)(\d\d)$/);
      if (!match) throw new Error('not snowflake');
      const [i, j, k, l] = match.slice(1).map((str) => parseInt(str));
      return {
        htsvoice: Speaker.htsvoices[i % Speaker.htsvoices.length],
        speech_speed_rate: Math.pow(2, j / 50 - 1),
        additional_half_tone: k / 15 - 3,
        weight_of_GV_for_log_F0: Math.pow(2, l / 25 - 2),
      };
    } catch (_) {
      return {
        htsvoice:
          Speaker.htsvoices[
            Math.floor(Math.random() * Speaker.htsvoices.length)
          ],
        speech_speed_rate: Math.pow(2, Math.random() * 2 - 1),
        additional_half_tone: Math.random() * 6 - 3,
        weight_of_GV_for_log_F0: Math.pow(2, Math.random() * 4 - 2),
      };
    }
  }

  #options: LocalOpenJTalkOptions;

  constructor(
    /**
     * the user that uses this speaker.
     */
    public user: User,
    /**
     * debug flag; true to have more debug message.
     */
    public debug = false
  ) {
    this.#options = Speaker.#randomOptions(user.id);
  }

  /**
   * options passed to Open JTalk
   */
  get options(): Options {
    return {
      tone: this.#options.additional_half_tone,
      speed: this.#options.speech_speed_rate,
      f0: this.#options.weight_of_GV_for_log_F0,
      htsvoice: this.#options.htsvoice,
    };
  }

  /**
   * set options passed to Open JTalk
   */
  set options(options: Partial<Options>) {
    const validated: Partial<LocalOpenJTalkOptions> = {};
    if (options.tone && Math.abs(options.tone) <= 12)
      validated.additional_half_tone = options.tone;
    if (options.speed && options.speed >= 0.5 && options.speed <= 2)
      validated.speech_speed_rate = options.speed;
    if (options.f0 && options.f0 >= 0.25 && options.f0 <= 4)
      validated.weight_of_GV_for_log_F0 = options.f0;
    if (options.htsvoice && Speaker.htsvoices.includes(options.htsvoice))
      validated.htsvoice = options.htsvoice;
    this.#options = {
      ...this.#options,
      ...validated,
    };
  }

  /**
   * randomly set options passed to Open JTalk
   */
  setRandomOptions() {
    this.#options = Speaker.#randomOptions();
  }

  /**
   * synthesizes voice stream.
   */
  synth(content: string) {
    const stream = silenceOnError(
      synthesis(content, this.#options),
      this.debug ? (e) => console.error(e) : undefined
    );
    return createAudioResource(stream, {
      inputType: StreamType.Raw,
    });
  }
}
