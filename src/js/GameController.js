/* eslint-disable no-param-reassign */
import GamePlay from './GamePlay';
import GameState from './GameState';
import PositionedCharacter from './PositionedCharacter';
import Team from './Team';
import themes from './themes';
import cursors from './cursors';
import Bowman from './Bowman';
import Daemon from './Daemon';
import Magician from './Magician';
import Swordsman from './Swordsman';
import Undead from './Undead';
import Vampire from './Vampire';
import Zombie from './Zombie';
import { generateTeam } from './generators';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.scores = 0;
    this.level = 1;
    this.chosenCharacterCell = -1;
    this.createdTeam = [];
    if (this.stateService.storage.getItem('state')) {
      GameState.from(this.stateService.load());
    }
  }

  getPositionedCharacters(player, quantity) {
    let level;
    if (GameState && GameState.level) {
      level = GameState.level;
    } else {
      level = this.level;
    }
    const positionedCharacters = [];
    let arrChar = [];
    if (player === 'gamerStarter') {
      arrChar = generateTeam(new Team().gamerStarter, level, quantity);
    } else if (player === 'gamer') {
      arrChar = generateTeam(new Team().gamer, level - 1, quantity);
    } else {
      arrChar = generateTeam(new Team().ai, level, quantity);
    }
    for (let i = 0; i < arrChar.length; i += 1) {
      const character = arrChar[i].newCharacter;
      const { position } = arrChar[i];
      const positionedCharacter = new PositionedCharacter(character, position);
      positionedCharacters.push(positionedCharacter);
    }
    return positionedCharacters;
  }

  drawTheme(level) {
    switch (level) {
      case 1:
        this.gamePlay.drawUi(themes.prairie);
        break;
      case 2:
        this.gamePlay.drawUi(themes.desert);
        break;
      case 3:
        this.gamePlay.drawUi(themes.arctic);
        break;
      case 4:
        this.gamePlay.drawUi(themes.mountain);
        break;
      default:
        break;
    }
  }

  updateScores() {
    const scoresElem = document.querySelector('.scores');
    if (GameState && GameState.level) {
      scoresElem.innerText = `Scores: ${GameState.scores}`;
    } else {
      scoresElem.innerText = `Scores: ${this.scores}`;
    }
  }

  updateLevel() {
    const levelElem = document.querySelector('.level');
    if (GameState && GameState.level) {
      levelElem.innerText = `Level: ${GameState.level}`;
    } else {
      levelElem.innerText = `Level: ${this.level}`;
    }
  }

  init() {
    if (GameState && GameState.level) {
      this.drawTheme(GameState.level);
    } else {
      this.gamePlay.drawUi(themes.prairie);
    }
    this.updateLevel();
    this.updateScores();

    if (GameState.chars && GameState.chars.length > 0) {
      this.createdTeam = [...GameState.chars];
    } else {
      const gamerTeam = this.getPositionedCharacters('gamerStarter', 2);
      const aITeam = this.getPositionedCharacters('npc', 2);
      this.createdTeam = [...gamerTeam, ...aITeam];
    }
    this.gamePlay.redrawPositions(this.createdTeam);
    this.showCharInfo();
    if (!GameState.chars) {
      this.saveState('gamer');
    }

    this.gamePlay.addNewGameListener(this.onNewGameClick.bind(this));
    this.gamePlay.addSaveGameListener(this.onSaveGameClick.bind(this));
    this.gamePlay.addLoadGameListener(this.onLoadGameClick.bind(this));

    if (GameState && GameState.activePlayer === 'npc') {
      this.npcWork();
    }
  }

  saveState(player) {
    this.stateService.save({
      chars: this.createdTeam,
      activePlayer: player,
      level: this.level,
      scores: this.scores,
    });
    GameState.from(this.stateService.load());
  }

  showCharInfo() {
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
  }

  onNewGameClick() {
    this.scores = GameState.scores;
    GameState.activePlayer = 'gamer';
    GameState.chars = [];
    GameState.level = 1;
    this.chosenCharacterCell = -1;
    this.init();
  }

  onSaveGameClick() {
    this.stateService.userSave({
      chars: this.createdTeam,
      activePlayer: 'gamer',
      level: this.level,
      scores: this.scores,
    });
    GamePlay.showMessage('Game saved');
  }

  onLoadGameClick() {
    if (this.stateService.storage.getItem('UserState')) {
      GameState.from(this.stateService.userLoad());
      this.chosenCharacterCell = -1;
      this.init();
    } else {
      GamePlay.showMessage('No saved games detected');
    }
  }

  checkLvlUp() {
    if (GameState.activePlayer === 'gamer') {
      if (this.checkWin('npc') > 0) {
        GameState.activePlayer = 'npc';
        this.saveState('npc');
        this.npcWork();
      } else {
        let scorePoints = 0;
        GameState.chars.forEach((elem) => {
          if (elem.character.health > 0) {
            scorePoints += elem.character.health;
          }
        });
        GameState.scores += scorePoints;
        if (GameState.level < 4) {
          GameState.level += 1;
          this.levelUp();
        } else {
          this.saveState('gamer');
          GamePlay.showMessage('Congratulations, you\'ve won');
          this.endGame();
        }
      }
    } else if (this.checkWin('gamer') > 0) {
      GameState.activePlayer = 'gamer';
      this.saveState('gamer');
    } else {
      GamePlay.showMessage('you\'ve lost');
      this.endGame();
    }
    this.updateLevel();
    this.updateScores();
  }

  endGame() {
    this.gamePlay.cellClickListeners = [];
    this.gamePlay.cellEnterListeners = [];
    this.gamePlay.cellLeaveListeners = [];
  }

  levelUp() {
    GamePlay.showMessage('Congratulation, you have passed this level');
    const playerTeam = GameState.chars.filter((elem) => elem.character.team === 'gamer' && elem.character.health > 0);
    playerTeam.forEach((elem) => {
      elem.character.level += 1;
      elem.character.attack = Math.max(
        elem.character.attack,
        elem.character.attack * ((1.8 - elem.character.health) / 100),
      );
      elem.character.health += 80;
      if (elem.character.health > 100) {
        elem.character.health = 100;
      }
    });
    let playerNewCharacter = [];
    if (GameState.level === 2) {
      playerNewCharacter = this.getPositionedCharacters('gamer', 1);
    } else {
      playerNewCharacter = this.getPositionedCharacters('gamer', 2);
    }
    playerNewCharacter.forEach((elem) => playerTeam.push(elem));
    const npcTeam = this.getPositionedCharacters('npc', playerTeam.length);
    this.createdTeam = [...playerTeam, ...npcTeam];
    this.drawTheme(GameState.level);
    this.gamePlay.redrawPositions(this.createdTeam);
    this.saveState('gamer');
  }

  npcWork() {
    const chars = [];
    const charsHp = [];
    for (let i = 0; i < GameState.chars.length; i += 1) {
      const elem = GameState.chars[i];
      if (elem.character.team === 'npc' && elem.character.health > 0) {
        chars.push(GameState.chars[i]);
        charsHp.push(elem.character.health);
      }
    }
    const char = chars[charsHp.indexOf(Math.min(...charsHp))];
    const enemy = this.findNpcEnemy(char.position, char.character.type);
    if (enemy === false) {
      this.npcMove(char.position, char.character.type);
    } else {
      this.npcAttack(enemy, char.character.type);
    }
  }

  npcMove(index, character) {
    let cellsQuantity = 0;
    if (character === 'Undead') {
      cellsQuantity = 4;
    } else if (character === 'Vampire') {
      cellsQuantity = 2;
    } else if (character === 'Daemon') {
      cellsQuantity = 1;
    }
    let moveZone = this.getZone(index, cellsQuantity);
    const positions = [];
    GameState.chars.forEach((element) => positions.push(element.position));
    moveZone = moveZone.filter((elem) => elem >= 0 && elem < 64 && !positions.includes(elem));
    const cell = Math.floor(Math.random() * moveZone.length);
    const char = this.createdTeam.findIndex((elem) => elem.position === index);
    this.createdTeam[char].position = moveZone[cell];
    this.gamePlay.redrawPositions(this.createdTeam);
    this.saveState('gamer');
  }

  findNpcEnemy(index, character) {
    const enemies = [];
    for (let i = 0; i < GameState.chars.length; i += 1) {
      const elem = GameState.chars[i];
      if (elem.character.team === 'gamer' && elem.character.health > 0) {
        enemies.push(GameState.chars[i]);
      }
    }

    let cellsQuantity = 0;
    if (character === 'Daemon') {
      cellsQuantity = 4;
    } else if (character === 'Vampire') {
      cellsQuantity = 2;
    } else if (character === 'Undead') {
      cellsQuantity = 1;
    }
    let dmgZone = this.getZone(index, cellsQuantity);
    dmgZone = dmgZone.filter((elem) => elem >= 0 && elem < 64);
    const enemiesInZone = enemies.filter((elem) => dmgZone.includes(elem.position));
    if (enemiesInZone.length === 0) {
      return false;
    }
    if (enemiesInZone.length > 1) {
      const hp = [];
      enemiesInZone.forEach((elem) => hp.push(elem.character.health));
      return enemiesInZone[hp.indexOf(Math.min(...hp))];
    }
    return enemiesInZone[0];
  }

  npcAttack(enemy, character) {
    let attack;
    let defence;
    console.log('enemy', enemy);
    console.log('character', character);
    if (character === 'Daemon') {
      attack = new Daemon().attack;
    } else if (character === 'Vampire') {
      attack = new Vampire().attack;
    } else if (character === 'Undead') {
      attack = new Undead().attack;
    }
    if (enemy.character.type === 'Swordsman') {
      defence = new Swordsman().defence;
    } else if (enemy.character.type === 'Magician') {
      defence = new Magician().defence;
    } else if (enemy.character.type === 'Bowman') {
      defence = new Bowman().defence;
    }
    const damage = Math.round(Math.max(attack - defence, attack * 0.1));
    this.gamePlay.showDamage(enemy.position, damage).then(() => {
      console.log(this.createdTeam);
      enemy.character.health -= damage;
      console.log(`enemy health: ${enemy.character.health}`);
      if (enemy.character.health <= 0) {
        if (enemy.position === this.chosenCharacterCell) {
          this.gamePlay.deselectCell(enemy.position);
          this.chosenCharacterCell = -1;
        }
      }
      this.createdTeam = this.createdTeam.filter((elem) => elem.character.health > 0);
      this.gamePlay.redrawPositions(this.createdTeam);
      this.saveState('npc');
      this.checkLvlUp();
    });
  }

  onCellClick(index) {
    // TODO: react to click
    if (this.gamePlay.cells[index].children.length > 0) {
      const characterClass = this.gamePlay.cells[index].querySelector('.character').className;
      if (characterClass.includes('gamer')) {
        const selectedCell = this.gamePlay.cells.indexOf(document.querySelector('.selected-yellow'));
        if (selectedCell >= 0) {
          this.gamePlay.deselectCell(selectedCell);
        }
        this.gamePlay.selectCell(index);
        this.chosenCharacterCell = index;
      } else if (this.chosenCharacterCell !== -1) {
        const canMakeDmg = this.checkToDmg(index);
        if (canMakeDmg === true) {
          this.attackChar(index);
        } else {
          GamePlay.showError('Hero is too far to attack');
        }
      } else {
        GamePlay.showError('Its not your hero!');
      }
    } else {
      const canMove = this.checkToMove(index);
      if (canMove === true) {
        this.moveChar(index);
      }
    }
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
    if (this.gamePlay.cells[index].children.length > 0) {
      const character = this.gamePlay.cells[index].querySelector('.character').className;
      if (character.includes('gamer')) {
        this.gamePlay.setCursor(cursors.pointer);
      } else if (this.chosenCharacterCell !== -1) {
        const canMakeDmg = this.checkToDmg(index);
        if (canMakeDmg === true) {
          this.gamePlay.setCursor(cursors.crosshair);
          this.gamePlay.selectCell(index, 'red');
        } else {
          this.gamePlay.setCursor(cursors.notallowed);
        }
      }
      const message = this.getMessage(index);
      this.gamePlay.showCellTooltip(message, index);
    } else if (this.chosenCharacterCell !== -1) {
      const canMove = this.checkToMove(index);
      if (canMove === true) {
        this.gamePlay.setCursor(cursors.pointer);
        this.gamePlay.selectCell(index, 'green');
      } else {
        this.gamePlay.setCursor(cursors.notallowed);
      }
    }
  }

  onCellLeave(index) {
    // TODO: react to mouse leave
    this.gamePlay.hideCellTooltip(index);
    this.gamePlay.setCursor(cursors.auto);
    if (this.gamePlay.cells[index]) {
      const cellClass = this.gamePlay.cells[index].className;
      if (cellClass.includes('selected-green')) {
        this.gamePlay.deselectCell(index);
      }
      if (cellClass.includes('selected-red')) {
        this.gamePlay.deselectCell(index);
      }
    }
  }

  moveChar(index) {
    const char = this.createdTeam.findIndex((item) => item.position === this.chosenCharacterCell);
    this.createdTeam[char].position = index;
    this.gamePlay.redrawPositions(this.createdTeam);
    this.saveState('npc');
    this.chosenCharacterCell = index;
    const selectedCell = this.gamePlay.cells.indexOf(document.querySelector('.selected-yellow'));
    this.gamePlay.deselectCell(selectedCell);
    this.gamePlay.selectCell(index);
    this.npcWork();
  }

  attackChar(index) {
    const charClass = this.gamePlay.cells[this.chosenCharacterCell].querySelector('.character').className;
    const enemyClass = this.gamePlay.cells[index].querySelector('.character').className;
    let attack;
    let defence;
    if (charClass.includes('Bowman')) {
      attack = new Bowman().attack;
    } else if (charClass.includes('Magician')) {
      attack = new Magician().attack;
    } else if (charClass.includes('Swordsman')) {
      attack = new Swordsman().attack;
    }
    if (enemyClass.includes('Daemon')) {
      defence = new Daemon().defence;
    } else if (enemyClass.includes('Vampire')) {
      defence = new Vampire().defence;
    } else if (enemyClass.includes('Undead')) {
      defence = new Undead().defence;
    }
    const damage = Math.round(Math.max(
      attack - defence,
      attack * 0.1,
    ));
    this.gamePlay.showDamage(index, damage).then(() => {
      const enemy = this.createdTeam.findIndex((item) => item.position === index);
      this.createdTeam[enemy].character.health -= damage;
      this.createdTeam = this.createdTeam.filter((item) => item.character.health > 0);
      this.gamePlay.redrawPositions(this.createdTeam);
      this.saveState('gamer');
      this.checkLvlUp();
      this.npcWork();
    });
  }

  checkToMove(index) {
    const char = this.gamePlay.cells[this.chosenCharacterCell].querySelector('.character').className;
    let cellsQuantity = 0;
    if (char.includes('Swordsman')) {
      cellsQuantity = 4;
    } else if (char.includes('Bowman')) {
      cellsQuantity = 2;
    } else if (char.includes('Magician')) {
      cellsQuantity = 1;
    }
    const zoneMovement = this.getZone(this.chosenCharacterCell, cellsQuantity);
    if (zoneMovement.includes(index)) {
      return true;
    }
    return false;
  }

  checkToDmg(index) {
    const char = this.gamePlay.cells[this.chosenCharacterCell].querySelector('.character').className;
    let cellsQuantity = 0;
    if (char.includes('Swordsman')) {
      cellsQuantity = 1;
    } else if (char.includes('Bowman')) {
      cellsQuantity = 2;
    } else if (char.includes('Magician')) {
      cellsQuantity = 4;
    }
    const zoneMovement = this.getZone(this.chosenCharacterCell, cellsQuantity);
    if (zoneMovement.includes(index)) {
      return true;
    }
    return false;
  }

  getMessage(index) {
    const cell = this.gamePlay.cells[index];
    const characterClass = cell.querySelector('.character').className;
    const levelClass = cell.querySelector('.health-level').className;
    const level = levelClass.substring(levelClass.indexOf(' ') + 1, levelClass.length) * 1;
    const healthClass = cell.querySelector('.health-level-indicator').className;
    const health = healthClass.substring(0, healthClass.indexOf(' ')) * 1;
    let attack;
    let defence;
    if (characterClass.includes('Bowman')) {
      attack = new Bowman().attack;
      defence = new Bowman().defence;
    } else if (characterClass.includes('Daemon')) {
      attack = new Daemon().attack;
      defence = new Daemon().defence;
    } else if (characterClass.includes('Magician')) {
      attack = new Magician().attack;
      defence = new Magician().defence;
    } else if (characterClass.includes('Swordsman')) {
      attack = new Swordsman().attack;
      defence = new Swordsman().defence;
    } else if (characterClass.includes('Undead')) {
      attack = new Undead().attack;
      defence = new Undead().defence;
    } else if (characterClass.includes('Vampire')) {
      attack = new Vampire().attack;
      defence = new Vampire().defence;
    } else if (characterClass.includes('Zombie')) {
      attack = new Zombie().attack;
      defence = new Zombie().defence;
    }
    return `\ud83c\udf96${level} \u2694${attack} \ud83d\udee1${defence} \u2764${health}`;
  }

  getZone(index, cellsQuantity) {
    const zone = [];
    for (let i = 0; i <= cellsQuantity; i += 1) {
      zone.push(index + this.gamePlay.boardSize * i);
      zone.push(index - this.gamePlay.boardSize * i);
      let check = true;
      for (let j = 1; j <= i; j += 1) {
        if ((index + j) % this.gamePlay.boardSize === 0) {
          check = false;
        }
      }
      if (check === true) {
        zone.push(index + i);
        zone.push(index - (this.gamePlay.boardSize - 1) * i);
        zone.push(index + (this.gamePlay.boardSize + 1) * i);
      }
      check = true;
      for (let j = 0; j < i; j += 1) {
        if ((index - 1 * j) % this.gamePlay.boardSize === 0) {
          check = false;
        }
      }
      if (check === true) {
        zone.push(index - i);
        zone.push(index - (this.gamePlay.boardSize + 1) * i);
        zone.push(index + (this.gamePlay.boardSize - 1) * i);
      }
    }
    return zone;
  }

  checkWin(player) {
    let num = 0;
    for (let i = 0; i < this.createdTeam.length; i += 1) {
      const elem = this.createdTeam[i];
      if (elem.character.team === player && elem.character.health > 0) {
        num += 1;
      }
    }
    return num;
  }
}
