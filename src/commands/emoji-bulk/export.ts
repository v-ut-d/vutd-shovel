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
    const emojis = await prisma.emoji.findMany({
      where: {
        guildId: interaction.guildId,
      },
    });

    const emojiMap: Map<
      string,
      {
        id: string;
        pronounciation: string;
        emojiName: string | null;
        animated: boolean | null;
      }
    > = new Map();
    emojis.forEach((emoji) => {
      emojiMap.set(emoji.emojiId, {
        id: emoji.emojiId,
        pronounciation: emoji.pronounciation,
        emojiName: null,
        animated: null,
      });
    });
    (await interaction.guild.emojis.fetch()).forEach((emoji) => {
      const emojiobj = emojiMap.get(emoji.id);
      if (emojiobj) {
        emojiobj.emojiName = emoji.name;
        emojiobj.animated = emoji.animated;
      }
    });

    const csv = Array.from(emojiMap.values())
      .map<string>(
        (v) =>
          `<${v.animated ? 'a' : ''}:${v.emojiName}:${v.id}>,${
            v.pronounciation
          }`
      )
      .join('\n');
    const fileName = `dictionary/${interaction.guildId}_export.dict`;
    fs.writeFileSync(fileName, csv, 'utf-8');

    await interaction.reply({
      embeds: [new EmojiBulkMessageEmbed('export', emojis.length)],
      files: [fileName],
    });

    fs.rmSync(fileName);
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('辞書設定', e)],
    });
  }
}
