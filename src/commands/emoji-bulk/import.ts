import type {
  ApplicationCommandSubCommandData,
  CommandInteraction,
} from 'discord.js';

/**
 * `/emoji-bulk import` command data.
 */
export const data: ApplicationCommandSubCommandData = {
  name: 'import',
  type: 'SUB_COMMAND',
  description: '絵文字の読み方をまとめて登録します。',
};

/**
 * handles `/emoji-bulk import` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  return;
}
