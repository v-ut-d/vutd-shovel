import {
  ApplicationCommandData,
  Collection,
  CommandInteraction,
  Snowflake,
} from 'discord.js';
import rooms from '../rooms';
import { Room } from '../classes';
import { ErrorMessageEmbed, StartMessageEmbed } from '../components';

/**
 * `/start` command data.
 */
export const data: ApplicationCommandData = {
  name: 'start',
  description: 'ボイスチャンネルに参加し、読み上げを開始します。',
  options: [
    {
      name: 'vc',
      type: 'CHANNEL',
      description:
        'ボイスチャンネル。あなたがどこのチャンネルにも入っていない場合、指定必須です。',
      channelTypes: ['GUILD_STAGE_VOICE', 'GUILD_VOICE'],
    },
  ],
};

/**
 * handles `/start` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    const voiceChannel =
      interaction.options.getChannel('vc') ?? interaction.member.voice.channel;
    if (!voiceChannel?.isVoice())
      throw new Error('ボイスチャンネルを指定してください。');

    const textChannel = interaction.channel;
    if (!textChannel)
      throw new Error('テキストチャンネルを取得できませんでした。');

    const me = interaction.guild.me;
    if (!me) throw new Error('データを取得できませんでした。');

    const room = new Room(voiceChannel, textChannel);
    await room.ready().catch(() => {
      room.destroy();
      throw new Error('ボイスチャンネルへの接続時にエラーが発生しました。');
    });

    if (!room.allocatedClient?.user?.id) {
      room.destroy();
      throw new Error(
        'ボットをボイスチャンネルに割り当てることに失敗しました。' +
          'なお、このエラーは通常発生しません。開発者に連絡してください。'
      );
    }

    const surpressed =
      voiceChannel.type === 'GUILD_STAGE_VOICE' &&
      me.voice.suppress &&
      (await me.voice.setSuppressed(false).then(
        () => false,
        () => true
      ));

    const roomCollection =
      rooms.get(interaction.guildId) ?? new Collection<Snowflake, Room>();
    roomCollection.set(room.allocatedClient.user.id, room);
    if (!rooms.has(interaction.guildId)) {
      rooms.set(interaction.guildId, roomCollection);
    }

    await interaction.reply({
      embeds: [new StartMessageEmbed(room, surpressed)],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('読み上げを開始できませんでした。', e)],
    });
  }
}
