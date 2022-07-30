import {
  ApplicationCommandData,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import * as export_ from './export';
import * as import_ from './import';

/**
 * `/dict-bulk` command data.
 */
export const data: ApplicationCommandData = {
  name: 'dict-bulk',
  description: 'サーバー辞書をまとめて操作するためのコマンドです。',
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [export_.data, import_.data],
};

/**
 * handles `/dict-bulk` subcommands.
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
  }
}
