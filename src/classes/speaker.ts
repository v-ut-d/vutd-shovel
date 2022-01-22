import { createAudioResource, StreamType } from '@discordjs/voice';
import { User } from 'discord.js';
import { readdirSync } from 'fs';
import { silenceOnError, synthesis } from 'node-openjtalk-binding-discordjs';

const voiceDir = 'voice';
const htsvoices = readdirSync(voiceDir)
  .map((model) =>
    readdirSync(`${voiceDir}/${model}`)
      .filter((file) => file.startsWith(model))
      .map((file) => `${voiceDir}/${model}/${file}`)
  )
  .reduce((pre, cur) => [...pre, ...cur]);

/**
 * represents one member's voice synthesizer.
 */
export default class Speaker {
  #htsvoice: string;

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
    const i = parseInt(user.id.slice(10)) % htsvoices.length;
    this.#htsvoice = htsvoices[i];
  }

  /**
   * synthesizes voice stream.
   */
  synth(content: string) {
    const stream = silenceOnError(
      synthesis(content, {
        htsvoice: this.#htsvoice,
      }),
      this.debug ? (e) => console.error(e) : undefined
    );
    return createAudioResource(stream, {
      inputType: StreamType.Raw,
    });
  }
}
