import type {
  ApplicationCommandSubCommandData,
  CommandInteraction,
} from 'discord.js';

/**
 * `/emoji-bulk keys` command data.
 */
export const data: ApplicationCommandSubCommandData = {
  name: 'keys',
  type: 'SUB_COMMAND',
  description: '読み方が設定されていない絵文字のリストを出力します。',
};

/**
 * handles `/emoji-bulk keys` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  return;
}
