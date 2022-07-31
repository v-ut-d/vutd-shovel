import {
  createAudioResource,
  StreamType,
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  entersState,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import type { GuildSettings } from '@prisma/client';
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

import type { Readable } from 'stream';
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
  #synthesizing = 0;
  #synthesisQueue: (() => Readable)[] = [];
  #playQueue: AudioResource[] = [];
  #player: AudioPlayer;
  #preprocessor: Preprocessor;
  #speakers: Collection<Snowflake, Speaker> = new Collection();
  client: Client;

  guildSettings?: GuildSettings;

  #loadGuildSettingsPromise;

  /**
   * Creates an instance of Room.
   * Responsible for freeing allocated client,
   * when an exception is thrown.
   * @param {VoiceBasedChannel} voiceChannel
   * @param {GuildTextBasedChannel} textChannel
   * @memberof Room
   */
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

    const client = clientManager.allocateClient(this.guildId);
    if (!client || !client.user?.id) {
      throw new Error('Could not find any usable client.');
    }
    this.client = client;
    const guild = ClientManager.getAltGuild(this.guild, client);

    this.#connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guildId,
      adapterCreator: guild.voiceAdapterCreator,
      group: client.user.id,
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

    this.#loadGuildSettingsPromise = this.loadGuildSettings();

    this.#messageCollector = textChannel.createMessageCollector({
      filter: (message) =>
        message.cleanContent !== '' &&
        !message.cleanContent.startsWith(';') &&
        !message.author.bot,
    });

    this.#messageCollector.on('collect', async (message) => {
      if (!this.guildSettings) return;
      const speaker = await this.getOrCreateSpeaker(message.author);
      let prefix = '';
      if (this.guildSettings.readSpeakersName) {
        const guildMember = await this.guild.members.fetch(message.author);
        prefix = guildMember.displayName + ' ';
      }
      const preprocessed = this.#preprocessor.exec(
        prefix + message.cleanContent
      );
      this.#synthesisQueue.push(speaker.synth.bind(speaker, preprocessed));
      this.#synth();
    });
  }

  /**
   * @returns promise that resolves when bot successfully connected
   * and rejects when bot could connect within 2 secs.
   */
  async ready() {
    await Promise.all([
      entersState(this.#connection, VoiceConnectionStatus.Ready, 2000),
      this.#preprocessor.dictLoadPromise,
      this.#loadGuildSettingsPromise,
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
      await speaker.fetchOptions(this.guildId);
      this.#speakers.set(user.id, speaker);
    }
    return speaker;
  }

  async reloadEmojiDict() {
    await this.#preprocessor.loadEmojiDict();
  }

  async reloadSpeakOptions(user?: User) {
    if (user) {
      await this.#speakers.get(user.id)?.fetchOptions(this.guildId);
    } else {
      await Promise.all(
        this.#speakers.map((speaker) => {
          speaker.fetchOptions(this.guildId);
        })
      );
    }
  }
  async reloadGuildDict() {
    await this.#preprocessor.loadGuildDict();
  }

  async loadGuildSettings() {
    const guildSettings = await prisma.guildSettings.upsert({
      where: {
        guildId: this.guildId,
      },
      create: {
        guildId: this.guildId,
      },
      update: {},
    });
    this.guildSettings = guildSettings;
  }

  #synth() {
    if (this.#synthesizing > 0) return;
    const synth = this.#synthesisQueue.shift();
    if (synth) {
      this.#synthesizing += 1;
      const stream = synth();
      stream.once('data', () => {
        this.#synthesizing -= 1;
        this.#synth();
      });
      this.#playQueue.push(
        createAudioResource(stream, {
          inputType: StreamType.Raw,
        })
      );
      this.#play();
    }
  }
  #play() {
    if (this.#player.state.status === AudioPlayerStatus.Idle) {
      const resource = this.#playQueue.shift();
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
    this.#messageCollector.removeAllListeners();
    this.#messageCollector.stop();
    this.#player.removeAllListeners();
    if (this.#connection.state.status !== VoiceConnectionStatus.Destroyed) {
      this.#connection.destroy();
    }
    clientManager.freeClient(this.guildId, this.client);
  }
}
