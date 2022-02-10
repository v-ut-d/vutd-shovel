import type {
  ApplicationCommandSubCommandData,
  CommandInteraction,
} from 'discord.js';
import { DictMessageEmbed, ErrorMessageEmbed } from '../../components';
import { prisma } from '../../database';

/**
 * `/dict get` command data.
 */
export const data: ApplicationCommandSubCommandData = {
  name: 'get',
  type: 'SUB_COMMAND',
  description: '指定された単語の登録状況を表示します。',
  options: [
    {
      name: 'word',
      type: 'STRING',
      description:
        '登録情報を検索する単語です。ただし、絵文字の場合は一文字で入力してください。',
      required: true,
    },
  ],
};

/**
 * handles `/dict get` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    const fromWord = interaction.options.getString('word', true);
    const emojiInfo = fromWord.match(/^<:(.+?):(?<emojiId>\d{18})>$/);
    if (emojiInfo?.groups?.emojiId) {
      //FromWord is Emoji
      const emoji = await prisma.emoji.findUnique({
        where: {
          guildId_emojiId: {
            guildId: interaction.guildId,
            emojiId: emojiInfo.groups.emojiId,
          },
        },
      });
      if (!emoji)
        throw new Error('指定された絵文字の読みは登録されていません。');

      const toWord = emoji.pronounciation;
      await interaction.reply({
        embeds: [new DictMessageEmbed('get', fromWord, toWord)],
      });
    } else {
      throw new Error('絵文字以外の単語登録は実装されていません。');
    }
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('辞書設定', e)],
    });
  }
}