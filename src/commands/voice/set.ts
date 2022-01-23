import {
  ApplicationCommandSubCommandData,
  CommandInteraction,
} from 'discord.js';
import path from 'path';
import { Speaker } from '../../classes';
import { ErrorMessageEmbed } from '../../components';
import VoiceMessageEmbed from '../../components/voice';
import rooms from '../../rooms';

/**
 * `/voice set` command data.
 */
export const data: ApplicationCommandSubCommandData = {
  name: 'set',
  type: 'SUB_COMMAND',
  description: '読み上げ設定を指定して変更します。',
  options: [
    {
      name: 'htsvoice',
      type: 'STRING',
      description: '声質を指定します。',
      choices: Speaker.htsvoices.map((value) => ({
        name: path.basename(value).replace(/\..+?$/, ''),
        value,
      })),
    },
    {
      name: 'tone',
      type: 'NUMBER',
      description: '声の高さを指定します。',
      minValue: 0,
      maxValue: 6,
    },
    {
      name: 'speed',
      type: 'NUMBER',
      description: '声の速さを指定します。',
      minValue: 0.5,
      maxValue: 2,
    },
    {
      name: 'f0',
      type: 'NUMBER',
      description: '声の抑揚を指定します。',
      minValue: 0.25,
      maxValue: 4,
    },
  ],
};

/**
 * handles `/voice set` command.
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  try {
    const room = rooms.get(interaction.guildId);
    if (!room) throw new Error('現在読み上げ中ではありません。');

    const speaker = room.getOrCreateSpeaker(interaction.user);
    speaker.options = {
      htsvoice: interaction.options.getString('htsvoice') ?? undefined,
      tone: interaction.options.getNumber('tone') ?? undefined,
      speed: interaction.options.getNumber('speed') ?? undefined,
      f0: interaction.options.getNumber('f0') ?? undefined,
    };
    await interaction.reply({
      embeds: [new VoiceMessageEmbed('set', speaker.options)],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('読み上げ設定', (e as Error).message)],
    });
  }
}
