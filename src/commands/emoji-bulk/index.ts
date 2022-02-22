import type { GuildSettings } from '@prisma/client';
import type { ApplicationCommandData, CommandInteraction } from 'discord.js';
import type { PermissionSetterFunction } from '..';
import * as export_ from './export';
import * as import_ from './import';
import * as keys from './keys';

/**
 * `/emoji-bulk` command data.
 */
export const data: ApplicationCommandData = {
  name: 'emoji-bulk',
  description:
    'サーバー絵文字の読み上げ方をまとめて操作するためのコマンドです。',
  defaultPermission: false,
  options: [export_.data, import_.data, keys.data],
};

/**
 * `/emoji-bulk` command permission data.
 */
export const permissions: PermissionSetterFunction = (
  guildSettings: GuildSettings
) => {
  return guildSettings.moderatorRole
    ? [
        {
          type: 'ROLE',
          id: guildSettings.moderatorRole,
          permission: true,
        },
      ]
    : [];
};

/**
 * handles `/emoji-bulk` subcommands.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  const subcommand = interaction.options.getSubcommand(true);
  switch (subcommand) {
    case 'export':
      return export_.handle(interaction);
    case 'import':
      return import_.handle(interaction);
    case 'keys':
      return keys.handle(interaction);
  }
}
