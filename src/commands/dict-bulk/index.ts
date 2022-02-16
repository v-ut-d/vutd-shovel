import type {
  ApplicationCommandData,
  ApplicationCommandPermissions,
  CommandInteraction,
} from 'discord.js';
import { env } from '../../utils';
import * as export_ from './export';
import * as import_ from './import';

const { MANAGE_ID } = env;

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
export const permissions: ApplicationCommandPermissions[] = [
  {
    type: 'ROLE',
    id: MANAGE_ID,
    permission: true,
  },
];

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
