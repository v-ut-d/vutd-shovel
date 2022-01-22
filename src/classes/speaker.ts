import { createAudioResource, StreamType } from '@discordjs/voice';
import { User } from 'discord.js';
import { silenceOnError, synthesis } from 'node-openjtalk-binding-discordjs';

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
    this.#htsvoice = 'voice/mei/mei_normal.htsvoice';
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
