import { Collection, Snowflake } from 'discord.js';
import { Room } from './classes';

const rooms = new Collection<Snowflake, Room>();
export default rooms;
