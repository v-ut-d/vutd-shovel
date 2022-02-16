import {
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
  Collection,
  Guild,
  GuildTextBasedChannel,
  MessageCollector,
  Snowflake,
  User,
  VoiceBasedChannel,
} from 'discord.js';
import { Preprocessor, Speaker } from '.';
import { EndMessageEmbed } from '../components';
import { prisma } from '../database';

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

    this.#player.on('stateChange', (_, state) => {
      if (state.status === AudioPlayerStatus.Idle) this.#play();
    });

    this.#connection.subscribe(this.#player);

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

    this.#messageCollector.on('collect', async (message) => {
      if (!this.guildSettings) return;
      const speaker = await this.getOrCreateSpeaker(message.author);
      let prefix = '';
      if (this.guildSettings.readSpeakersName) {
        const guildMember = await this.guild.members.fetch(message.author);
        prefix = guildMember.displayName + ' ';
      }
      const resource = speaker.synth(
        this.#preprocessor.exec(prefix + message.cleanContent)
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
