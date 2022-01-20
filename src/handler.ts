import { Client, Interaction } from 'discord.js';

export function interaction(interaction: Interaction) {
  if (!interaction.inCachedGuild()) return;
}

export function ready(client: Client<true>) {
  console.log(`logged in as ${client.user.tag}`);
}
