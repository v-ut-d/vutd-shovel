import type {
  ApplicationCommandData,
  ChatInputCommandInteraction,
} from 'discord.js';
import * as get from './get';
import * as random from './random';
import * as set from './set';

/**
 * `/voice` command data.
 */
export const data: ApplicationCommandData = {
  name: 'voice',
  description: '自分の読み上げ設定に関するコマンド群です。',
  options: [get.data, random.data, set.data],
};

/**
 * handles `/voice` subcommands.
 */
export async function handle(
  interaction: ChatInputCommandInteraction<'cached'>
) {
  const subcommand = interaction.options.getSubcommand(true);
  switch (subcommand) {
    case 'get':
      return get.handle(interaction);
    case 'random':
      return random.handle(interaction);
    case 'set':
      return set.handle(interaction);
  }
}
