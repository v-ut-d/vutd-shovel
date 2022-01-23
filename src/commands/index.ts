import { Client, CommandInteraction } from 'discord.js';
import { getGuild } from '../utils';
import * as end from './end';
import * as start from './start';
import * as voice from './voice';

/**
 * registers slash commands.
 */
export async function register(client: Client<true>) {
  const guild = await getGuild(client);
  await Promise.all(
    [start, end, voice].map((e) =>
      guild.commands
        .create(e.data)
        .then((command) => command.permissions.add(e))
    )
  );
  console.log('command initialized.');
  process.on('SIGINT', async () => {
    await guild.commands.set([]).catch(console.error);
    process.exit(0);
  });
}

/**
 * handles any slash command ({@link CommandInteraction}).
 */
export async function handle(interaction: CommandInteraction<'cached'>) {
  switch (interaction.commandName) {
    case 'start':
      return start.handle(interaction);
    case 'end':
      return end.handle(interaction);
    case 'voice':
      return voice.handle(interaction);
  }
}
