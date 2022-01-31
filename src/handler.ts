import type { Client, Interaction } from 'discord.js';
import * as commands from './commands';

/**
 * handles client.on('interactionCreate') event.
 */
export async function interaction(interaction: Interaction) {
  if (!interaction.inCachedGuild()) return;
  try {
    if (interaction.isCommand()) await commands.handle(interaction);
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
