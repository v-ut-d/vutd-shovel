import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  DiscordGatewayAdapterCreator,
  entersState,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import {
  Collection,
  Guild,
  GuildTextBasedChannel,
  MessageCollector,
  Snowflake,
  User,
  VoiceBasedChannel,
} from 'discord.js';
import { Preprocessor, Speaker } from '.';

/**
 * represents one reading session.
 * exists at most 1 per {@link Guild}.
 * has exactly one {@link VoiceBasedChannel}.
 */
export default class Room {
  /**
   * the guild this room is in.
   */
  guild: Guild;

  /**
   * id of the guild this room is in.
   */
  guildId: Snowflake;

  #connection: VoiceConnection;
  #messageCollector: MessageCollector;
  #queue: AudioResource[] = [];
  #player: AudioPlayer;
  #preprocessor: Preprocessor;
  #speakers: Collection<Snowflake, Speaker> = new Collection();

  constructor(
    /**
     * voice channel that this room is bound to.
     */
    public voiceChannel: VoiceBasedChannel,
    /**
     * text channel that this room is initialized in.
     */
    public textChannel: GuildTextBasedChannel
  ) {
    this.guild = voiceChannel.guild;
    this.guildId = voiceChannel.guildId;

    this.#connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guildId,
      // needs cast: https://github.com/discordjs/discord.js/issues/7273
      adapterCreator: voiceChannel.guild
        .voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
      debug: true,
    });

    this.#player = new AudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Stop,
      },
      debug: true,
    });

    this.#player.on('stateChange', (_, state) => {
      if (state.status === AudioPlayerStatus.Idle) this.#play();
    });

    this.#connection.subscribe(this.#player);

    this.#preprocessor = new Preprocessor(this);

    this.#messageCollector = textChannel.createMessageCollector({
      filter: (message) =>
        message.cleanContent !== '' && !message.cleanContent.startsWith(';'),
    });

    this.#messageCollector.on('collect', (message) => {
      let speaker = this.#speakers.get(message.author.id);
      if (!speaker) {
        speaker = new Speaker(message.author, true);
        this.#speakers.set(message.author.id, speaker);
      }

      const resource = speaker.synth(
        this.#preprocessor.exec(message.cleanContent)
      );
      this.#queue.push(resource);
      this.#play();
    });

    process.on('SIGINT', () => {
      if (this.#connection.state.status !== VoiceConnectionStatus.Destroyed)
        this.#connection.destroy();
      process.exit(0);
    });
  }

  /**
   * @returns promise that resolves when bot successfully connected
   * and rejects when bot could connect within 2 secs.
   */
  async ready() {
    await entersState(this.#connection, VoiceConnectionStatus.Ready, 2000);
    return;
  }

  getSpeaker(userId: Snowflake) {
    return this.#speakers.get(userId);
  }

  getOrCreateSpeaker(user: User) {
    let speaker = this.getSpeaker(user.id);
    if (!speaker) {
      speaker = new Speaker(user, true);
      this.#speakers.set(user.id, speaker);
    }
    return speaker;
  }

  #play() {
    if (this.#player.state.status === AudioPlayerStatus.Idle) {
      const resource = this.#queue.shift();
      if (resource) this.#player.play(resource);
    }
  }

  cancel() {
    this.#player.stop(true);
  }

  /**
   * disconnects from voice channel and stop collecting messages.
   */
  destroy() {
    this.#connection.destroy();
    this.#messageCollector.stop();
  }
}
