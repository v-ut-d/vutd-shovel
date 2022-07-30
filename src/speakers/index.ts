import { Collection, GuildMember } from 'discord.js';
import { prisma } from '../database';
import type { BaseSpeaker, OptionsObject, SpeakerClass } from './base';
import OpenJTalk from './openjtalk';

const speakerDict = {
  openjtalk: OpenJTalk,
};

// This will detect type mistakes
const speakersArray: [string, SpeakerClass][] = Object.entries(speakerDict);

export class SpeakerManager {
  private cache: Collection<string, Collection<string, BaseSpeaker>> =
    new Collection();
  private setCache(member: GuildMember, speaker: BaseSpeaker) {
    this.cache
      .ensure(member.guild.id, () => new Collection())
      .set(member.id, speaker);
  }
  private async ensureCache(member: GuildMember) {
    return (
      this.cache.get(member.guild.id)?.get(member.id) ??
      (await this.initialize(member))
    );
  }

  private async initialize(member: GuildMember) {
    const options = await prisma.member.findUnique({
      where: {
        guildId_userId: {
          guildId: member.guild.id,
          userId: member.id,
        },
      },
    });

    const speakerClass =
      speakerDict[options?.synthesisEngine as keyof typeof speakerDict];
    if (speakerClass) {
      let speaker: InstanceType<typeof speakerClass>;
      if (
        options?.synthesisOptions &&
        typeof options?.synthesisOptions === 'object' &&
        !Array.isArray(options.synthesisOptions)
      ) {
        speaker = new speakerClass(member, options.synthesisOptions);
      } else {
        speaker = new speakerClass(member, {});
      }
      this.setCache(member, speaker);
      return speaker;
    } else {
      return this.random(member);
    }
  }

  private async save(member: GuildMember, key: string, options: OptionsObject) {
    await prisma.member.upsert({
      where: {
        guildId_userId: {
          guildId: member.guild.id,
          userId: member.id,
        },
      },
      create: {
        guildId: member.guild.id,
        userId: member.id,
        synthesisEngine: key,
        synthesisOptions: options,
      },
      update: {
        synthesisEngine: key,
        synthesisOptions: options,
      },
    });
  }

  async synthesize(member: GuildMember, content: string) {
    const speaker = await this.ensureCache(member);
    return speaker.synthesize(content);
  }
  async display(member: GuildMember) {
    const speaker = await this.ensureCache(member);
    return speaker.display();
  }

  async set<T extends keyof typeof speakerDict>(
    member: GuildMember,
    key: T,
    options: Partial<ReturnType<InstanceType<typeof speakerDict[T]>['toJSON']>>
  ) {
    const speakerClass = speakerDict[key];
    if (!speakerClass) throw new Error('Unknown key');
    const speaker = new speakerClass(member, options);
    this.setCache(member, speaker);
    await this.save(member, key, speaker.toJSON());
  }
  async random(member: GuildMember) {
    const [key, speakerClass] =
      speakersArray[Number(member.id.at(-1)) % speakersArray.length];
    const speaker = speakerClass.random(member);
    this.setCache(member, speaker);
    await this.save(member, key, speaker.toJSON());
    return speaker;
  }
}

export const speakers = new SpeakerManager();
