import type { ApplicationCommandData, CommandInteraction } from 'discord.js';
import rooms from '../rooms';

/**
 * `/cancel` command data.
 */
export const data: ApplicationCommandData = {
  name: 'cancel',
  description: '今行っている読み上げを中断します。',
};

/**
 * handles `/cancel` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    const roomCollection = rooms.get(interaction.guildId);
    if (!roomCollection) throw new Error('現在読み上げ中ではありません。');

    roomCollection.each((room) => room.cancel());
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
