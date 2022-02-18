import type { GuildSettings } from '@prisma/client';
import type { ApplicationCommandData, CommandInteraction } from 'discord.js';
import type { PermissionSetterFunction } from '..';
import * as export_ from './export';
import * as import_ from './import';

export const s = Symbol('dict-bulk');

/**
 * `/dict-bulk` command data.
 */
export const data: ApplicationCommandData = {
  name: 'dict-bulk',
  description: 'サーバー辞書をまとめて操作するためのコマンドです。',
  defaultPermission: false,
  options: [export_.data, import_.data],
};

/**
 * `/dict-bulk` command permission data.
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
 * handles `/dict-bulk` subcommands.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  const subcommand = interaction.options.getSubcommand(true);
  switch (subcommand) {
    case 'export':
      return export_.handle(interaction);
    case 'import':
      return import_.handle(interaction);
  }
}
