import type {
  ApplicationCommandData,
  ApplicationCommandPermissions,
  CommandInteraction,
} from 'discord.js';
import rooms from '../rooms';
import { EndMessageEmbed, ErrorMessageEmbed } from '../components';

/**
 * `/end` command data.
 */
export const data: ApplicationCommandData = {
  name: 'end',
  description: '読み上げを終了します。',
};

/**
 * `/end` command permission data.
 */
export const permissions: ApplicationCommandPermissions[] = [];

/**
 * handles `/end` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    const roomCollection = rooms.get(interaction.guildId);
    const clientId = roomCollection?.firstKey();
    const room = roomCollection && clientId && roomCollection?.get(clientId);
    if (!room) throw new Error('現在読み上げ中ではありません。');

    room.destroy();
    roomCollection.delete(clientId);
    await interaction.reply({
      embeds: [new EndMessageEmbed(room)],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('読み上げを終了できませんでした。', e)],
    });
  }
}
