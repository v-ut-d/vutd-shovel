import {
  ApplicationCommandOptionChoiceData,
  ApplicationCommandOptionType,
  ApplicationCommandSubCommandData,
  AutocompleteInteraction,
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
      type: ApplicationCommandOptionType.String,
      description: 'キャラクターを指定します。',
      required: true,
      autocomplete: true,
    },
    {
      name: 'style',
      type: ApplicationCommandOptionType.Number,
      description:
        'スタイルを指定します。先にキャラクターを指定する必要があります。',
      required: true,
      autocomplete: true,
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
      speakerId: interaction.options.getNumber('style') ?? undefined,
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

export async function autocomplete(
  interaction: AutocompleteInteraction<'cached'>
) {
  const focusedOption = interaction.options.getFocused(true);
  const speakers = await VoiceVox.speakers;
  let choices: ApplicationCommandOptionChoiceData[] = [];

  switch (focusedOption.name) {
    case 'speaker':
      choices = speakers.map((speaker) => ({
        name: speaker.name,
        value: speaker.speaker_uuid,
      }));
      break;
    case 'style': {
      const speakerUUID = interaction.options.getString('speaker');
      const speaker = speakers.find(
        (speaker) => speaker.speaker_uuid === speakerUUID
      );
      if (speaker) {
        choices = speaker.styles.map((style) => ({
          name: style.name,
          value: style.id,
        }));
      }
    }
  }

  const filtered = choices.filter((choice) =>
    choice.name.startsWith(focusedOption.value)
  );
  await interaction.respond(filtered);
}
