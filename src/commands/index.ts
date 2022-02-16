import type { GuildSettings } from '@prisma/client';
import type {
  ApplicationCommand,
  ApplicationCommandPermissions,
  Client,
  CommandInteraction,
  Snowflake,
} from 'discord.js';
import { Collection } from 'discord.js';
import { env } from '../utils';
import * as cancel from './cancel';
import * as dict from './dict';
import * as dictBulk from './dict-bulk';
import * as emojiBulk from './emoji-bulk';
import * as end from './end';
import * as start from './start';
import * as voice from './voice';

const commands = { start, end, cancel, voice, dict, emojiBulk, dictBulk };

type CommandNames = keyof typeof commands;

//Value: ApplicationCommand(in production) or Collection of ApplicationCommand with guildId as key(in development)
type ApplicationCommands = Record<
  CommandNames,
  ApplicationCommand | Collection<Snowflake, ApplicationCommand>
>;

export type PermissionSetterFunction = (
  guildSettings: GuildSettings
) => ApplicationCommandPermissions[];

/**
 * registers slash commands.
 */
export async function register(client: Client<true>) {
  const appCommands: Partial<ApplicationCommands> = {};

  const oauth2guilds = await client.guilds.fetch();
  const guilds = env.production
    ? undefined
    : await Promise.all(
        oauth2guilds.map((guild_partial) => guild_partial.fetch())
      );

  //Register commands
  await Promise.all(
    Object.keys(commands).map(async (e) => {
      if (env.production) {
        const created = await client.application.commands.create(
          commands[e as CommandNames].data
        );
        appCommands[e as CommandNames] = created;
      } else {
        if (!guilds) {
          //This should not happen.
          return;
        }
        const coll = (appCommands[e as CommandNames] = new Collection<
          Snowflake,
          ApplicationCommand
        >());
        await Promise.all(
          guilds.map(async (guild) => {
            const created = await guild.commands.create(
              commands[e as CommandNames].data
            );
            coll.set(guild.id, created);
          })
        );
      }
    })
  );

  //Set Command Permissions
  await Promise.all(
    oauth2guilds.map(async (guild_partial) => {
      //TODO: fetch guild permission settings
      await Promise.all(
        Object.keys(appCommands).map(async (e) => {
          const c = appCommands[e as CommandNames];
          if (!c) return;
          if ('id' in c) {
            //Production: ApplicationCommand
            await client.application.commands.permissions.set({
              guild: guild_partial.id,
              command: c,
              permissions: commands[e as CommandNames].permissions,
            });
          } else {
            //Development: Collection<Snowflake, ApplicationCommand>
            await Promise.all(
              c.map(async (appCommand) => {
                await appCommand.permissions.set({
                  permissions: commands[e as CommandNames].permissions,
                });
              })
            );
          }
        })
      );
    })
  );

  console.log('command initialized.');
  process.on('SIGINT', async () => {
    if (!env.production) {
      if (!guilds) {
        //This should not happen.
        return;
      }
      await Promise.all(
        guilds.map(async (guild) => {
          await guild.commands.set([]);
        })
      );
    }
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
    case 'cancel':
      return cancel.handle(interaction);
    case 'voice':
      return voice.handle(interaction);
    case 'dict':
      return dict.handle(interaction);
    case 'emoji-bulk':
      return emojiBulk.handle(interaction);
    case 'dict-bulk':
      return dictBulk.handle(interaction);
  }
}
