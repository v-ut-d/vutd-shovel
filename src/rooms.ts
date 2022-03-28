import {
  Collection,
  GuildTextBasedChannel,
  StageChannel,
  User,
  VoiceChannel,
  type Snowflake,
} from 'discord.js';
import { Room } from './classes';

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
    if (room) {
      await room.reloadEmojiDict();
    }
  }
  public async reloadGuildDict(guildId: Snowflake) {
    const room = this.cache.get(guildId);
    if (room) {
      await room.reloadGuildDict();
    }
  }
  public async loadGuildSettings(guildId: Snowflake) {
    const room = this.cache.get(guildId);
    if (room) {
      await room.loadGuildSettings();
    }
  }
  public async getOrCreateSpeaker(guildId: Snowflake, user: User) {
    const room = this.cache.get(guildId);
    if (!room) throw new Error('現在読み上げ中ではありません。');
    return await room.getOrCreateSpeaker(user);
  }
  public destroy(guildId: Snowflake) {
    const room = this.cache.get(guildId);
    if (!room) throw new Error('現在読み上げ中ではありません。');
    room.destroy();
    this.cache.delete(guildId);
    return room;
  }
}

const rooms = new RoomManager();
export default rooms;
