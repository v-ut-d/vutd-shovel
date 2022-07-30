import type {
  ApplicationCommandData,
  ChatInputCommandInteraction,
} from 'discord.js';
import rooms from '../rooms';

/**
 * `/cancel` command data.
 */
export const data: ApplicationCommandData = {
  name: 'cancel',
  description: '今行っている読み上げを中断します。',
};

/**
 * handles `/cancel` command.
 */
export async function handle(
  interaction: ChatInputCommandInteraction<'cached'>
) {
  try {
    rooms.cancel(interaction.guildId);
    await interaction.reply({
      content: '読み上げを中断しました。',
      ephemeral: true,
    });
  } catch (e) {
    await interaction.reply({
      content: `読み上げを中断できませんでした:\n${(e as Error).message}`,
      ephemeral: true,
    });
  }
}
