import axios from 'axios';
import type {
  ApplicationCommandSubCommandData,
  CommandInteraction,
} from 'discord.js';
import { DictBulkMessageEmbed, ErrorMessageEmbed } from '../../components';
import { prisma } from '../../database';

/**
 * `/dict-bulk import` command data.
 */
export const data: ApplicationCommandSubCommandData = {
  name: 'import',
  type: 'SUB_COMMAND',
  description: '辞書にまとめて単語を登録します。',
};

/**
 * handles `/dict-bulk import` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    if (!interaction.channel)
      throw new Error(
        'サーバーのこのbotが閲覧可能なチャンネル内で実行してください。'
      );

    await interaction.reply({
      embeds: [new DictBulkMessageEmbed('import-request')],
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

    const entries = text
      .split('\n')
      .map((row) => row.split(','))
      .filter(
        (cols) => cols.length === 2 && cols[0].length > 0 && cols[1].length > 0
      )
      .map((cols) => {
        const [from, to] = cols;
        return {
          replaceFrom: from,
          replaceTo: to,
        };
      });

    await prisma.$transaction([
      prisma.guildDictionary.deleteMany({
        where: {
          guildId: interaction.guildId,
          replaceFrom: {
            in: entries.map(({ replaceFrom }) => replaceFrom),
          },
        },
      }),
      prisma.guildDictionary.createMany({
        data: entries.map((entry) => ({
          guildId: interaction.guildId,
          ...entry,
        })),
      }),
    ]);

    await interaction.followUp({
      embeds: [new DictBulkMessageEmbed('import-complete', entries.length)],
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
