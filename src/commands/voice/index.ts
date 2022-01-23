import {
  ApplicationCommandData,
  ApplicationCommandPermissions,
  CommandInteraction,
} from 'discord.js';
import * as get from './get';
import * as random from './random';

/**
 * `/voice` command data.
 */
export const data: ApplicationCommandData = {
  name: 'voice',
  description: '自分の読み上げ設定に関するコマンド群です。',
  options: [get.data, random.data],
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
      return;
    case 'random':
      return random.handle(interaction);
  }
}
