import type { Client, Guild, Interaction, VoiceState } from 'discord.js';
import commands from './commands';
import rooms from './rooms';

/**
 * handles client.on('interactionCreate') event.
 */
export async function interaction(interaction: Interaction) {
  if (!interaction.inCachedGuild()) return;
  try {
    if (interaction.isChatInputCommand()) await commands.handle(interaction);
  } catch (e) {
    console.error(e);
  }
}

export async function guild(guild: Guild) {
  commands.addGuild(guild).catch(console.error);
}

export async function voiceStateUpdate(
  client: Client<true>,
  oldState: VoiceState,
  newState: VoiceState
) {
  await rooms.onVoiceStateUpdate(client, oldState, newState);
}

export function onExit() {
  try {
    rooms.destroyAll();
  } catch (e) {
    console.error(e);
  }
}

/**
 * handles client.on('ready') event.
 */
export async function ready(client: Client<true>) {
  console.log(`logged in as ${client.user.tag}`);
  await commands.register(client);
}
