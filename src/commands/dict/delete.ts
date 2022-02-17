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
  name: 'delete',
  type: 'SUB_COMMAND',
  description: '単語を削除します。',
  options: [
    {
      name: 'word',
      type: 'STRING',
      description:
        '削除する単語です。ただし、絵文字の場合は一文字で入力してください。',
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
      const emoji = await prisma.emoji
        .delete({
          where: {
            guildId_emojiId: {
              guildId: interaction.guildId,
              emojiId: emojiInfo.groups.emojiId,
            },
          },
        })
        .catch(() =>
          Promise.reject(
            'データベースからの削除に失敗しました。' +
              '単語が登録されているかどうか確認してください。'
          )
        );

      const roomCollection = rooms.get(interaction.guildId);
      if (roomCollection) {
        await roomCollection.each((room) => room.reloadEmojiDict());
      }

      const toWord = emoji.pronounciation;
      await interaction.reply({
        embeds: [new DictMessageEmbed('delete', fromWord, toWord)],
      });
    } else {
      const entry = await prisma.guildDictionary
        .delete({
          where: {
            guildId_replaceFrom: {
              guildId: interaction.guildId,
              replaceFrom: fromWord,
            },
          },
        })
        .catch(() =>
          Promise.reject(
            'データベースからの削除に失敗しました。' +
              '単語が登録されているかどうか確認してください。'
          )
        );

      const roomCollection = rooms.get(interaction.guildId);
      if (roomCollection) {
        await roomCollection.each((room) => room.reloadGuildDict());
      }
      const toWord = entry.replaceTo;
      await interaction.reply({
        embeds: [new DictMessageEmbed('delete', fromWord, toWord)],
      });
    }
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('辞書設定', e)],
    });
  }
}
