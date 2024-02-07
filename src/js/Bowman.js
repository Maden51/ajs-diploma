import Character from './Character';

export default class Bowman extends Character {
  constructor(level, type = 'Bowman') {
    super(level, type);
    this.attack = 50;
    this.defence = 25;
  }
}
