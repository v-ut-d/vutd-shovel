import type { ApplicationCommandData, CommandInteraction } from 'discord.js';
import * as get from './get';
import * as set from './set';
import * as del from './delete';
import type { PermissionSetterFunction } from '..';
import type { GuildSettings } from '@prisma/client';

/**
 * `/dict` command data.
 */
export const data: ApplicationCommandData = {
  name: 'dict',
  description: '辞書に関するコマンド群です。',
  defaultPermission: false,
  options: [get.data, set.data, del.data],
};

/**
 * `/dict` command permission data.
 */
export const permissions: PermissionSetterFunction = (
  guildSettings: GuildSettings
) => {
  return [
    {
      type: 'ROLE',
      id: guildSettings.dictionaryWriteRole,
      permission: true,
    },
  ];
};

/**
 * handles `/dict` subcommands.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  const subcommand = interaction.options.getSubcommand(true);
  switch (subcommand) {
    case 'get':
      return get.handle(interaction);
    case 'set':
      return set.handle(interaction);
    case 'delete':
      return del.handle(interaction);
  }
}
