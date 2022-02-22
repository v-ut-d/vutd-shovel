import type { Client, Guild, Interaction, Role } from 'discord.js';
import commands from './commands';

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

export async function guild(guild: Guild) {
  commands.addGuild(guild).catch(console.error);
}

export async function roleDelete(role: Role) {
  if (role.tags?.botId && role.tags.botId === role.client.user?.id) {
    return;
  }
  commands.checkRole(role.guild).catch(console.error);
}

/**
 * handles client.on('ready') event.
 */
export async function ready(client: Client<true>) {
  console.log(`logged in as ${client.user.tag}`);
  await commands.register(client);
}
