import type {
  ApplicationCommandData,
  ApplicationCommandPermissions,
  CommandInteraction,
} from 'discord.js';
import rooms from '../rooms';

/**
 * `/cancel` command data.
 */
export const data: ApplicationCommandData = {
  name: 'cancel',
  description: '読み上げを終了します。',
};

/**
 * `/cancel` command permission data.
 */
export const permissions: ApplicationCommandPermissions[] = [];

/**
 * handles `/cancel` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    const room = rooms.get(interaction.guildId);
    if (!room) throw new Error('現在読み上げ中ではありません。');

    room.cancel();
    await interaction.reply({
      content: '読み上げを中断しました。',
      ephemeral: true,
    });
  } catch (e) {
    await interaction.reply({
      content: `読み上げを中断できませんでした:\n${(e as Error).message}`,
      ephemeral: true,
    });
  }
}
