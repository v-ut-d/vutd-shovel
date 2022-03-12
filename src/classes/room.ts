import {
  createAudioResource,
  StreamType,
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
import { EndMessageEmbed } from '../components';
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

  #connection?: VoiceConnection;
  #messageCollector: MessageCollector;
  #synthesizing = 0;
  #synthesisQueue: (() => Readable)[] = [];
  #playQueue: AudioResource[] = [];
  #player: AudioPlayer;
  #preprocessor: Preprocessor;
  #speakers: Collection<Snowflake, Speaker> = new Collection();
  allocatedClient?: Client;

  #joinVCPromise;
  guildSettings?: GuildSettings;

  #loadGuildSettingsPromise;

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

    this.#player.on<'stateChange'>('stateChange', (_, state) => {
      if (state.status === AudioPlayerStatus.Idle) this.#play();
    });

    this.#preprocessor = new Preprocessor(this);

    this.#loadGuildSettingsPromise = this.loadGuildSettings();

    voiceChannel.client.on('voiceStateUpdate', async (oldState, newState) => {
      if (
        oldState.guild.id === voiceChannel.guildId &&
        oldState.channelId === voiceChannel.id &&
        newState.channelId === null && //disconnect
        voiceChannel.client.user?.id &&
        voiceChannel.members.has(voiceChannel.client.user?.id) &&
        voiceChannel.members.size === 1
      ) {
        //no member now. leaving the channel.
        await textChannel.send({
          embeds: [
            new EndMessageEmbed(
              this,
              'ボイスチャンネルに誰もいなくなったため、'
            ),
          ],
        });
        this.destroy();
      }
    });

    this.#messageCollector = textChannel.createMessageCollector({
      filter: (message) =>
        message.cleanContent !== '' &&
        !message.cleanContent.startsWith(';') &&
        !message.author.bot,
    });

    this.#joinVCPromise = this.#joinVC(this.#player);

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
    const client = (this.allocatedClient = clientManager.allocateClient(
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
        dictionaryWriteRole: this.guild.roles.everyone.id,
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
    if (
      this.#connection &&
      this.#connection.state.status !== VoiceConnectionStatus.Destroyed
    ) {
      this.#connection.destroy();
    }
    this.#messageCollector.stop();
    if (this.allocatedClient) {
      clientManager.freeClient(this.guildId, this.allocatedClient);
    }
  }
}
