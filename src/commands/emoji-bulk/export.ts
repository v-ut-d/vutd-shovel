import type {
  ApplicationCommandSubCommandData,
  CommandInteraction,
} from 'discord.js';
import fs from 'fs';
import { EmojiBulkMessageEmbed, ErrorMessageEmbed } from '../../components';
import { prisma } from '../../database';

/**
 * `/emoji-bulk export` command data.
 */
export const data: ApplicationCommandSubCommandData = {
  name: 'export',
  type: 'SUB_COMMAND',
  description: '絵文字の読み方をまとめて出力します。',
};

/**
 * handles `/emoji-bulk export` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    const [emojisAll, emojisDb] = await Promise.all([
      interaction.guild.emojis.fetch(),
      prisma.emoji.findMany({
        where: {
          guildId: interaction.guildId,
        },
      }),
    ]);

    const rows: string[] = [];

    emojisDb.forEach((emojiDb) => {
      const emojiDiscord = emojisAll.get(emojiDb.emojiId);
      if (emojiDiscord) rows.push(`${emojiDiscord}, ${emojiDb.pronounciation}`);
    });

    const csv = rows.join('\n');
    const fileName = `dictionary/${interaction.guildId}_export.dict`;
    fs.writeFileSync(fileName, csv, 'utf-8');

    await interaction.reply({
      embeds: [new EmojiBulkMessageEmbed('export', rows.length)],
      files: [fileName],
    });

    fs.rmSync(fileName);
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('辞書設定', e)],
    });
  }
}
