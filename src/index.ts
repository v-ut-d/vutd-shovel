import { Client, GatewayIntentBits } from 'discord.js';
import { env } from './utils';
import * as handler from './handler';

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
client.on('voiceStateUpdate', handler.voiceStateUpdate);

process.on('SIGINT', handler.onExit);
process.on('SIGTERM', handler.onExit);

client.login(env.BOT_TOKEN);
