import type {
  ApplicationCommandSubCommandData,
  CommandInteraction,
} from 'discord.js';
import fs from 'fs';
import { EmojiBulkMessageEmbed, ErrorMessageEmbed } from '../../components';
import { prisma } from '../../database';

/**
 * `/emoji-bulk keys` command data.
 */
export const data: ApplicationCommandSubCommandData = {
  name: 'keys',
  type: 'SUB_COMMAND',
  description: '読み方が設定されていない絵文字のリストを出力します。',
};

/**
 * handles `/emoji-bulk keys` command.
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

    const rows = emojisAll
      .filter((_, id) => !emojisDb.some((emoji) => emoji.emojiId === id))
      .map((emoji) => `${emoji}, `);
    const csv = rows.join('\n');
    const fileName = `dictionary/${interaction.guildId}_keys.dict`;
    fs.writeFileSync(fileName, csv, 'utf-8');

    await interaction.reply({
      embeds: [new EmojiBulkMessageEmbed('keys', rows.length)],
      files: [fileName],
    });

    fs.rmSync(fileName);
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('辞書設定', e)],
    });
  }
}
