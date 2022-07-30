import type {
  ApplicationCommandData,
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
};

/**
 * handles `/end` command.
 */
export async function handle(
  interaction: ChatInputCommandInteraction<'cached'>
) {
  try {
    const room = rooms.destroy(interaction.guildId);
    await interaction.reply({
      embeds: [new EndMessageEmbed(room)],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('読み上げを終了できませんでした。', e)],
    });
  }
}
