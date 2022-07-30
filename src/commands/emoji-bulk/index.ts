import {
  ApplicationCommandData,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
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
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [export_.data, import_.data, keys.data],
};

/**
 * handles `/emoji-bulk` subcommands.
 */
export async function handle(
  interaction: ChatInputCommandInteraction<'cached'>
) {
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
