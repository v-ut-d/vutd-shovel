import {
  ApplicationCommandData,
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
} from 'discord.js';
import rooms from '../rooms';
import { EndMessageEmbed, ErrorMessageEmbed } from '../components';

/**
 * `/end` command data.
 */
export const data: ApplicationCommandData = {
  name: 'end',
  description: '読み上げを終了し、ボイスチャンネルから退出します。',
  options: [
    {
      name: 'vc',
      type: ApplicationCommandOptionType.Channel,
      description:
        'ボイスチャンネル。あなたがどこのチャンネルにも入っていない場合、指定必須です。',
      channelTypes: [ChannelType.GuildStageVoice, ChannelType.GuildVoice],
    },
  ],
};

/**
 * handles `/end` command.
 */
export async function handle(
  interaction: ChatInputCommandInteraction<'cached'>
) {
  try {
    const voiceChannel =
      interaction.options.getChannel('vc') ?? interaction.member.voice.channel;
    if (!voiceChannel?.isVoiceBased())
      throw new Error('ボイスチャンネルを指定してください。');
    const clientId = rooms.cache
      .get(interaction.guildId)
      ?.find((_, clientId) => voiceChannel.members.has(clientId))?.client
      .user?.id;
    if (!clientId)
      throw new Error('ボイスチャンネルにボットが参加していません。');
    const room = rooms.destroy(interaction.guildId, clientId);
    await interaction.reply({
      embeds: [new EndMessageEmbed(room)],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('読み上げを終了できませんでした。', e)],
    });
  }
}
