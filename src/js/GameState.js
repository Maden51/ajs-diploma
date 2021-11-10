export default class GameState {
  static from(object) {
    // TODO: create object
    this.chars = object.chars;
    this.activePlayer = object.activePlayer;
    this.level = object.level;
    this.scores = object.scores;
    return null;
  }
}
