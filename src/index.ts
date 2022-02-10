import { Client, Intents } from 'discord.js';
import * as handler from './handler';
import { clientManager } from './clientManager';

const clientOptions = {
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
};

const client = new Client(clientOptions);

client.on('ready', handler.ready);
client.on('interactionCreate', handler.interaction);

clientManager.loginPrimary(client);
clientManager.instantiateSecondary(clientOptions);
