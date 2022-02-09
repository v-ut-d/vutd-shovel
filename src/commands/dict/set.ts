import type {
  ApplicationCommandSubCommandData,
  CommandInteraction,
} from 'discord.js';
import { DictMessageEmbed, ErrorMessageEmbed } from '../../components';
import { prisma } from '../../database';
import rooms from '../../rooms';

/**
 * `/dict get` command data.
 */
export const data: ApplicationCommandSubCommandData = {
  name: 'set',
  type: 'SUB_COMMAND',
  description: '単語を登録または更新します。',
  options: [
    {
      name: 'fromword',
      type: 'STRING',
      description: '置換元の単語です。絵文字は一文字で入力してください。',
    },
    {
      name: 'toword',
      type: 'STRING',
      description:
        '置換先の単語です。辞書に登録された別の単語を入れると意図しない挙動となる可能性があります。',
    },
  ],
};

/**
 * handles `/voice get` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    const fromWord = interaction.options.getString('fromword', true);
    const toWord = interaction.options.getString('toword', true);
    const emojiInfo = fromWord.match(/^<:(.+?):(?<emojiId>\d{18})>$/);
    if (emojiInfo?.groups?.emojiId) {
      //FromWord is Emoji
      await prisma.emoji
        .upsert({
          where: {
            guildId_emojiId: {
              guildId: interaction.guildId,
              emojiId: emojiInfo.groups.emojiId,
            },
          },
          update: {
            pronounciation: toWord,
          },
          create: {
            guildId: interaction.guildId,
            emojiId: emojiInfo.groups.emojiId,
            pronounciation: toWord,
          },
        })
        .catch(() => Promise.reject('データベースへの登録に失敗しました。'));

      const room = rooms.get(interaction.guildId);
      if (room) {
        await room.reloadEmojiDict();
      }
    } else {
      throw new Error('絵文字以外の単語登録は実装されていません。');
    }
    await interaction.reply({
      embeds: [new DictMessageEmbed('set', fromWord, toWord)],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('辞書設定', e)],
    });
  }
}
