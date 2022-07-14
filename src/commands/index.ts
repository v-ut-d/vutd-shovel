import type {
  ApplicationCommandData,
  ApplicationCommandManager,
  Client,
  CommandInteraction,
  Guild,
  GuildApplicationCommandManager,
} from 'discord.js';
import { Collection } from 'discord.js';
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
  handle(interaction: CommandInteraction<'cached'>): Promise<void>;
}

class CommandManager<Production extends boolean> {
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
  }

  async handle(interaction: CommandInteraction<'cached'>) {
    return this.#commandDefinitions
      .get(interaction.commandName)
      ?.handle(interaction);
  }

  async addGuild(guild: Guild) {
    if (!this.production) {
      await (this as CommandManager<false>).#addGuildDevelopment(guild);
    }
  }

  async #hasCommandChanged(
    commands: ApplicationCommandManager | GuildApplicationCommandManager
  ) {
    const currentCommands = await commands.fetch({});
    return (
      currentCommands.size !== this.#commandDefinitions.size ||
      currentCommands.some((command) => {
        const definition = this.#commandDefinitions.get(command.name);
        if (!definition?.data) return true;
        return !command.equals(definition.data);
      })
    );
  }

  async #registerDevelopment(
    this: CommandManager<false>,
    client: Client<true>
  ) {
    await client.application.commands.set([]);

    await Promise.all(
      client.guilds.cache.map(async (guild) => {
        const hasChanged = await this.#hasCommandChanged(guild.commands);
        if (hasChanged) {
          guild.commands.cache.clear();
          await guild.commands.set(
            this.#commandDefinitions.map(({ data }) => data)
          );
        }
      })
    );
  }

  async #registerProduction(this: CommandManager<true>, client: Client<true>) {
    const hasChanged = await this.#hasCommandChanged(
      client.application.commands
    );
    if (hasChanged) {
      client.application.commands.cache.clear();
      await client.application.commands.set(
        this.#commandDefinitions.map(({ data }) => data)
      );
    }
  }

  async #addGuildDevelopment(this: CommandManager<false>, guild: Guild) {
    await guild.commands.set(this.#commandDefinitions.map(({ data }) => data));
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
