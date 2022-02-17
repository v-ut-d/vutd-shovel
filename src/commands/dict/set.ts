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
      required: true,
    },
    {
      name: 'toword',
      type: 'STRING',
      description:
        '置換先の単語です。辞書に登録された別の単語を入れると意図しない挙動となる可能性があります。',
      required: true,
    },
  ],
};

/**
 * handles `/dict get` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    const fromWord = interaction.options.getString('fromword', true);
    const toWord = interaction.options.getString('toword', true);
    const emojiInfo = fromWord.match(/^<:(.+?):(?<emojiId>\d{18})>$/);
    // emojiInfo.groups always exist
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (emojiInfo?.groups!.emojiId) {
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
        .catch(() => {
          throw new Error('データベースへの登録に失敗しました。');
        });

      const roomCollection = rooms.get(interaction.guildId);
      if (roomCollection) {
        await roomCollection.each((room) => room.reloadEmojiDict());
      }
    } else {
      await prisma.guildDictionary
        .upsert({
          where: {
            guildId_replaceFrom: {
              guildId: interaction.guildId,
              replaceFrom: fromWord,
            },
          },
          update: {
            replaceTo: toWord,
          },
          create: {
            guildId: interaction.guildId,
            replaceFrom: fromWord,
            replaceTo: toWord,
          },
        })
        .catch(() => {
          throw new Error('データベースへの登録に失敗しました。');
        });

      const roomCollection = rooms.get(interaction.guildId);
      if (roomCollection) {
        await roomCollection.each((room) => room.reloadGuildDict());
      }
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
