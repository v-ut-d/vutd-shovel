import type { Emoji } from '@prisma/client';
import axios from 'axios';
import {
  ApplicationCommandSubCommandData,
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from 'discord.js';
import { EmojiBulkMessageEmbed, ErrorMessageEmbed } from '../../components';
import { prisma } from '../../database';

/**
 * `/emoji-bulk import` command data.
 */
export const data: ApplicationCommandSubCommandData = {
  name: 'import',
  type: ApplicationCommandOptionType.Subcommand,
  description: '絵文字の読み方をまとめて登録します。',
};

/**
 * handles `/emoji-bulk import` command.
 */
export async function handle(
  interaction: ChatInputCommandInteraction<'cached'>
) {
  try {
    if (!interaction.channel)
      throw new Error(
        'サーバーのこのbotが閲覧可能なチャンネル内で実行してください。'
      );

    await interaction.reply({
      embeds: [new EmojiBulkMessageEmbed('import-request')],
    });

    const messages = await interaction.channel
      ?.awaitMessages({
        filter: (message) => message.attachments.size > 0,
        time: 5 * 60 * 1000,
        max: 1,
        errors: ['time', 'max'],
      })
      .catch(() => {
        throw new Error(
          'ファイルが5分以内に送信されませんでした。インポートを中断します。'
        );
      });

    // `messages` always includes one message due to awaitMessagesOptions.max
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { attachments } = messages.first()!;

    const reses = await Promise.allSettled(
      attachments.map((attachment) => axios.get(attachment.url))
    );
    const datas = reses
      .filter(fulfilledFilter)
      .map((promise) => promise.value.data);
    const text = datas.filter(isTextFilter).join('\n');

    const matches = [
      ...text.matchAll(
        // eslint-disable-next-line no-irregular-whitespace
        /^<a?:.+?:(?<emojiId>\d{18})>, ?(?<pronounciation>[^\s　]+)$/gm
      ),
    ]
      // 'as' assertion; regexp above guarantees this
      .map(({ groups }) => groups as Omit<Emoji, 'guildId'>);

    await prisma.$transaction([
      prisma.emoji.deleteMany({
        where: {
          guildId: interaction.guildId,
          emojiId: {
            in: matches.map(({ emojiId }) => emojiId),
          },
        },
      }),
      prisma.emoji.createMany({
        data: matches.map((match) => ({
          guildId: interaction.guildId,
          ...match,
        })),
      }),
    ]);

    await interaction.followUp({
      embeds: [new EmojiBulkMessageEmbed('import-complete', matches.length)],
    });
  } catch (e) {
    const method = interaction.replied ? 'followUp' : 'reply';
    await interaction[method]({
      embeds: [new ErrorMessageEmbed('辞書設定', e)],
    });
  }
}

function fulfilledFilter<T>(
  result: PromiseSettledResult<T>
): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled';
}

function isTextFilter(result: unknown): result is string {
  return typeof result == 'string';
}
