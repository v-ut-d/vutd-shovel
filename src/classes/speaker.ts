import { createAudioResource, StreamType } from '@discordjs/voice';
import { User } from 'discord.js';
import { silenceOnError, synthesis } from 'node-openjtalk-binding-discordjs';

export default class Speaker {
  htsvoice: string;

  constructor(public user: User, public debug = false) {
    this.htsvoice = 'voice/mei/mei_normal.htsvoice';
  }

  synth(content: string) {
    const stream = silenceOnError(
      synthesis(content, {
        htsvoice: this.htsvoice,
        dictionary: 'dictionary',
      }),
      this.debug ? (e) => console.error(e) : undefined
    );
    return createAudioResource(stream, {
      inputType: StreamType.Raw,
    });
  }
}
