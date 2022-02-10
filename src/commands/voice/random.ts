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
  description: '読み上げ設定をランダムに変更します。',
};

/**
 * handles `/voice random` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    const roomCollection = rooms.get(interaction.guildId);
    const roomR = roomCollection?.first();
    if (!roomCollection || !roomR)
      throw new Error('現在読み上げ中ではありません。');

    const speakerR = await roomR.getOrCreateSpeaker(interaction.user);
    speakerR.setRandomOptions();

    await Promise.all(
      roomCollection.map(async (room) => {
        const speaker = await room.getOrCreateSpeaker(interaction.user);
        speaker.options = speakerR.options;
      })
    );

    await prisma.member.update({
      where: {
        guildId_userId: {
          guildId: interaction.guildId,
          userId: interaction.user.id,
        },
      },
      data: speakerR.options,
    });

    await interaction.reply({
      embeds: [new VoiceMessageEmbed('set', speakerR.options)],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('読み上げ設定', e)],
    });
  }
}
