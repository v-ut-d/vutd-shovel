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
client.on('guildCreate', handler.guild);
client.on('roleDelete', handler.roleDelete);

process.on('exit', handler.onExit);
process.on('SIGINT', handler.onExit);
process.on('SIGUSR1', handler.onExit);
process.on('SIGUSR2', handler.onExit);
process.on('uncaughtException', handler.onExit);

clientManager.on('voiceStateUpdate', handler.voiceStateUpdate);

clientManager.loginPrimary(client);
clientManager.instantiateSecondary(clientOptions);
