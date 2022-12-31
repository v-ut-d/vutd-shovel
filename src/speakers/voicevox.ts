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

interface AudioQuery {
  speedScale: number;
  pitchScale: number;
  intonationScale: number;
  volumeScale: number;
  prePhonemeLength: number;
  postPhonemeLength: number;
  outputSamplingRate: number;
  outputStereo: boolean;
  kana?: string;
  accent_phrases: AccentPhrase[];
}

interface AccentPhrase {
  moras: Mora[];
  accent: number;
  pause_mora: object;
  is_interrogative: boolean;
}

interface Mora {
  description?: string;
  text: string;
  consonant: string | null;
  consonant_length: number | null;
  vowel: string;
  vowel_length: number;
  pitch: number;
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
    const query = await VoiceVox.rpc.post(
      `/audio_query?text=${encodeURI(content)}&speaker=${this.speakerId}`
    );
    const queryData = (await query.data) as AudioQuery;

    let chunkId = 0;
    const chunks: AccentPhrase[][] = [[]];
    let t = 0;
    for (const acc of queryData.accent_phrases) {
      chunks[chunkId].push(acc);
      t += acc.moras.reduce(
        (prev, curr) => prev + (curr.consonant_length ?? 0) + curr.vowel_length,
        0
      );
      if (t > 2 || acc.pause_mora) {
        t = 0;
        chunks.push([]);
        chunkId++;
      }
    }

    return chunks.map((accent_phrases) => {
      const q = { ...queryData, accent_phrases };
      return async () => {
        const stream = await this.synthesis(q);
        stream.on('error', () => {
          console.error('VoiceVox: synthesis failed.');
        });
        return { data: stream, streamType: StreamType.Arbitrary };
      };
    });
  }

  private async synthesis(queryData: AudioQuery) {
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
