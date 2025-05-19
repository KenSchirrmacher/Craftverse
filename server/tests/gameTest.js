const assert = require('assert');
const { Game } = require('../game/game');
const { Player } = require('../entities/player');
const { World } = require('../world/world');

describe('Game', () => {
  let game;

  beforeEach(() => {
    game = new Game();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      assert.strictEqual(game.gameMode, 'survival');
      assert.strictEqual(game.difficulty, 'normal');
      assert.strictEqual(game.dayTime, 0);
      assert.strictEqual(game.weather, 'clear');
      assert.strictEqual(game.pvpEnabled, true);
      assert.strictEqual(game.keepInventory, false);
      assert.strictEqual(game.naturalRegeneration, true);
      assert.strictEqual(game.mobSpawning, true);
      assert.strictEqual(game.commandBlocks, false);
      assert.strictEqual(game.cheats, false);
    });

    it('should initialize with empty player list', () => {
      assert.strictEqual(game.players.size, 0);
    });

    it('should initialize with a new world', () => {
      assert(game.world instanceof World);
    });
  });

  describe('Player Management', () => {
    it('should add and remove players', () => {
      const player = new Player('test-player');
      game.addPlayer(player);
      assert.strictEqual(game.players.size, 1);
      assert.strictEqual(game.getPlayer('test-player'), player);

      game.removePlayer('test-player');
      assert.strictEqual(game.players.size, 0);
      assert.strictEqual(game.getPlayer('test-player'), undefined);
    });

    it('should emit events when players join and leave', (done) => {
      const player = new Player('test-player');
      let eventsReceived = 0;

      game.on('playerJoin', (joinedPlayer) => {
        assert.strictEqual(joinedPlayer, player);
        eventsReceived++;
        if (eventsReceived === 2) done();
      });

      game.on('playerLeave', (leftPlayer) => {
        assert.strictEqual(leftPlayer, player);
        eventsReceived++;
        if (eventsReceived === 2) done();
      });

      game.addPlayer(player);
      game.removePlayer('test-player');
    });
  });

  describe('Game Settings', () => {
    it('should set valid game modes', () => {
      const validModes = ['survival', 'creative', 'adventure', 'spectator'];
      validModes.forEach(mode => {
        game.setGameMode(mode);
        assert.strictEqual(game.gameMode, mode);
      });
    });

    it('should not set invalid game modes', () => {
      game.setGameMode('invalid-mode');
      assert.strictEqual(game.gameMode, 'survival');
    });

    it('should set valid difficulties', () => {
      const validDifficulties = ['peaceful', 'easy', 'normal', 'hard'];
      validDifficulties.forEach(difficulty => {
        game.setDifficulty(difficulty);
        assert.strictEqual(game.difficulty, difficulty);
      });
    });

    it('should not set invalid difficulties', () => {
      game.setDifficulty('invalid-difficulty');
      assert.strictEqual(game.difficulty, 'normal');
    });

    it('should set valid weather types', () => {
      const validWeathers = ['clear', 'rain', 'thunder'];
      validWeathers.forEach(weather => {
        game.setWeather(weather);
        assert.strictEqual(game.weather, weather);
      });
    });

    it('should not set invalid weather types', () => {
      game.setWeather('invalid-weather');
      assert.strictEqual(game.weather, 'clear');
    });
  });

  describe('Day/Night Cycle', () => {
    it('should update day time', () => {
      game.setDayTime(1000);
      assert.strictEqual(game.dayTime, 1000);
    });

    it('should wrap day time around 24000', () => {
      game.setDayTime(23999);
      game.updateDayNightCycle();
      assert.strictEqual(game.dayTime, 0);
    });

    it('should not set invalid day time', () => {
      game.setDayTime(25000);
      assert.strictEqual(game.dayTime, 0);
    });
  });

  describe('Game Rules', () => {
    it('should toggle PvP', () => {
      game.setPvP(false);
      assert.strictEqual(game.pvpEnabled, false);
      game.setPvP(true);
      assert.strictEqual(game.pvpEnabled, true);
    });

    it('should toggle keep inventory', () => {
      game.setKeepInventory(true);
      assert.strictEqual(game.keepInventory, true);
      game.setKeepInventory(false);
      assert.strictEqual(game.keepInventory, false);
    });

    it('should toggle natural regeneration', () => {
      game.setNaturalRegeneration(false);
      assert.strictEqual(game.naturalRegeneration, false);
      game.setNaturalRegeneration(true);
      assert.strictEqual(game.naturalRegeneration, true);
    });

    it('should toggle mob spawning', () => {
      game.setMobSpawning(false);
      assert.strictEqual(game.mobSpawning, false);
      game.setMobSpawning(true);
      assert.strictEqual(game.mobSpawning, true);
    });

    it('should toggle command blocks', () => {
      game.setCommandBlocks(true);
      assert.strictEqual(game.commandBlocks, true);
      game.setCommandBlocks(false);
      assert.strictEqual(game.commandBlocks, false);
    });

    it('should toggle cheats', () => {
      game.setCheats(true);
      assert.strictEqual(game.cheats, true);
      game.setCheats(false);
      assert.strictEqual(game.cheats, false);
    });
  });

  describe('Save and Load', () => {
    it('should save and load game state', () => {
      // Set up some game state
      const player = new Player('test-player');
      game.addPlayer(player);
      game.setGameMode('creative');
      game.setDifficulty('hard');
      game.setWeather('rain');
      game.setDayTime(12000);
      game.setPvP(false);
      game.setKeepInventory(true);

      // Save game state
      const savedState = game.save();

      // Create new game instance
      const newGame = new Game();

      // Load saved state
      newGame.load(savedState);

      // Verify loaded state
      assert.strictEqual(newGame.gameMode, 'creative');
      assert.strictEqual(newGame.difficulty, 'hard');
      assert.strictEqual(newGame.weather, 'rain');
      assert.strictEqual(newGame.dayTime, 12000);
      assert.strictEqual(newGame.pvpEnabled, false);
      assert.strictEqual(newGame.keepInventory, true);
      assert.strictEqual(newGame.players.size, 1);
      assert(newGame.getPlayer('test-player') instanceof Player);
    });
  });

  describe('Event Emission', () => {
    it('should emit events for game mode changes', (done) => {
      game.on('gameModeUpdate', (mode) => {
        assert.strictEqual(mode, 'creative');
        done();
      });

      game.setGameMode('creative');
    });

    it('should emit events for difficulty changes', (done) => {
      game.on('difficultyUpdate', (difficulty) => {
        assert.strictEqual(difficulty, 'hard');
        done();
      });

      game.setDifficulty('hard');
    });

    it('should emit events for weather changes', (done) => {
      game.on('weatherUpdate', (weather) => {
        assert.strictEqual(weather, 'rain');
        done();
      });

      game.setWeather('rain');
    });

    it('should emit events for day time changes', (done) => {
      game.on('dayTimeUpdate', (time) => {
        assert.strictEqual(time, 12000);
        done();
      });

      game.setDayTime(12000);
    });
  });
}); 