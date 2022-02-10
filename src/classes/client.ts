import type { ClientOptions } from 'discord.js';
import { Client, Collection, Guild } from 'discord.js';

export default class ClientManager {
  public primaryClient?: Client;
  public secondaryClients: Client[] = [];
  #primaryToken;
  #secondaryTokens;

  /**
   * Key: GuildId
   * Value: WeakSet of usable Clients
   * @type {Map<string,WeakSet<Client>>}
   * @memberof ClientManager
   */
  #freeClients: Collection<string, Client[]> = new Collection();
  constructor(primaryToken: string, secondaryTokens: string[]) {
    this.#primaryToken = primaryToken;
    this.#secondaryTokens = secondaryTokens;
  }
  public loginPrimary(client: Client) {
    this.primaryClient = client;
    this.#AddClientToFreeClients(client);
    client.login(this.#primaryToken);
  }
  #AddClientToFreeClients(client: Client) {
    client.on('ready', async (client: Client<true>) => {
      (await client.guilds.fetch()).forEach((guild) => {
        const c = this.#getClientArray(guild.id);
        c.push(client);
      });
    });
    client.on('guildCreate', (guild) => {
      const c = this.#getClientArray(guild.id);
      c.push(client);
    });
    client.on('guildDelete', (guild) => {
      const c = this.#getClientArray(guild.id);
      this.#freeClients.set(
        guild.id,
        c.filter((cn) => cn !== client)
      );
    });
  }
  public async instantiateSecondary(options: ClientOptions) {
    this.secondaryClients = await Promise.all(
      this.#secondaryTokens.map(async (token) => {
        const client = new Client(options);
        this.#AddClientToFreeClients(client);
        client.login(token);
        return client;
      })
    );
  }
  #getClientArray(guildId: string) {
    let c = this.#freeClients.get(guildId);
    if (!c) {
      c = [];
      this.#freeClients.set(guildId, c);
    }
    return c;
  }
  public destroy() {
    this.secondaryClients.forEach((client) => {
      client.destroy();
    });
  }
  public allocateClient(guildId: string) {
    const c = this.#getClientArray(guildId);
    const alloc = c.shift();
    console.log('alloc:', alloc?.user?.username);
    return alloc;
  }
  public freeClient(guildId: string, client: Client) {
    const c = this.#getClientArray(guildId);
    console.log('free:', client.user?.username);
    if (
      this.primaryClient === client ||
      this.secondaryClients.some((c) => c === client)
    ) {
      c.push(client);
    }
  }
  static async getAltGuild(guild: Guild, client: Client) {
    return client.guilds.fetch({
      guild: guild.id,
    });
  }
}
