import type {
  ApplicationCommandData,
  ApplicationCommandPermissions,
  CommandInteraction,
} from 'discord.js';
import * as get from './get';
import * as set from './set';
import * as del from './delete';

/**
 * `/voice` command data.
 */
export const data: ApplicationCommandData = {
  name: 'dict',
  description: '辞書に関するコマンド群です。',
  options: [get.data, set.data, del.data],
};

/**
 * `/voice` command permission data.
 */
export const permissions: ApplicationCommandPermissions[] = [];

/**
 * handles `/voice` subcommands.
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
