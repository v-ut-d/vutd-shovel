import {
  ApplicationCommandData,
  ApplicationCommandPermissions,
  CommandInteraction,
} from 'discord.js';
import rooms from '../rooms';
import { EndMessageEmbed, ErrorMessageEmbed } from '../components';

const data: ApplicationCommandData = {
  name: 'start',
  description: '読み上げを終了します。',
};

const permissions: ApplicationCommandPermissions[] = [];

async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    const room = rooms.get(interaction.guildId);
    if (!room) throw new Error('現在読み上げ中ではありません。');

    room.destroy();
    await interaction.reply({
      embeds: [new EndMessageEmbed(room)],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [
        new ErrorMessageEmbed(
          '読み上げを終了できませんでした。',
          (e as Error).message
        ),
      ],
    });
  }
}

const end = { ...data, permissions, handle };
export default end;
