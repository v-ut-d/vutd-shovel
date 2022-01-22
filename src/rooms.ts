import { Collection, Snowflake } from 'discord.js';
import { Room } from './classes';

/**
 * {@link Collection} of rooms in current process
 * with its guildId as key.
 */
const rooms = new Collection<Snowflake, Room>();
export default rooms;
