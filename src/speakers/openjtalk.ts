import type { APIEmbedField, GuildMember } from 'discord.js';
import { readdirSync } from 'fs';
import path from 'path';
import { OpenJTalkOptions, synthesis } from 'node-openjtalk-binding-discordjs';

import { BaseSpeaker, OptionsObject } from './base';
import { StreamType } from '@discordjs/voice';

const voiceDir = './voice';

interface LocalOpenJTalkOptions
  extends Omit<OpenJTalkOptions, 'htsvoice' | 'dictionary'> {
  htsvoice: string;
  speech_speed_rate: number;
  additional_half_tone: number;
  weight_of_GV_for_log_F0: number;
}

export default class OpenJTalk extends BaseSpeaker {
  static readonly htsvoices = readdirSync(voiceDir)
    .map((model) =>
      readdirSync(path.join(voiceDir, model))
        .filter((file) => file.startsWith(model))
        .map((file) => path.join(voiceDir, model, file))
    )
    .flat();

  readonly #options: LocalOpenJTalkOptions;
  constructor(member: GuildMember, options: OptionsObject) {
    super(member);
    if (OpenJTalk.htsvoices.length === 0) throw new Error('No htsvoice found');
    this.#options = this.generateOptions(options);
  }
  private generateOptions(options: OptionsObject) {
    const result = {
      htsvoice: OpenJTalk.htsvoices[0],
      additional_half_tone: 1,
      speech_speed_rate: 1,
      weight_of_GV_for_log_F0: 0.5,
    };

    const isNumber = (arg: unknown): arg is number => typeof arg === 'number';
    const isString = (arg: unknown): arg is string => typeof arg === 'string';
    const inRange = (
      left: number,
      target: number,
      right: number
    ): target is number => left <= target && target <= right;

    if (isNumber(options.tone) && inRange(0, options.tone, 6))
      result.additional_half_tone = options.tone;
    if (isNumber(options.speed) && inRange(0.5, options.speed, 4))
      result.speech_speed_rate = options.speed;
    if (isNumber(options.f0) && inRange(0.25, options.f0, 4))
      result.weight_of_GV_for_log_F0 = options.f0;
    if (
      isString(options.htsvoice) &&
      OpenJTalk.htsvoices.includes(options.htsvoice)
    )
      result.htsvoice = options.htsvoice;

    return result;
  }

  async synthesize(content: string) {
    return [
      async () => {
        const stream = synthesis(content, {
          dictionary: './dictionary',
          ...this.#options,
        });
        return {
          data: stream,
          streamType: StreamType.Raw,
        };
      },
    ];
  }

  async display(): Promise<APIEmbedField[]> {
    return [
      {
        name: '音声合成エンジン',
        value: 'OpenJTalk',
      },
      {
        name: '声質',
        value: path.basename(this.#options.htsvoice).replace(/\..*?$/, ''),
      },
      {
        name: '声の高さ',
        value: this.#options.additional_half_tone.toFixed(2),
        inline: true,
      },
      {
        name: '声の速さ',
        value: this.#options.speech_speed_rate.toFixed(2),
        inline: true,
      },
      {
        name: '声の抑揚',
        value: this.#options.weight_of_GV_for_log_F0.toFixed(2),
        inline: true,
      },
    ];
  }
  toJSON() {
    return {
      htsvoice: this.#options.htsvoice,
      tone: this.#options.additional_half_tone,
      speed: this.#options.speech_speed_rate,
      f0: this.#options.weight_of_GV_for_log_F0,
    };
  }

  static random(member: GuildMember) {
    let options: OptionsObject;
    try {
      const match = member.id.match(/(\d\d)(\d\d)(\d\d)(\d\d)$/);
      if (!match) throw new Error('not snowflake');
      const [i, j, k, l] = match.slice(1).map((str) => parseInt(str));
      options = {
        htsvoice: this.htsvoices[i % this.htsvoices.length],
        speed: 0.8 + j * 0.006,
        tone: Math.log2(k / 100 + 1) * 8,
        f0: Math.pow(l / 50 - 1, 3) / 10 + 0.5,
      };
    } catch (_) {
      options = {
        htsvoice:
          this.htsvoices[Math.floor(Math.random() * this.htsvoices.length)],
        speed: 0.8 + Math.random() * 0.6,
        tone: Math.log2(Math.random() + 1) * 8,
        f0: Math.pow(Math.random() * 2 - 1, 3) / 10 + 0.5,
      };
    }
    return new OpenJTalk(member, options);
  }
}
