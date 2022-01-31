import type {
  ApplicationCommandSubCommandData,
  CommandInteraction,
} from 'discord.js';
import { ErrorMessageEmbed, VoiceMessageEmbed } from '../../components';
import rooms from '../../rooms';

/**
 * `/voice get` command data.
 */
export const data: ApplicationCommandSubCommandData = {
  name: 'get',
  type: 'SUB_COMMAND',
  description: '現在の読み上げ設定を表示します。',
};

/**
 * handles `/voice get` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    const room = rooms.get(interaction.guildId);
    if (!room) throw new Error('現在読み上げ中ではありません。');

    const speaker = room.getOrCreateSpeaker(interaction.user);
    await interaction.reply({
      embeds: [new VoiceMessageEmbed('get', speaker.options)],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('読み上げ設定', e)],
    });
  }
}
