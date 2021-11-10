export default class GameStateService {
  constructor(storage) {
    this.storage = storage;
  }

  save(state) {
    this.storage.setItem('state', JSON.stringify(state));
  }

  userSave(state) {
    this.storage.setItem('UserState', JSON.stringify(state));
  }

  load() {
    try {
      return JSON.parse(this.storage.getItem('state'));
    } catch (e) {
      throw new Error('Invalid state');
    }
  }

  userLoad() {
    try {
      return JSON.parse(this.storage.getItem('UserState'));
    } catch (e) {
      throw new Error('Invalid state');
    }
  }
}
