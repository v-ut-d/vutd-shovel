import type {
  ApplicationCommandData,
  ApplicationCommandPermissions,
  CommandInteraction,
} from 'discord.js';
import { ErrorMessageEmbed, HelpMessageEmbed } from '../components';

/**
 * `/help` command data.
 */
export const data: ApplicationCommandData = {
  name: 'help',
  description: '使い方を表示します。',
};

/**
 * `/help` command permission data.
 */
export const permissions: ApplicationCommandPermissions[] = [];

/**
 * handles `/help` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    const textChannel = interaction.channel;
    if (!textChannel)
      throw new Error('テキストチャンネルを取得できませんでした。');

    const me = interaction.guild.me;
    if (!me) throw new Error('データを取得できませんでした。');

    await interaction.reply({
      embeds: [new HelpMessageEmbed()],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('使い方を表示できませんでした。', e)],
    });
  }
}
