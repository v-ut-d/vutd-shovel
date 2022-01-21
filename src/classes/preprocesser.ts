import { readFileSync } from 'fs';
import { Snowflake } from 'discord.js';

type Dict = { [K in string]?: string };

export default class Preprocesser {
  ejDict: Dict;
  guildDict: Dict;

  constructor(guildId: Snowflake) {
    this.ejDict = parseDictionary('dictionary/bep-eng.dic');
    this.guildDict = parseDictionary(`dictionary/${guildId}.dic`);
  }

  exec(content: string): string {
    return content;
  }
}

function parseDictionary(path: string) {
  return readFileSync(path, 'utf-8')
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .reduce((dict, line) => {
      const [key, value] = line.split(' ');
      dict[key] = value.toLowerCase();
      return dict;
    }, {} as Dict);
}
