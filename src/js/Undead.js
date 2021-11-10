import Character from './Character';

export default class Undead extends Character {
  constructor(level, type = 'Undead') {
    super(level, type);
    this.attack = 25;
    this.defence = 25;
  }
}
