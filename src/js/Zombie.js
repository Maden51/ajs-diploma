import Character from './Character';

export default class Zombie extends Character {
  constructor(level, type = 'Zombie') {
    super(level, type);
    this.attack = 40;
    this.defence = 10;
  }
}
