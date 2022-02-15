import type {
  ApplicationCommandSubCommandData,
  CommandInteraction,
} from 'discord.js';
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

    await interaction.reply({
      embeds: [new EmojiBulkMessageEmbed('export', rows.length)],
      files: [
        {
          attachment: Buffer.from(csv),
          name: `dictionary/${interaction.guildId}_export.dict`,
        },
      ],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('辞書設定', e)],
    });
  }
}
