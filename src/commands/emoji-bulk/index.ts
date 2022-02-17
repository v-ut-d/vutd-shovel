import type {
  ApplicationCommandData,
  ApplicationCommandPermissions,
  CommandInteraction,
} from 'discord.js';
import { env } from '../../utils';
import * as export_ from './export';
import * as import_ from './import';
import * as keys from './keys';

export const s = Symbol('emoji-bulk');

const { MANAGE_ID } = env;

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
export const permissions: ApplicationCommandPermissions[] = [
  {
    type: 'ROLE',
    id: MANAGE_ID,
    permission: true,
  },
];

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
