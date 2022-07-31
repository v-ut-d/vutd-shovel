import {
  ApplicationCommandOptionType,
  ApplicationCommandSubCommandData,
  ChatInputCommandInteraction,
} from 'discord.js';
import { ErrorMessageEmbed, VoiceMessageEmbed } from '../../components';
import { speakers } from '../../speakers';
import VoiceVox from '../../speakers/voicevox';

/**
 * `/voice set` command data.
 */
export const data: ApplicationCommandSubCommandData = {
  name: 'voicevox',
  type: ApplicationCommandOptionType.Subcommand,
  description:
    '合成エンジンをvoicevoxに切り替え、読み上げる声の設定を変更します。',
  options: [
    {
      name: 'speaker',
      type: ApplicationCommandOptionType.Number,
      description: 'キャラクターを指定します。',
      choices: VoiceVox.speakers.map((data) => ({
        name: data.name,
        value: data.id,
      })),
    },
    {
      name: 'pitch',
      type: ApplicationCommandOptionType.Number,
      description: '声の高さを指定します。',
      minValue: 0,
      maxValue: 6,
    },
    {
      name: 'speed',
      type: ApplicationCommandOptionType.Number,
      description: '声の速さを指定します。',
      minValue: 0.5,
      maxValue: 2,
    },
    {
      name: 'intonation',
      type: ApplicationCommandOptionType.Number,
      description: '声の抑揚を指定します。',
      minValue: 0.25,
      maxValue: 4,
    },
  ],
};

/**
 * handles `/voice set` command.
 */
export async function handle(
  interaction: ChatInputCommandInteraction<'cached'>
) {
  try {
    await speakers.set(interaction.member, 'voicevox', {
      speakerId: interaction.options.getNumber('speaker') ?? undefined,
      pitch: interaction.options.getNumber('tone') ?? undefined,
      speed: interaction.options.getNumber('speed') ?? undefined,
      intonation: interaction.options.getNumber('f0') ?? undefined,
    });
    const fields = await speakers.display(interaction.member);
    await interaction.reply({
      embeds: [new VoiceMessageEmbed('set', fields)],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('読み上げ設定', e)],
    });
  }
}
