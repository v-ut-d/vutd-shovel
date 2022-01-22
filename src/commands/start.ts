import {
  ApplicationCommandData,
  ApplicationCommandPermissions,
  CommandInteraction,
} from 'discord.js';
import rooms from '../rooms';
import { Room } from '../classes';
import { ErrorMessageEmbed, StartMessageEmbed } from '../components';

/**
 * `/start` command data.
 */
export const data: ApplicationCommandData = {
  name: 'start',
  description: '読み上げを開始します。',
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
 * `/start` command permission data.
 */
export const permissions: ApplicationCommandPermissions[] = [];

/**
 * handles `/start` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    const voiceChannel =
      interaction.member.voice.channel ?? interaction.options.getChannel('vc');
    if (!voiceChannel?.isVoice())
      throw new Error('ボイスチャンネルを指定してください。');

    const textChannel = interaction.channel;
    if (!textChannel)
      throw new Error('テキストチャンネルを取得できませんでした。');

    const room = new Room(voiceChannel, textChannel);
    await room.ready().catch(() => {
      room.destroy();
      throw new Error('ボイスチャンネルへの接続時にエラーが発生しました。');
    });
    await interaction.reply({
      embeds: [new StartMessageEmbed(room)],
    });
    rooms.set(interaction.guildId, room);
  } catch (e) {
    await interaction.reply({
      embeds: [
        new ErrorMessageEmbed(
          '読み上げを開始できませんでした。',
          (e as Error).message
        ),
      ],
    });
  }
}
