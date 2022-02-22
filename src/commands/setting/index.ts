import {
  ApplicationCommandData,
  CommandInteraction,
  Guild,
  Permissions,
} from 'discord.js';

import * as get from './get';
import * as set from './set';

import type { PermissionSetterFunction } from '..';
import type { GuildSettings } from '@prisma/client';
import { prisma } from '../../database';
import { ErrorMessageEmbed } from '../../components';

/**
 * `/setting` command data.
 */
export const data: ApplicationCommandData = {
  name: 'setting',
  description: 'サーバー全体の設定を変更・取得するコマンドです。',
  defaultPermission: false,
  options: [get.data, set.data],
};

/**
 * `/setting` command permission data.
 */
export const permissions: PermissionSetterFunction = (
  guildSettings: GuildSettings,
  guild: Guild
) => {
  const modRole = guildSettings.moderatorRole ?? guild.roles.everyone.id;
  return [
    {
      type: 'ROLE',
      /*
       * The handler of /settings checks the users' role, so permission can be
       * set to everyone. Also moderatorRole is set by /setting, so /setting
       * should be accesible even when moderatorRole is null.
       */
      id: modRole,
      permission: true,
    },
  ];
};

/**
 * handles `/setting` subcommands.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  //Permission Check
  const roleSetting = await prisma.guildSettings.findUnique({
    where: {
      guildId: interaction.guildId,
    },
    select: {
      moderatorRole: true,
    },
  });
  if (roleSetting?.moderatorRole) {
    if (!interaction.member.roles.cache.has(roleSetting.moderatorRole)) {
      //This should not happen.
      const mod = await interaction.guild.roles.fetch(
        roleSetting.moderatorRole
      );
      const message = `このサーバーでモデレーターロールとして設定されている${mod}を持っている人だけが/settingを使用できます。`;
      await interaction.reply({
        embeds: [new ErrorMessageEmbed('サーバー設定', new Error(message))],
      });
      return;
    }
  } else {
    if (!interaction.memberPermissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
      const message =
        '現在このサーバーで管理者権限を持っている人だけが/settingを使用できます。' +
        '/setting setでmoderator_roleを設定するとこれは上書きされます';
      await interaction.reply({
        embeds: [new ErrorMessageEmbed('サーバー設定', new Error(message))],
      });
      return;
    }
  }

  const subcommand = interaction.options.getSubcommand(true);
  switch (subcommand) {
    case 'get':
      return get.handle(interaction);
    case 'set':
      return set.handle(interaction);
  }
}
