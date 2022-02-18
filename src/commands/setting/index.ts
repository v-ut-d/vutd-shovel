import type {
  ApplicationCommandData,
  ApplicationCommandPermissions,
  CommandInteraction,
} from 'discord.js';

import * as get from './get';
import * as set from './set';

import { env } from '../../utils';

export const s = Symbol('setting');

const { MANAGE_ID } = env;

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
export const permissions: ApplicationCommandPermissions[] = [
  {
    type: 'ROLE',
    id: MANAGE_ID,
    permission: true,
  },
];

/**
 * handles `/setting` subcommands.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  const subcommand = interaction.options.getSubcommand(true);
  switch (subcommand) {
    case 'get':
      return get.handle(interaction);
    case 'set':
      return set.handle(interaction);
  }
}
