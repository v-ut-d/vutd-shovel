import type { GuildSettings } from '@prisma/client';
import type {
  ApplicationCommandData,
  ApplicationCommandPermissions,
  Client,
  CommandInteraction,
  Guild,
} from 'discord.js';
import { Collection } from 'discord.js';
import { prisma } from '../database';
import { env } from '../utils';
import * as cancel from './cancel';
import * as dictBulk from './dict-bulk';
import * as emojiBulk from './emoji-bulk';
import * as end from './end';
import * as start from './start';
import * as voice from './voice';
import * as dict from './dict';
import * as setting from './setting';
import * as help from './help';

interface CommandDefinition {
  data: ApplicationCommandData;
  permissions?: PermissionSetterFunction;
  handle(interaction: CommandInteraction<'cached'>): Promise<void>;
}

export type PermissionSetterFunction = (
  guildSettings: GuildSettings,
  guild: Guild
) => ApplicationCommandPermissions[];

class CommandManager<Production extends boolean> {
  static async #resolveGuildSettings(guild: Guild) {
    let guildSettings =
      await prisma.guildSettings.upsert({
        where: {
          guildId: guild.id
        },
        create: {
          guildId: guild.id,
          dictionaryWriteRole: guild.roles.everyone.id,
        },
        update: {}
      });

    if (
      guildSettings.moderatorRole &&
      !guild.roles.cache.has(guildSettings.moderatorRole)
    ) {
      guildSettings = await prisma.guildSettings.update({
        where: {
          guildId: guild.id,
        },
        data: {
          moderatorRole: null,
        },
      });
    }

    return guildSettings;
  }

  #commandDefinitions = new Collection<string, CommandDefinition>();

  constructor(
    readonly production: Production,
    commandDefinitions: CommandDefinition[]
  ) {
    commandDefinitions.forEach((d) => {
      this.#commandDefinitions.set(d.data.name, d);
    });
  }

  async register(client: Client<true>) {
    await Promise.all(
      (await client.guilds.fetch()).map((guild) => guild.fetch())
    );

    if (this.production) {
      await (this as CommandManager<true>).#registerProduction(client);
    } else {
      await (this as CommandManager<false>).#registerDevelopment(client);
    }

    await Promise.all(
      client.guilds.cache.map(async (guild) => {
        const guildSettings = await CommandManager.#resolveGuildSettings(guild);
        await this.setPermission(guildSettings, guild);
      })
    );
  }

  async handle(interaction: CommandInteraction<'cached'>) {
    return this.#commandDefinitions
      .get(interaction.commandName)
      ?.handle(interaction);
  }

  async setPermission(guildSettings: GuildSettings, guild: Guild) {
    if (this.production) {
      await (this as CommandManager<true>).#setPermissionProduction(
        guildSettings,
        guild
      );
    } else {
      await (this as CommandManager<false>).#setPermissionDevelopment(
        guildSettings,
        guild
      );
    }
  }

  async addGuild(guild: Guild) {
    if (!this.production) {
      await (this as CommandManager<false>).#addGuildDevelopment(guild);
    }

    const guildSettings = await CommandManager.#resolveGuildSettings(guild);
    await this.setPermission(guildSettings, guild);
  }

  async #registerDevelopment(
    this: CommandManager<false>,
    client: Client<true>
  ) {
    await client.application.commands.set([]);

    await Promise.all(
      client.guilds.cache.map((guild) => guild.commands.set(
        this.#commandDefinitions.map(({ data }) => data)
      ))
    );

    process.on('SIGINT', async () => {
      await Promise.all(
        client.guilds.cache.map((guild) =>
          client.application.commands.set([], guild.id)
        )
      );
      process.exit(0);
    });
  }

  async #registerProduction(this: CommandManager<true>, client: Client<true>) {
    await client.application.commands.set(
      this.#commandDefinitions.map(({ data }) => data)
    );
  }

  async #setPermissionDevelopment(
    this: CommandManager<false>,
    guildSettings: GuildSettings,
    guild: Guild
  ) {
    const commands = guild.commands.cache;
    if (!commands) return;

    await Promise.all(
      commands
        .map(async (command, name) => {
          // commandDefinition always exists; command comes from this source code
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const { permissions } = this.#commandDefinitions.get(command.name)!;
          if (!permissions) return undefined;

          return command.permissions.set({
            permissions: permissions(guildSettings, guild),
          });
        })
        .filter((v): v is NonNullable<typeof v> => Boolean(v))
    );
  }

  async #setPermissionProduction(
    this: CommandManager<true>,
    guildSettings: GuildSettings,
    guild: Guild
  ) {
    const { application } = guild.client;
    if (!application) return;
    await Promise.all(
      application.commands.cache.map(async (command, name) => {
        // commandDefinition always exists; command comes from this source code
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const { permissions } = this.#commandDefinitions.get(command.name)!;
        if (!permissions) return undefined;

        return command.permissions.set({
          guild,
          permissions: permissions(guildSettings, guild),
        });
      })
    );
  }

  async #addGuildDevelopment(this: CommandManager<false>, guild: Guild) {
    await guild.commands.set(this.#commandDefinitions.map(({ data }) => data));

    const guildSettings = await CommandManager.#resolveGuildSettings(guild);
    await this.#setPermissionDevelopment(guildSettings, guild);
  }
}

const commands = new CommandManager(env.production, [
  start,
  end,
  cancel,
  voice,
  dict,
  help,
  setting,
  emojiBulk,
  dictBulk,
]);

export default commands;
