export default class Character {
  constructor(level, type = 'generic') {
    this.level = level;
    this.health = 100;
    this.type = type;
    // TODO: throw error if user use "new Character()"
    if (new.target.name === 'Character') {
      throw new Error('Создание объектов с именем Character запрещено');
    }
  }
}
