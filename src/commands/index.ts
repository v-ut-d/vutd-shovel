import type { GuildSettings } from '@prisma/client';
import type {
  ApplicationCommand,
  ApplicationCommandPermissions,
  Client,
  CommandInteraction,
  Snowflake,
} from 'discord.js';
import { Collection } from 'discord.js';
import { prisma } from '../database';
import { CallOrReturn, env } from '../utils';
import * as cancel from './cancel';
import * as dict from './dict';
import * as dictBulk from './dict-bulk';
import * as emojiBulk from './emoji-bulk';
import * as end from './end';
import * as start from './start';
import * as voice from './voice';

const commands = [start, end, cancel, voice, dict, emojiBulk, dictBulk];

//Value: ApplicationCommand(in production) or Collection of ApplicationCommand with guildId as key(in development)
type ApplicationCommands = Collection<
  symbol,
  ApplicationCommand | Collection<Snowflake, ApplicationCommand>
>;

export type PermissionSetterFunction = (
  guildSettings: GuildSettings
) => ApplicationCommandPermissions[];

const appCommands: ApplicationCommands = new Collection();

/**
 * registers slash commands.
 */
export async function register(client: Client<true>) {
  const perms = new Collection<
    symbol,
    ApplicationCommandPermissions[] | PermissionSetterFunction
  >(commands.map((t) => [t.s, t.permissions]));

  const oauth2guilds = await client.guilds.fetch();
  const guilds = env.production
    ? undefined
    : await Promise.all(
        oauth2guilds.map((guild_partial) => guild_partial.fetch())
      );

  //Register commands
  await Promise.all(
    commands.map(async (e) => {
      if (env.production) {
        //Global Command
        const created = await client.application.commands.create(e.data);
        appCommands.set(e.s, created);
      } else {
        //Guild Command
        const coll = appCommands.ensure(
          e.s,
          () => new Collection<Snowflake, ApplicationCommand>()
        );
        if (!guilds || 'id' in coll) {
          //This should not happen.
          return;
        }
        await Promise.all(
          guilds.map(async (guild) => {
            const created = await guild.commands.create(e.data);
            coll.set(guild.id, created);
          })
        );
      }
    })
  );

  //Set Command Permissions
  await Promise.all(
    oauth2guilds.map(async (guild_partial) => {
      let _guildSettings: GuildSettings | null;
      {
        _guildSettings = await prisma.guildSettings.findUnique({
          where: {
            guildId: guild_partial.id,
          },
        });
        if (!_guildSettings) {
          const guild =
            guilds?.find((g) => g.id === guild_partial.id) ??
            (await guild_partial.fetch());
          _guildSettings = await prisma.guildSettings.create({
            data: {
              guildId: guild.id,
              dictionaryWriteRole: guild.roles.everyone.id,
            },
          });
        }
      }
      const guildSettings = _guildSettings;

      await Promise.all(
        appCommands.map(async (c, s) => {
          const permissions = perms.get(s);
          if (!permissions) return;
          if (!c) return;
          await setPermission(
            c,
            client,
            guild_partial.id,
            permissions,
            guildSettings
          );
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

export async function setPermissionBySymbol(
  s: symbol,
  client: Client<true>,
  guildId: Snowflake,
  permissions: PermissionSetterFunction | ApplicationCommandPermissions[],
  guildSettings: GuildSettings
) {
  const c = appCommands.get(s);
  if (!c) return Promise.reject('No such command found.');
  return setPermission(c, client, guildId, permissions, guildSettings);
}

async function setPermission(
  c: ApplicationCommand | Collection<string, ApplicationCommand>,
  client: Client<true>,
  guildId: Snowflake,
  permissions: PermissionSetterFunction | ApplicationCommandPermissions[],
  guildSettings: GuildSettings
) {
  if ('id' in c) {
    //Production: ApplicationCommand
    await client.application.commands.permissions.set({
      guild: guildId,
      command: c,
      permissions: CallOrReturn(permissions, guildSettings),
    });
  } else {
    //Development: Collection<Snowflake, ApplicationCommand>
    await Promise.all(
      c.map(async (appCommand) => {
        await appCommand.permissions.set({
          permissions: CallOrReturn(permissions, guildSettings),
        });
      })
    );
  }
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
