import { Client, GatewayIntentBits } from 'discord.js';
import * as handler from './handler';
import { clientManager } from './clientManager';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.on('ready', handler.ready);
client.on('interactionCreate', handler.interaction);
client.on('guildCreate', handler.guild);

process.on('exit', handler.onExit);
process.on('SIGINT', handler.onExit);
process.on('SIGUSR1', handler.onExit);
process.on('SIGUSR2', handler.onExit);
process.on('uncaughtException', handler.onExit);

clientManager.on('voiceStateUpdate', handler.voiceStateUpdate);

clientManager.loginPrimary(client);

clientManager.instantiateSecondary({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});
