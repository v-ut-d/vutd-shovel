import { Client, Collection, CommandInteraction, Snowflake } from 'discord.js';
import { Room } from '../classes';
import { getGuild } from '../utils';
import end from './end';
import start from './start';

export const rooms = new Collection<Snowflake, Room>();

export async function register(client: Client<true>) {
  const guild = await getGuild(client);
  await Promise.all(
    [start, end].map((e) =>
      guild.commands.create(e).then((command) => command.permissions.add(e))
    )
  );
  console.log('command initialized.');
  process.on('SIGINT', async () => {
    await guild.commands.set([]).catch(console.error);
    process.exit(0);
  });
}

export async function handle(interaction: CommandInteraction<'cached'>) {
  switch (interaction.commandId) {
    case 'start':
      return start.handle(interaction);
    case 'end':
      return end.handle(interaction);
  }
}
