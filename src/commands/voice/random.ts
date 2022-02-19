import type {
  ApplicationCommandSubCommandData,
  CommandInteraction,
} from 'discord.js';
import { ErrorMessageEmbed, VoiceMessageEmbed } from '../../components';
import { prisma } from '../../database';
import rooms from '../../rooms';

/**
 * `/voice random` command data.
 */
export const data: ApplicationCommandSubCommandData = {
  name: 'random',
  type: 'SUB_COMMAND',
  description: '読み上げる声の設定をランダムに変更します。',
};

/**
 * handles `/voice random` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    const room = rooms.get(interaction.guildId);
    if (!room) throw new Error('現在読み上げ中ではありません。');

    const speaker = await room.getOrCreateSpeaker(interaction.user);
    speaker.setRandomOptions();
    await prisma.member.update({
      where: {
        guildId_userId: {
          guildId: interaction.guildId,
          userId: interaction.user.id,
        },
      },
      data: speaker.options,
    });
    await interaction.reply({
      embeds: [new VoiceMessageEmbed('set', speaker.options)],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('読み上げ設定', e)],
    });
  }
}
