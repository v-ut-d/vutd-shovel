import { Client, GatewayIntentBits } from 'discord.js';
import * as handler from './handler';
import { clientManager } from './clientManager';

const clientOptions = {
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
};

const client = new Client(clientOptions);

client.on('ready', handler.ready);
client.on('interactionCreate', handler.interaction);
client.on('guildCreate', handler.guild);
client.on('voiceStateUpdate', handler.voiceStateUpdate);

process.on('exit', handler.onExit);
process.on('SIGINT', handler.onExit);
process.on('SIGUSR1', handler.onExit);
process.on('SIGUSR2', handler.onExit);
process.on('uncaughtException', handler.onExit);

clientManager.on('voiceStateUpdate', handler.voiceStateUpdate);

clientManager.loginPrimary(client);
clientManager.instantiateSecondary(clientOptions);
