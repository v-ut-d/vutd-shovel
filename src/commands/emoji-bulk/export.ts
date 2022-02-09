import type {
  ApplicationCommandSubCommandData,
  CommandInteraction,
} from 'discord.js';

/**
 * `/emoji-bulk export` command data.
 */
export const data: ApplicationCommandSubCommandData = {
  name: 'export',
  type: 'SUB_COMMAND',
  description: '絵文字の読み方をまとめて出力します。',
};

/**
 * handles `/emoji-bulk export` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  return;
}
