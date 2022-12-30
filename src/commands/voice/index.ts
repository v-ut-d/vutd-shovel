import type {
  ApplicationCommandData,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
} from 'discord.js';
import * as get from './get';
import * as random from './random';
import * as openjtalk from './openjtalk';
import * as voicevox from './voicevox';

/**
 * `/voice` command data.
 */
export const data: ApplicationCommandData = {
  name: 'voice',
  description: '自分の読み上げ設定に関するコマンド群です。',
  options: [get.data, random.data, openjtalk.data, voicevox.data],
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
    case 'openjtalk':
      return openjtalk.handle(interaction);
    case 'voicevox':
      return voicevox.handle(interaction);
  }
}

export async function autocomplete(
  interaction: AutocompleteInteraction<'cached'>
) {
  const subcommand = interaction.options.getSubcommand(true);
  switch (subcommand) {
    case 'voicevox':
      return voicevox.autocomplete(interaction);
  }
}
