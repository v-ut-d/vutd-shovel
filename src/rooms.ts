import { Collection, type Snowflake } from 'discord.js';
import type { Room } from './classes';

/**
 * {@link Collection} of
 * '{@link Collection} of rooms in current process
 * with clientId used for connecting to voice channel as key'
 * with its guildId as key.
 */
const rooms = new Collection<Snowflake, Collection<Snowflake, Room>>();
export default rooms;
