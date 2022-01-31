import { Collection, type Snowflake } from 'discord.js';
import type { Room } from './classes';

/**
 * {@link Collection} of rooms in current process
 * with its guildId as key.
 */
const rooms = new Collection<Snowflake, Room>();
export default rooms;
