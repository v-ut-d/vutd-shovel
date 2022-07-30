import {
  ApplicationCommandData,
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  ChannelType,
} from 'discord.js';
import rooms from '../rooms';
import { ErrorMessageEmbed, StartMessageEmbed } from '../components';

/**
 * `/start` command data.
 */
export const data: ApplicationCommandData = {
  name: 'start',
  description: 'ボイスチャンネルに参加し、読み上げを開始します。',
  options: [
    {
      name: 'vc',
      type: ApplicationCommandOptionType.Channel,
      description:
        'ボイスチャンネル。あなたがどこのチャンネルにも入っていない場合、指定必須です。',
      channelTypes: [ChannelType.GuildStageVoice, ChannelType.GuildVoice],
    },
  ],
};

/**
 * handles `/start` command.
 */
export async function handle(
  interaction: ChatInputCommandInteraction<'cached'>
) {
  try {
    const voiceChannel =
      interaction.options.getChannel('vc') ?? interaction.member.voice.channel;
    if (!voiceChannel?.isVoiceBased())
      throw new Error('ボイスチャンネルを指定してください。');

    const textChannel = interaction.channel;
    if (!textChannel)
      throw new Error('テキストチャンネルを取得できませんでした。');

    const me = interaction.guild.members.me;
    if (!me) throw new Error('データを取得できませんでした。');

    const room = await rooms.create(voiceChannel, textChannel);

    const surpressed =
      voiceChannel.type === ChannelType.GuildStageVoice &&
      me.voice.suppress === false &&
      (await me.voice.setSuppressed(false).then(
        () => false,
        () => true
      ));

    await interaction.reply({
      embeds: [new StartMessageEmbed(room, surpressed)],
    });
  } catch (e) {
    await interaction.reply({
      embeds: [new ErrorMessageEmbed('読み上げを開始できませんでした。', e)],
    });
  }
}
