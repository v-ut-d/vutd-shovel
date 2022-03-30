import {
  Collection,
  GuildTextBasedChannel,
  StageChannel,
  User,
  VoiceChannel,
  VoiceState,
  type Snowflake,
} from 'discord.js';
import { Room } from './classes';
import { EndMessageEmbed } from './components';

export class RoomManager {
  /**
   * {@link Collection} of rooms in current process
   * with its guildId as key.
   */
  public cache = new Collection<Snowflake, Room>();
  public async create(
    voiceChannel: StageChannel | VoiceChannel,
    textChannel: GuildTextBasedChannel
  ) {
    const room = new Room(voiceChannel, textChannel);
    await room.ready().catch(() => {
      room.destroy();
      throw new Error('ボイスチャンネルへの接続時にエラーが発生しました。');
    });
    this.cache.set(room.guildId, room);
    return room;
  }
  public cancel(guildId: Snowflake) {
    const room = this.cache.get(guildId);
    if (!room) throw new Error('現在読み上げ中ではありません。');
    room.cancel();
  }
  public async reloadEmojiDict(guildId: Snowflake) {
    const room = this.cache.get(guildId);
    if (!room) return;
    await room.reloadEmojiDict();
  }
  public async reloadGuildDict(guildId: Snowflake) {
    const room = this.cache.get(guildId);
    if (!room) return;
    await room.reloadGuildDict();
  }
  public async loadGuildSettings(guildId: Snowflake) {
    const room = this.cache.get(guildId);
    if (!room) return;
    await room.loadGuildSettings();
  }
  public async getOrCreateSpeaker(guildId: Snowflake, user: User) {
    const room = this.cache.get(guildId);
    if (!room) throw new Error('現在読み上げ中ではありません。');
    return await room.getOrCreateSpeaker(user);
  }
  public async onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
    const room = this.cache.get(newState.guild.id);
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
    const room = this.cache.get(guildId);
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
