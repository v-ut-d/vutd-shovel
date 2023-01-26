import {
  ApplicationCommandOptionType,
  ApplicationCommandSubCommandData,
  ChatInputCommandInteraction,
} from 'discord.js';
import path from 'path';
import { ErrorMessageEmbed, VoiceMessageEmbed } from '../../components';
import { speakers } from '../../speakers';
import OpenJTalk from '../../speakers/openjtalk';

/**
 * `/voice set` command data.
 */
export const data: ApplicationCommandSubCommandData = {
  name: 'openjtalk',
  type: ApplicationCommandOptionType.Subcommand,
  description:
    '合成エンジンをOpenJTalkに切り替え、読み上げる声の設定を変更します。',
  options: [
    {
      name: 'htsvoice',
      type: ApplicationCommandOptionType.String,
      description: '声質を指定します。',
      choices: OpenJTalk.htsvoices.map((value) => ({
        name: path.basename(value).replace(/\..+?$/, ''),
        value,
      })),
    },
    {
      name: 'tone',
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
      name: 'f0',
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
    await speakers.set(interaction.member, 'openjtalk', {
      htsvoice: interaction.options.getString('htsvoice') ?? undefined,
      tone: interaction.options.getNumber('tone') ?? undefined,
      speed: interaction.options.getNumber('speed') ?? undefined,
      f0: interaction.options.getNumber('f0') ?? undefined,
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
