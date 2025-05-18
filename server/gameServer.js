// Import managers
const WorldManager = require('./world/worldManager');
const PlayerManager = require('./player/playerManager');
const MobManager = require('./mobs/mobManager');
const ItemManager = require('./items/itemManager');
const CraftingManager = require('./crafting/craftingManager');
const MessageManager = require('./message/messageManager');
const TrailblazerManager = require('./trailblazer/trailblazerManager');
const AnimalManager = require('./animal/animalManager');

class GameServer {
  constructor(config) {
    // Create managers
    this.worldManager = new WorldManager();
    this.playerManager = new PlayerManager();
    this.mobManager = new MobManager();
    this.itemManager = new ItemManager();
    this.craftingManager = new CraftingManager();
    this.messageManager = new MessageManager();
    this.trailblazerManager = new TrailblazerManager();
    this.animalManager = new AnimalManager();
  }
  
  async initialize() {
    // Create game context to pass to managers
    const gameContext = {
      worldManager: this.worldManager,
      playerManager: this.playerManager,
      mobManager: this.mobManager,
      itemManager: this.itemManager,
      craftingManager: this.craftingManager,
      messageManager: this.messageManager,
      trailblazerManager: this.trailblazerManager,
      animalManager: this.animalManager
    };
    
    // Initialize managers with context
    this.worldManager.initialize(gameContext);
    this.playerManager.initialize(gameContext);
    this.mobManager.initialize(gameContext);
    this.itemManager.initialize(gameContext);
    this.craftingManager.initialize(gameContext);
    this.messageManager.initialize(gameContext);
    this.trailblazerManager.initialize(gameContext);
    this.animalManager.initialize(gameContext);
  }
  
  gameLoop() {
    // Update game managers
    this.worldManager.update(deltaTime);
    this.mobManager.update(this.worldManager.world, this.playerManager.players, deltaTime);
    this.playerManager.update(deltaTime);
    this.animalManager.update(deltaTime);
  }
} 