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
    const speaker = await rooms.getOrCreateSpeaker(
      interaction.guildId,
      interaction.user
    );
    speaker.setRandomOptions();
    await rooms.setSpeakerOption(
      interaction.guildId,
      interaction.user,
      speaker.options
    );

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
