import type { Prisma } from '@prisma/client';
import type { APIEmbedField, GuildMember } from 'discord.js';
import type { Executor } from './queue/Scheduler';

export type OptionsObject = Prisma.JsonObject;

export abstract class BaseSpeaker {
  constructor(public member: GuildMember) {}
  abstract synthesize(
    content: string,
    onError?: (e: Error) => void
  ): Promise<Executor[]>;

  abstract toJSON(): OptionsObject;
  abstract display(): Promise<APIEmbedField[]>;
}

export interface SpeakerClass<T extends BaseSpeaker = BaseSpeaker> {
  new (member: GuildMember, options: OptionsObject): T;
  random(member: GuildMember): T;
}
