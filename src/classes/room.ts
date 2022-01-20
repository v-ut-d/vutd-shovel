import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  DiscordGatewayAdapterCreator,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnection,
} from '@discordjs/voice';
import {
  Collection,
  MessageCollector,
  NewsChannel,
  Snowflake,
  StageChannel,
  TextChannel,
  ThreadChannel,
  VoiceChannel,
} from 'discord.js';
import Speaker from './speaker';

export default class Room {
  private connection: VoiceConnection;
  private player: AudioPlayer;
  private messageCollector: MessageCollector;
  private speakers: Collection<Snowflake, Speaker> = new Collection();
  private queue: AudioResource[] = [];

  constructor(
    public voiceChannel: VoiceChannel | StageChannel,
    public textChannel: TextChannel | NewsChannel | ThreadChannel
  ) {
    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guildId,
      // needs cast: https://github.com/discordjs/discord.js/issues/7273
      adapterCreator: voiceChannel.guild
        .voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
      debug: true,
    });

    this.player = new AudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Stop,
      },
      debug: true,
    });

    this.player.on('stateChange', (_, state) => {
      if (state.status === AudioPlayerStatus.Idle) this.play();
    });

    this.connection.subscribe(this.player);

    this.messageCollector = textChannel.createMessageCollector({
      filter: (message) => !message.cleanContent.startsWith(';'),
    });

    this.messageCollector.on('collect', (message) => {
      let speaker = this.speakers.get(message.author.id);
      if (!speaker) {
        speaker = new Speaker(message.author, true);
        this.speakers.set(message.author.id, speaker);
      }

      const resource = speaker.synth(message.cleanContent);
      this.queue.push(resource);
      this.play();
    });
  }

  private play() {
    if (this.player.state.status === AudioPlayerStatus.Idle) {
      const resource = this.queue.shift();
      if (resource) this.player.play(resource);
    }
  }

  destroy() {
    this.connection.destroy();
    this.messageCollector.stop();
  }
}
