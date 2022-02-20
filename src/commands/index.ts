import type { GuildSettings } from '@prisma/client';
import type {
  ApplicationCommand,
  ApplicationCommandPermissionData,
  ApplicationCommandPermissions,
  Client,
  CommandInteraction,
  Guild,
  OAuth2Guild,
  Snowflake,
} from 'discord.js';
import { Collection } from 'discord.js';
import { prisma } from '../database';
import { CallOrReturn, env } from '../utils';
import * as cancel from './cancel';
import * as dictBulk from './dict-bulk';
import * as emojiBulk from './emoji-bulk';
import * as end from './end';
import * as start from './start';
import * as voice from './voice';
import * as dict from './dict';
import * as setting from './setting';
import * as help from './help';

const commands = [
  start,
  end,
  cancel,
  voice,
  dict,
  help,
  setting,
  emojiBulk,
  dictBulk,
];

/**
 * Key: The symbol that is unique to command file
 * Value: Collection of ApplicationCommand with guildId as key
 */
type ApplicationCommands = Collection<
  symbol,
  Collection<Snowflake, ApplicationCommand>
>;

export type PermissionSetterFunction = (
  guildSettings: GuildSettings,
  guild: OAuth2Guild | Guild
) => ApplicationCommandPermissions[] | Promise<ApplicationCommandPermissions[]>;

const appCommands: ApplicationCommands = new Collection();

/**
 * registers slash commands.
 */
export async function register(client: Client<true>) {
  const perms = new Collection<
    symbol,
    ApplicationCommandPermissions[] | PermissionSetterFunction
  >(commands.map((t) => [t.s, t.permissions]));

  const guilds = await client.guilds.fetch();

  /**
   * Remove 'ghost' command(=global commands that remains after deletion of guild command)
   * */
  if (!env.production) {
    await client.application.commands.set([]);
  }

  //Register commands
  console.log('Registering commands...');
  await Promise.all(
    commands.map(async (e) => {
      const coll = appCommands.ensure(
        e.s,
        () => new Collection<Snowflake, ApplicationCommand>()
      );
      if (env.production) {
        //Global Command
        const created = await client.application.commands.create(e.data);
        coll.concat(new Collection(guilds.map((g) => [g.id, created])));
      } else {
        //Guild Command
        if (!guilds || 'id' in coll) {
          //This should not happen.
          return;
        }
        await Promise.all(
          guilds.map(async (guild) => {
            const created = await client.application.commands.create(
              e.data,
              guild.id
            );
            coll.set(guild.id, created);
          })
        );
      }
    })
  );
  console.log('Registered commands.');

  //Key: GuildId, Value:ModeratorRoleId
  const roleId: Collection<Snowflake, string> = new Collection();

  //Set Command Permissions
  console.log('Setting permissions...');
  await Promise.all(
    guilds.map(async (guild) => {
      let _guildSettings: GuildSettings | null;
      {
        _guildSettings = await prisma.guildSettings.findUnique({
          where: {
            guildId: guild.id,
          },
        });
        if (!_guildSettings) {
          const g = await guild.fetch();
          _guildSettings = await prisma.guildSettings.create({
            data: {
              guildId: guild.id,
              dictionaryWriteRole: g.roles.everyone.id,
            },
          });
        }
      }
      const guildSettings = _guildSettings;

      if (guildSettings.moderatorRole) {
        //Cache roleId for role checking
        roleId.set(guild.id, guildSettings.moderatorRole);
      }

      await Promise.all(
        appCommands.map(async (c, s) => {
          const permissions = perms.get(s);
          if (!permissions) return;
          const appCommand = c.get(guild.id);
          if (!appCommand) return;
          await setPermission(appCommand, {
            client,
            guild,
            permissions,
            guildSettings,
          });
        })
      );
    })
  );
  console.log('Set permissions.');

  console.log('command initialized.');

  //Check for deleted roles registered as moderatorRole
  console.log('Checking roles...');
  await Promise.all(
    guilds.map(async (guild) => {
      const g = await guild.fetch();
      const role = roleId.get(guild.id);
      if (role && !g.roles.cache.has(role)) {
        const updateResult = await prisma.guildSettings.update({
          where: {
            guildId: guild.id,
          },
          data: {
            moderatorRole: null,
          },
        });
        await setPermissionBySymbol(setting.s, {
          client,
          guild,
          guildSettings: updateResult,
          permissions: setting.permissions,
        });
      }
    })
  );
  console.log('Checked roles.');

  client.on('guildCreate', async (guild) => {
    if (!env.production) {
      //Add Guild Command
      await Promise.all(
        commands.map(async (e) => {
          const coll = appCommands.ensure(
            e.s,
            () => new Collection<Snowflake, ApplicationCommand>()
          );
          if ('id' in coll) {
            //This should not happen.
            return;
          }
          const created = await guild.commands.create(e.data);
          coll.set(guild.id, created);
        })
      );
    }

    //Set permission
    const guildSettings = await prisma.guildSettings.upsert({
      where: {
        guildId: guild.id,
      },
      create: {
        guildId: guild.id,
        dictionaryWriteRole: guild.roles.everyone.id,
      },
      update: {},
    });
    await Promise.all(
      appCommands.map(async (c, s) => {
        const permissions = perms.get(s);
        if (!permissions) return;
        const appCommand = c.get(guild.id);
        if (!appCommand) return;
        await setPermission(appCommand, {
          client,
          guild,
          permissions,
          guildSettings,
        });
      })
    );
  });

  client.on('roleDelete', async (role) => {
    if (role.members.has(client.user.id) && role.members.size === 1) return;
    const updateResult = await prisma.guildSettings.updateMany({
      where: {
        moderatorRole: role.id,
      },
      data: {
        moderatorRole: null,
      },
    });
    if (updateResult.count === 0) return;
    const guildSettings = await prisma.guildSettings.findUnique({
      where: {
        guildId: role.guild.id,
      },
    });
    if (!guildSettings) return;
    await setPermissionBySymbol(setting.s, {
      client,
      guild: role.guild,
      permissions: setting.permissions,
      guildSettings,
    });
  });

  process.on('SIGINT', async () => {
    if (!env.production) {
      if (!guilds) {
        //This should not happen.
        return;
      }
      await Promise.all(
        guilds.map(async (guild) => {
          await client.application.commands.set([], guild.id);
        })
      );
    }
    process.exit(0);
  });
}

interface SetPermissionParameters {
  client: Client<true>;
  guild: OAuth2Guild | Guild;
  permissions: PermissionSetterFunction | ApplicationCommandPermissions[];
  guildSettings: GuildSettings;
}

export async function setPermissionBySymbol(
  s: symbol,
  param: SetPermissionParameters
) {
  const appCommand = appCommands.get(s)?.get(param.guild.id);
  if (!appCommand) return Promise.reject('No such command found.');
  return setPermission(appCommand, param);
}

async function setPermission(
  c: ApplicationCommand,
  param: SetPermissionParameters
) {
  await c.permissions.set({
    guild: param.guild.id,
    permissions: await CallOrReturn(
      param.permissions,
      param.guildSettings,
      param.guild
    ),
  } as { permissions: ApplicationCommandPermissionData[] });
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
    case 'setting':
      return setting.handle(interaction);
    case 'help':
      return help.handle(interaction);
    case 'emoji-bulk':
      return emojiBulk.handle(interaction);
    case 'dict-bulk':
      return dictBulk.handle(interaction);
  }
}
