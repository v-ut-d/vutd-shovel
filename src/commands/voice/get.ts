import {
  ApplicationCommandSubCommandData,
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from 'discord.js';
import { ErrorMessageEmbed, VoiceMessageEmbed } from '../../components';
import rooms from '../../rooms';

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
    const speaker = await rooms.getOrCreateSpeaker(
      interaction.guildId,
      interaction.user
    );
    await interaction.reply({
      embeds: [new VoiceMessageEmbed('get', speaker.options)],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('読み上げ設定', e)],
    });
  }
}
