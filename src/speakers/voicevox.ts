import { StreamType } from '@discordjs/voice';
import axios from 'axios';
import { APIEmbedField, Collection, GuildMember } from 'discord.js';
import type { Readable } from 'stream';

import { BaseSpeaker, OptionsObject } from './base';

import { env } from '../utils';

import Credits from '../data/voicevox_credits.json';

interface Speaker {
  name: string;
  speaker_uuid: string;
  version: string;
  styles: SpeakerStyle[];
}

interface SpeakerStyle {
  name: string;
  id: number;
}

export default class VoiceVox extends BaseSpeaker {
  static rpc = axios.create({ baseURL: env.VOICEVOX_URL, proxy: false });

  static speakers: Promise<Speaker[]> = VoiceVox.rpc
    .get('/speakers')
    .then(async (speakers) => speakers.data)
    .catch(() => []);
  static speakerDict: Promise<Collection<number, string>> = VoiceVox.speakers
    .then((speakers) =>
      speakers.map((speaker) =>
        speaker.styles.map(
          (style) =>
            [
              style.id,
              `${speaker.name}(${style.name})${VoiceVox.credit(
                speaker.speaker_uuid
              )}`,
            ] as const
        )
      )
    )
    .then((speakers) => new Collection(speakers.flat()));

  static credit(uuid: string) {
    if (uuid in Credits) {
      return `(${Credits[uuid as keyof typeof Credits]})`;
    } else {
      return '';
    }
  }

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
    const query = await VoiceVox.rpc.post(
      `/audio_query?text=${encodeURI(content)}&speaker=${this.speakerId}`
    );
    const queryData = (await query.data) as object;
    const synthesis = await VoiceVox.rpc.post(
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

  async display(): Promise<APIEmbedField[]> {
    const speaker = (await VoiceVox.speakerDict).get(this.speakerId);
    return [
      {
        name: '音声合成エンジン',
        value: 'VoiceVox',
      },
      {
        name: 'キャラクター',
        value: `VOICEVOX:${speaker}`,
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

  static random(member: GuildMember) {
    return new VoiceVox(member, {});
  }
}
