import {
  AudioPlayer,
  entersState,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import type { GuildSettings } from '@prisma/client';
import type {
  Guild,
  GuildTextBasedChannel,
  MessageCollector,
  Snowflake,
  VoiceBasedChannel,
} from 'discord.js';
import { Preprocessor } from '.';
import { prisma } from '../database';
import { speakers } from '../speakers';
import Scheduler from '../speakers/queue/Scheduler';
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
  #player: AudioPlayer;
  #preprocessor: Preprocessor;
  guildSettings?: GuildSettings;

  #scheduler: Scheduler;

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

    this.#connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      debug: true,
    });

    this.#player = new AudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Stop,
      },
      debug: true,
    });

    this.#scheduler = new Scheduler(this.#player);

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
      if (!message.member) return;
      if (!this.guildSettings) return;
      let prefix = '';
      if (this.guildSettings.readSpeakersName) {
        const guildMember = await this.guild.members.fetch(message.author);
        prefix = guildMember.displayName + ' ';
      }
      const preprocessed = this.#preprocessor.exec(
        prefix + message.cleanContent
      );
      const executors = await speakers.synthesize(
        message.member,
        preprocessed,
        (e) => console.error(e)
      );
      this.#scheduler.enqueue(executors);
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

  async reloadEmojiDict() {
    await this.#preprocessor.loadEmojiDict();
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
  }
}
