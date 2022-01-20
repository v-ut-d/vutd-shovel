import { createAudioResource, StreamType } from '@discordjs/voice';
import { User } from 'discord.js';
import { readFileSync } from 'fs';
import { silenceOnError, synthesis } from 'node-openjtalk-binding-discordjs';

export default class Speaker {
  htsvoice: Buffer;

  constructor(public user: User, public debug = false) {
    this.htsvoice = readFileSync('voice/mei/mei_normal.htsvoice');
  }

  synth(content: string) {
    const stream = silenceOnError(
      synthesis(content, {
        htsvoice: this.htsvoice,
      }),
      this.debug ? (e) => console.error(e) : undefined
    );
    return createAudioResource(stream, {
      inputType: StreamType.Raw,
    });
  }
}
