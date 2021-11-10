import Bowman from './Bowman';
import Daemon from './Daemon';
import Magician from './Magician';
import Swordsman from './Swordsman';
import Undead from './Undead';
import Vampire from './Vampire';

export default class Team {
  constructor() {
    this.gamer = {
      types: [Bowman, Swordsman, Magician],
      player: 'gamer',
    };
    this.gamerStarter = {
      types: [Bowman, Swordsman],
      player: 'gamer',
    };
    this.ai = {
      types: [Daemon, Undead, Vampire],
      player: 'npc',
    };
  }
}
