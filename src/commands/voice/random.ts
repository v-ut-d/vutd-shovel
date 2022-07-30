import {
  ApplicationCommandSubCommandData,
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from 'discord.js';
import { ErrorMessageEmbed, VoiceMessageEmbed } from '../../components';
import { speakerManager } from '../../speakers';

/**
 * `/voice random` command data.
 */
export const data: ApplicationCommandSubCommandData = {
  name: 'random',
  type: ApplicationCommandOptionType.Subcommand,
  description: '読み上げる声の設定をランダムに変更します。',
};

/**
 * handles `/voice random` command.
 */
export async function handle(
  interaction: ChatInputCommandInteraction<'cached'>
) {
  try {
    await speakerManager.random(interaction.member);
    const fields = await speakerManager.display(interaction.member);
    await interaction.reply({
      embeds: [new VoiceMessageEmbed('set', fields)],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('読み上げ設定', e)],
    });
  }
}
