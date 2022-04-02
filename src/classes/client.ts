import type { Awaitable, ClientEvents, ClientOptions } from 'discord.js';
import { Client, Collection, Guild } from 'discord.js';
import EventEmitter from 'events';

export default class ClientManager extends EventEmitter {
  public primaryClient?: Client<true>;
  public secondaryClients: Client<true>[] = [];
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
    super();
    this.#primaryToken = primaryToken;
    this.#secondaryTokens = secondaryTokens;

    this.on('ready', async (_, client) => {
      (await client.guilds.fetch()).forEach((guild) => {
        const c = this.#getClientArray(guild.id);
        c.push(client);
      });
    });
    this.on('guildCreate', (client, guild) => {
      const c = this.#getClientArray(guild.id);
      c.push(client);
    });
    this.on('guildDelete', (client, guild) => {
      const c = this.#getClientArray(guild.id);
      this.#freeClients.set(
        guild.id,
        c.filter((cn) => cn !== client)
      );
    });
  }
  public async loginPrimary(client: Client<true>) {
    this.primaryClient = await this.#login(client, this.#primaryToken);
  }
  public async instantiateSecondary(options: ClientOptions) {
    this.secondaryClients = await Promise.all(
      this.#secondaryTokens.map(async (token) => {
        const client = new Client(options);
        return this.#login(client, token);
      })
    );
  }
  async #login(client: Client, token: string) {
    client.emit = this.#altEmit(client);
    await client.login(token);
    //When login resolve, webSocket is ready.
    return client;
  }
  #altEmit(client: Client) {
    const managerEmit = this.emit.bind(this);
    const originalEmit = client.emit.bind(client);
    return function emit<K extends keyof ClientEvents>(
      eventName: K,
      ...args: ClientEvents[K]
    ) {
      managerEmit(eventName, client, ...args);
      return originalEmit(eventName, ...args);
    };
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
      (this.primaryClient === client ||
        this.secondaryClients.some((c) => c === client)) &&
      c.every((t) => t.user?.id !== client.user?.id)
    ) {
      c.push(client);
    }
  }
  static getAltGuild(guild: Guild, client: Client) {
    const n = { ...guild, client };
    const d = Object.getOwnPropertyDescriptors(Guild.prototype);
    Object.defineProperties(n, d);
    return n;
  }

  public on<K extends keyof ClientEvents>(
    event: K,
    listener: (client: Client, ...args: ClientEvents[K]) => Awaitable<void>
  ): this;
  public on(
    eventName: string | symbol,
    listener: (client: Client, ...args: unknown[]) => void
  ) {
    return super.on(eventName, listener);
  }

  public once<K extends keyof ClientEvents>(
    event: K,
    listener: (client: Client, ...args: ClientEvents[K]) => Awaitable<void>
  ): this;
  public once(
    eventName: string | symbol,
    listener: (client: Client, ...args: unknown[]) => void
  ) {
    return super.once(eventName, listener);
  }

  public emit<K extends keyof ClientEvents>(
    event: K,
    client: Client,
    ...args: ClientEvents[K]
  ): boolean;
  public emit(eventName: string | symbol, ...args: unknown[]) {
    return super.emit(eventName, ...args);
  }

  public off<K extends keyof ClientEvents>(
    event: K,
    listener: (client: Client, ...args: ClientEvents[K]) => Awaitable<void>
  ): this;
  public off(
    eventName: string | symbol,
    listener: (client: Client, ...args: unknown[]) => void
  ) {
    return super.off(eventName, listener);
  }

  public removeAllListeners<K extends keyof ClientEvents>(event?: K): this;
  public removeAllListeners(eventName?: string | symbol) {
    return super.removeAllListeners(eventName);
  }
}
