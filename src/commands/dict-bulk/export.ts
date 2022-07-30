import {
  ApplicationCommandSubCommandData,
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from 'discord.js';
import { DictBulkMessageEmbed, ErrorMessageEmbed } from '../../components';
import { prisma } from '../../database';

/**
 * `/dict-bulk export` command data.
 */
export const data: ApplicationCommandSubCommandData = {
  name: 'export',
  type: ApplicationCommandOptionType.Subcommand,
  description: 'サーバー辞書をまとめて出力します。',
};

/**
 * handles `/dict-bulk export` command.
 */
export async function handle(
  interaction: ChatInputCommandInteraction<'cached'>
) {
  try {
    const dictEntries = await prisma.guildDictionary.findMany({
      where: {
        guildId: interaction.guildId,
      },
    });

    const rows = dictEntries.map(
      (entry) => `${entry.replaceFrom},${entry.replaceTo}`
    );

    const csv = rows.join('\n');

    await interaction.reply({
      embeds: [new DictBulkMessageEmbed('export', rows.length)],
      files: [
        {
          attachment: Buffer.from(csv),
          name: `${interaction.guildId}_export.dict`,
        },
      ],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('辞書設定', e)],
    });
  }
}
