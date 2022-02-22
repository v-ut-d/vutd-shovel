import type { ApplicationCommandData, CommandInteraction } from 'discord.js';
import { ErrorMessageEmbed, HelpMessageEmbed } from '../components';

/**
 * `/help` command data.
 */
export const data: ApplicationCommandData = {
  name: 'help',
  description: '使い方を表示します。',
};

/**
 * handles `/help` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    await interaction.reply({
      embeds: [new HelpMessageEmbed()],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('使い方を表示できませんでした。', e)],
    });
  }
}
