import type {
  ApplicationCommandSubCommandData,
  CommandInteraction,
} from 'discord.js';
import { ErrorMessageEmbed } from '../../components';
import SettingMessageEmbed from '../../components/setting';
import { prisma } from '../../database';

/**
 * `/setting get` command data.
 */
export const data: ApplicationCommandSubCommandData = {
  name: 'get',
  type: 'SUB_COMMAND',
  description: '現在のサーバー全体の設定を表示します。',
};

/**
 * handles `/setting get` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    const setting = await prisma.guildSettings.upsert({
      where: {
        guildId: interaction.guildId,
      },
      create: {
        guildId: interaction.guildId,
        dictionaryWriteRole: interaction.guild.roles.everyone.id,
      },
      update: {},
    });

    const moderatorRoleName = setting.moderatorRole
      ? `${
          (await interaction.guild.roles.fetch(setting.moderatorRole)) ??
          'Not Found'
        }`
      : 'Not set';

    const dictRoleName = setting.dictionaryWriteRole
      ? `${
          (await interaction.guild.roles.fetch(setting.dictionaryWriteRole)) ??
          'Not Found'
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

    await interaction.reply({
      embeds: [
        new SettingMessageEmbed('get', {
          setting: setting,
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
