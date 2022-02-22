import type {
  ApplicationCommandSubCommandData,
  CommandInteraction,
} from 'discord.js';
import { ErrorMessageEmbed } from '../../components';
import SettingMessageEmbed from '../../components/setting';
import { prisma } from '../../database';
import rooms from '../../rooms';
import commands from '..';

/**
 * `/setting set` command data.
 */
export const data: ApplicationCommandSubCommandData = {
  name: 'set',
  type: 'SUB_COMMAND',
  description: 'サーバー全体の設定を指定して変更します。',
  options: [
    {
      name: 'read_multiline',
      type: 'BOOLEAN',
      description: '複数行のメッセージで、二行目以降を読むかどうか設定します。',
    },
    {
      name: 'read_speakers_name',
      type: 'BOOLEAN',
      description:
        '読み上げるとき、発言者の名前を読み上げるかどうか設定します。',
    },
    {
      name: 'read_emojis',
      type: 'BOOLEAN',
      description:
        'ギルド絵文字・Unicode絵文字を読み上げるかどうか設定します。',
    },
    {
      name: 'omit_threshold',
      type: 'INTEGER',
      description: '「以下略」にならない最長のメッセージの長さを設定します。',
      minValue: 0,
      maxValue: 10000,
    },
    {
      name: 'moderator_role',
      type: 'ROLE',
      description:
        '/dict-bulk、/emoji-bulk、/settingを使えるユーザーのロールを指定します。',
    },
    {
      name: 'dictionary_write_role',
      type: 'ROLE',
      description: '/dictを使えるユーザーのロールを指定します。',
    },
  ],
};

/**
 * handles `/setting set` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    const setting = {
      guildId: interaction.guildId,
      moderatorRole:
        interaction.options.getRole('moderator_role')?.id ?? undefined,
      dictionaryWriteRole:
        interaction.options.getRole('dictionary_write_role')?.id ?? undefined,
      readSpeakersName:
        interaction.options.getBoolean('read_speakers_name') ?? undefined,
      readMultiLine:
        interaction.options.getBoolean('read_multiline') ?? undefined,
      readEmojis: interaction.options.getBoolean('read_emojis') ?? undefined,
      omitThreshold:
        interaction.options.getInteger('omit_threshold') ?? undefined,
    };

    const writtenSetting = await prisma.guildSettings.upsert({
      where: {
        guildId: interaction.guildId,
      },
      create: {
        ...setting,
        dictionaryWriteRole:
          setting.dictionaryWriteRole ?? interaction.guild.roles.everyone.id,
      },
      update: setting,
    });

    const roomCollection = rooms.get(interaction.guildId);
    if (roomCollection) {
      await Promise.all(roomCollection.map((room) => room.loadGuildSettings()));
    }

    const moderatorRoleName = writtenSetting.moderatorRole
      ? `${
          (await interaction.guild.roles.fetch(writtenSetting.moderatorRole)) ??
          'Not Found'
        }`
      : 'Not set';

    const dictRoleName = writtenSetting.dictionaryWriteRole
      ? `${
          (await interaction.guild.roles.fetch(
            writtenSetting.dictionaryWriteRole
          )) ?? 'Not Found'
        }`
      : '@everyone';

    const numberOfEmojis = await prisma.emoji.count({
      where: {
        guildId: interaction.guildId,
      },
    });
    const numberOfDictEntries = await prisma.guildDictionary.count({
      where: {
        guildId: interaction.guildId,
      },
    });

    commands.setPermission(writtenSetting, interaction.guild);

    await interaction.reply({
      embeds: [
        new SettingMessageEmbed('set', {
          setting: writtenSetting,
          moderatorRoleName,
          dictRoleName,
          numberOfEmojis,
          numberOfDictEntries,
        }),
      ],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('サーバー設定', e)],
    });
  }
}
