import type { ApplicationCommandData, CommandInteraction } from 'discord.js';
import rooms from '../rooms';
import { EndMessageEmbed, ErrorMessageEmbed } from '../components';

/**
 * `/end` command data.
 */
export const data: ApplicationCommandData = {
  name: 'end',
  description: '読み上げを終了し、ボイスチャンネルから退出します。',
};

/**
 * handles `/end` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    const room = rooms.get(interaction.guildId);
    if (!room) throw new Error('現在読み上げ中ではありません。');

    room.destroy();
    rooms.delete(interaction.guildId);
    await interaction.reply({
      embeds: [new EndMessageEmbed(room)],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('読み上げを終了できませんでした。', e)],
    });
  }
}
