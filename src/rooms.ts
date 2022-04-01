import {
  Client,
  Collection,
  GuildTextBasedChannel,
  StageChannel,
  User,
  VoiceChannel,
  VoiceState,
  type Snowflake,
} from 'discord.js';
import { Room, SpeakerOptions } from './classes';
import { EndMessageEmbed } from './components';

export class RoomManager {
  /**
   * {@link Collection} of rooms in current process
   * with its guildId as key.
   */
  public cache = new Collection<Snowflake, Collection<Snowflake, Room>>();
  public async create(
    voiceChannel: StageChannel | VoiceChannel,
    textChannel: GuildTextBasedChannel
  ) {
    const room = new Room(voiceChannel, textChannel);
    await room.ready().catch(() => {
      room.destroy();
      throw new Error('ボイスチャンネルへの接続時にエラーが発生しました。');
    });
    if (!room.client.user?.id) {
      room.destroy();
      throw new Error('ボットが起動するまでお待ちください。');
    }
    const coll = this.cache.ensure(room.guildId, () => new Collection());
    coll.set(room.client.user.id, room);
    return room;
  }
  public cancel(guildId: Snowflake) {
    const roomCollection = this.cache.get(guildId);
    if (!roomCollection) throw new Error('現在読み上げ中ではありません。');
    roomCollection.each((room) => room.cancel());
  }
  public async reloadEmojiDict(guildId: Snowflake) {
    const roomCollection = this.cache.get(guildId);
    if (!roomCollection) return;
    await Promise.all(roomCollection.map((room) => room.reloadEmojiDict()));
  }
  public async reloadGuildDict(guildId: Snowflake) {
    const roomCollection = this.cache.get(guildId);
    if (!roomCollection) return;
    await Promise.all(roomCollection.map((room) => room.reloadGuildDict()));
  }
  public async loadGuildSettings(guildId: Snowflake) {
    const roomCollection = this.cache.get(guildId);
    if (!roomCollection) return;
    await Promise.all(roomCollection.map((room) => room.loadGuildSettings()));
  }
  public async getOrCreateSpeaker(guildId: Snowflake, user: User) {
    const room = this.cache.get(guildId)?.first();
    if (!room) throw new Error('現在読み上げ中ではありません。');
    return await room.getOrCreateSpeaker(user);
  }
  public async setSpeakerOption(
    guildId: Snowflake,
    user: User,
    options: SpeakerOptions
  ) {
    const roomCollection = this.cache.get(guildId);
    if (!roomCollection) return;
    await Promise.all(
      roomCollection.map(async (room) => {
        const speaker = await room.getOrCreateSpeaker(user);
        speaker.options = options;
      })
    );
  }
  public async onVoiceStateUpdate(
    client: Client<true>,
    oldState: VoiceState,
    newState: VoiceState
  ) {
    const room = this.cache.get(newState.guild.id)?.get(client.user.id);
    if (!room) return;
    if (
      room.voiceChannel.client.user?.id &&
      !room.voiceChannel.members.has(room.voiceChannel.client.user?.id)
    ) {
      this.destroy(newState.guild.id);
      await room.textChannel.send({
        embeds: [new EndMessageEmbed(room, '切断されたため、')],
      });
    }
    if (
      oldState.channelId === room.voiceChannel.id &&
      newState.channelId === null && //disconnect
      room.voiceChannel.client.user?.id &&
      room.voiceChannel.members.has(room.voiceChannel.client.user?.id) &&
      room.voiceChannel.members.size === 1
    ) {
      this.destroy(newState.guild.id);
      await room.textChannel.send({
        embeds: [
          new EndMessageEmbed(room, 'ボイスチャンネルに誰もいなくなったため、'),
        ],
      });
    }
  }
  public destroy(guildId: Snowflake) {
    const room = this.cache.get(guildId)?.first();
    if (!room) throw new Error('現在読み上げ中ではありません。');
    room.destroy();
    this.cache.delete(guildId);
    return room;
  }
  public destroyAll() {
    this.cache.forEach((_, guildId) => this.destroy(guildId));
  }
}

const rooms = new RoomManager();
export default rooms;
