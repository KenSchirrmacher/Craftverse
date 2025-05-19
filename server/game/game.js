const EventEmitter = require('events');
const { World } = require('../world/world');
const { Player } = require('../entities/player');
const { Inventory } = require('../inventory/inventory');

class Game extends EventEmitter {
  constructor() {
    super();
    this.world = new World();
    this.players = new Map();
    this.gameMode = 'survival';
    this.difficulty = 'normal';
    this.dayTime = 0;
    this.weather = 'clear';
    this.pvpEnabled = true;
    this.keepInventory = false;
    this.naturalRegeneration = true;
    this.mobSpawning = true;
    this.commandBlocks = false;
    this.cheats = false;
  }

  initialize() {
    // Initialize world
    this.world.initialize();
    
    // Start game loop
    this.startGameLoop();
  }

  startGameLoop() {
    const TICK_RATE = 20; // 20 ticks per second
    const TICK_INTERVAL = 1000 / TICK_RATE;
    
    setInterval(() => {
      this.tick();
    }, TICK_INTERVAL);
  }

  tick() {
    // Update world
    this.world.update();
    
    // Update players
    for (const player of this.players.values()) {
      player.update();
    }
    
    // Update day/night cycle
    this.updateDayNightCycle();
    
    // Update weather
    this.updateWeather();
    
    // Emit tick event
    this.emit('tick');
  }

  updateDayNightCycle() {
    this.dayTime = (this.dayTime + 1) % 24000;
    this.emit('dayTimeUpdate', this.dayTime);
  }

  updateWeather() {
    // Weather changes randomly every 30 minutes
    if (Math.random() < 0.001) {
      const weathers = ['clear', 'rain', 'thunder'];
      this.weather = weathers[Math.floor(Math.random() * weathers.length)];
      this.emit('weatherUpdate', this.weather);
    }
  }

  addPlayer(player) {
    this.players.set(player.id, player);
    this.emit('playerJoin', player);
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      this.players.delete(playerId);
      this.emit('playerLeave', player);
    }
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  setGameMode(mode) {
    const validModes = ['survival', 'creative', 'adventure', 'spectator'];
    if (validModes.includes(mode)) {
      this.gameMode = mode;
      this.emit('gameModeUpdate', mode);
    }
  }

  setDifficulty(difficulty) {
    const validDifficulties = ['peaceful', 'easy', 'normal', 'hard'];
    if (validDifficulties.includes(difficulty)) {
      this.difficulty = difficulty;
      this.emit('difficultyUpdate', difficulty);
    }
  }

  setWeather(weather) {
    const validWeathers = ['clear', 'rain', 'thunder'];
    if (validWeathers.includes(weather)) {
      this.weather = weather;
      this.emit('weatherUpdate', weather);
    }
  }

  setDayTime(time) {
    if (time >= 0 && time < 24000) {
      this.dayTime = time;
      this.emit('dayTimeUpdate', time);
    }
  }

  setPvP(enabled) {
    this.pvpEnabled = enabled;
    this.emit('pvpUpdate', enabled);
  }

  setKeepInventory(enabled) {
    this.keepInventory = enabled;
    this.emit('keepInventoryUpdate', enabled);
  }

  setNaturalRegeneration(enabled) {
    this.naturalRegeneration = enabled;
    this.emit('naturalRegenerationUpdate', enabled);
  }

  setMobSpawning(enabled) {
    this.mobSpawning = enabled;
    this.emit('mobSpawningUpdate', enabled);
  }

  setCommandBlocks(enabled) {
    this.commandBlocks = enabled;
    this.emit('commandBlocksUpdate', enabled);
  }

  setCheats(enabled) {
    this.cheats = enabled;
    this.emit('cheatsUpdate', enabled);
  }

  save() {
    const gameState = {
      world: this.world.serialize(),
      players: Array.from(this.players.entries()).map(([id, player]) => ({
        id,
        data: player.serialize()
      })),
      gameMode: this.gameMode,
      difficulty: this.difficulty,
      dayTime: this.dayTime,
      weather: this.weather,
      pvpEnabled: this.pvpEnabled,
      keepInventory: this.keepInventory,
      naturalRegeneration: this.naturalRegeneration,
      mobSpawning: this.mobSpawning,
      commandBlocks: this.commandBlocks,
      cheats: this.cheats
    };
    
    return gameState;
  }

  load(gameState) {
    // Load world
    this.world.deserialize(gameState.world);
    
    // Load players
    this.players.clear();
    for (const playerData of gameState.players) {
      const player = new Player(playerData.id);
      player.deserialize(playerData.data);
      this.players.set(playerData.id, player);
    }
    
    // Load game settings
    this.gameMode = gameState.gameMode;
    this.difficulty = gameState.difficulty;
    this.dayTime = gameState.dayTime;
    this.weather = gameState.weather;
    this.pvpEnabled = gameState.pvpEnabled;
    this.keepInventory = gameState.keepInventory;
    this.naturalRegeneration = gameState.naturalRegeneration;
    this.mobSpawning = gameState.mobSpawning;
    this.commandBlocks = gameState.commandBlocks;
    this.cheats = gameState.cheats;
    
    // Emit load event
    this.emit('gameLoaded');
  }
}

module.exports = { Game }; 