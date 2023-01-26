import {
  ApplicationCommandSubCommandData,
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from 'discord.js';
import { ErrorMessageEmbed, VoiceMessageEmbed } from '../../components';
import { speakers } from '../../speakers';

/**
 * `/voice get` command data.
 */
export const data: ApplicationCommandSubCommandData = {
  name: 'get',
  type: ApplicationCommandOptionType.Subcommand,
  description: '現在の読み上げ設定を表示します。',
};

/**
 * handles `/voice get` command.
 */
export async function handle(
  interaction: ChatInputCommandInteraction<'cached'>
) {
  try {
    const fields = await speakers.display(interaction.member);
    await interaction.reply({
      embeds: [new VoiceMessageEmbed('get', fields)],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('読み上げ設定', e)],
    });
  }
}
