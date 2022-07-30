import {
  ApplicationCommandData,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';

import * as get from './get';
import * as set from './set';

/**
 * `/setting` command data.
 */
export const data: ApplicationCommandData = {
  name: 'setting',
  description: 'サーバー全体の設定を変更・取得するコマンドです。',
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [get.data, set.data],
};

/**
 * handles `/setting` subcommands.
 */
export async function handle(
  interaction: ChatInputCommandInteraction<'cached'>
) {
  const subcommand = interaction.options.getSubcommand(true);
  switch (subcommand) {
    case 'get':
      return get.handle(interaction);
    case 'set':
      return set.handle(interaction);
  }
}
