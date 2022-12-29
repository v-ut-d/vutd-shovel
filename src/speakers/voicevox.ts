import { StreamType } from '@discordjs/voice';
import axios from 'axios';
import type { APIEmbedField, GuildMember } from 'discord.js';
import type { Readable } from 'stream';

import { BaseSpeaker, OptionsObject } from './base';

import SpeakerData from '../data/voicevox.json';
import { env } from '../utils';

export default class VoiceVox extends BaseSpeaker {
  private rpc = axios.create({ baseURL: env.VOICEVOX_URL, proxy: false });

  static speakers = SpeakerData;

  private speakerId;
  private speed;
  private pitch;
  private intonation;

  constructor(member: GuildMember, options: OptionsObject) {
    super(member);
    this.speakerId =
      options.speakerId && typeof options.speakerId === 'number'
        ? options.speakerId
        : 0;
    this.speed =
      options.speed && typeof options.speed === 'number' ? options.speed : 1;
    this.pitch =
      options.pitch && typeof options.pitch === 'number' ? options.pitch : 0;
    this.intonation =
      options.intonation && typeof options.intonation === 'number'
        ? options.intonation
        : 1;
  }

  async synthesize(content: string) {
    const stream = await this.synthesis(content);
    return { data: stream, streamType: StreamType.Arbitrary };
  }

  private async synthesis(content: string) {
    const query = await this.rpc.post(
      `/audio_query?text=${encodeURI(content)}&speaker=${this.speakerId}`
    );
    const queryData = (await query.data) as object;
    const synthesis = await this.rpc.post(
      `/synthesis?speaker=${this.speakerId}`,
      JSON.stringify({
        ...queryData,
        speedScale: this.speed,
        pitchScale: this.pitch,
        intonationScale: this.intonation,
        outputSamplingRate: 48000,
      }),
      {
        responseType: 'stream',
        headers: {
          accept: 'audio/wav',
          'Content-Type': 'application/json',
        },
      }
    );
    return synthesis.data as Readable;
  }

  display(): APIEmbedField[] {
    return [
      {
        name: '音声合成エンジン',
        value: 'VoiceVox',
      },
      {
        name: 'キャラクター',
        value: `VOICEVOX:${this.speaker?.name}${this.speaker?.credit ?? ''}`,
      },
      {
        name: '声の高さ',
        value: this.pitch.toFixed(2),
        inline: true,
      },
      {
        name: '声の速さ',
        value: this.speed.toFixed(2),
        inline: true,
      },
      {
        name: '声の抑揚',
        value: this.intonation.toFixed(2),
        inline: true,
      },
    ];
  }
  toJSON() {
    return {
      speakerId: this.speakerId,
      speed: this.speed,
      pitch: this.pitch,
      intonation: this.intonation,
    };
  }

  private get speaker() {
    return VoiceVox.speakers.find((d) => d.id === this.speakerId);
  }

  static random(member: GuildMember) {
    return new VoiceVox(member, {});
  }
}
