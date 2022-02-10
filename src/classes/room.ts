import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  entersState,
  getGroups,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import {
  Client,
  Collection,
  Guild,
  GuildTextBasedChannel,
  MessageCollector,
  Snowflake,
  User,
  VoiceBasedChannel,
} from 'discord.js';
import { Preprocessor, Speaker } from '.';
import { clientManager } from '../clientManager';
import { prisma } from '../database';
import ClientManager from './client';

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

  #connection?: VoiceConnection;
  #messageCollector: MessageCollector;
  #queue: AudioResource[] = [];
  #player: AudioPlayer;
  #preprocessor: Preprocessor;
  #speakers: Collection<Snowflake, Speaker> = new Collection();
  #allocatedClient?: Client;

  #joinVCPromise;

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

    this.#player = new AudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Stop,
      },
      debug: true,
    });

    this.#player.on('stateChange', (_, state) => {
      if (state.status === AudioPlayerStatus.Idle) this.#play();
    });

    this.#preprocessor = new Preprocessor(this);

    this.#messageCollector = textChannel.createMessageCollector({
      filter: (message) =>
        message.cleanContent !== '' && !message.cleanContent.startsWith(';'),
    });

    this.#joinVCPromise = this.#joinVC(this.#player);

    this.#messageCollector.on('collect', async (message) => {
      const speaker = await this.getOrCreateSpeaker(message.author);

      const resource = speaker.synth(
        this.#preprocessor.exec(message.cleanContent)
      );
      this.#queue.push(resource);
      this.#play();
    });

    process.on('SIGINT', () => {
      if (
        this.#connection &&
        this.#connection.state.status !== VoiceConnectionStatus.Destroyed
      )
        this.#connection.destroy();
      process.exit(0);
    });
  }

  async #joinVC(player: AudioPlayer) {
    const client = (this.#allocatedClient = clientManager.allocateClient(
      this.guildId
    ));
    if (!client || !client.user?.id) {
      return Promise.reject(new Error('Could not find any usable client.'));
    }
    const guild = await ClientManager.getAltGuild(this.guild, client);

    const groups = getGroups();
    const userConnections = groups.get(client.user.id);
    if (userConnections) {
      groups.set('default', userConnections);
    } else {
      const newUserConnections = new Map();
      groups.set(client.user.id, newUserConnections);
      groups.set('default', newUserConnections);
    }

    this.#connection = joinVoiceChannel({
      channelId: this.voiceChannel.id,
      guildId: this.voiceChannel.guildId,
      adapterCreator: guild.voiceAdapterCreator,
      debug: true,
    });

    this.#connection.subscribe(player);
    return this.#connection;
  }

  /**
   * @returns promise that resolves when bot successfully connected
   * and rejects when bot could connect within 2 secs.
   */
  async ready() {
    await Promise.all([
      this.#joinVCPromise.then((connection: VoiceConnection) => {
        return entersState(connection, VoiceConnectionStatus.Ready, 2000);
      }),
      this.#preprocessor.dictLoadPromise,
    ]);
    return;
  }

  getSpeaker(userId: Snowflake) {
    return this.#speakers.get(userId);
  }

  async getOrCreateSpeaker(user: User) {
    let speaker = this.getSpeaker(user.id);
    if (!speaker) {
      speaker = new Speaker(user, true);
      const options = await prisma.member.findUnique({
        where: {
          guildId_userId: {
            guildId: this.guildId,
            userId: user.id,
          },
        },
      });
      if (options) {
        speaker.options = options;
      } else {
        await prisma.member.create({
          data: {
            guildId: this.guildId,
            userId: user.id,
            ...speaker.options,
          },
        });
      }
      this.#speakers.set(user.id, speaker);
    }
    return speaker;
  }

  async reloadEmojiDict() {
    await this.#preprocessor.loadEmojiDict();
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
    this.#connection?.destroy();
    this.#messageCollector.stop();
    if (this.#allocatedClient) {
      clientManager.freeClient(this.guildId, this.#allocatedClient);
    }
  }
}
