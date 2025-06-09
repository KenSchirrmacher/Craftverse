const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const saveSystem = require('./saveSystem');
const MobManager = require('./mobs/mobManager');
const WorldGenerator = require('./utils/worldGenerator');
const EnchantmentTable = require('./enchantments/enchantmentTable');
const EnchantmentManager = require('./enchantments/enchantmentManager');
const BrewingSystem = require('./potions/brewingSystem');
const StatusEffectsManager = require('./entities/statusEffectsManager');
const BrewingHandler = require('./blocks/brewingHandler');
const PotionRegistry = require('./items/potionRegistry');
const PortalManager = require('./world/portalManager');
const DimensionManager = require('./world/dimensionManager');
const NetherDimension = require('./world/netherDimension');
const VillageReputationManager = require('./world/villageReputationManager');
const CombatManager = require('./combat/combatManager');
const WeatherSystem = require('./weather/weatherSystem');
const BlockRegistry = require('./blocks/blockRegistry');
const ItemRegistry = require('./items/itemRegistry');
const CraftingManager = require('./crafting/craftingManager');
const BackupSystem = require('./backup/backupSystem');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Game state
const players = {};
let blocks = {};
const mobs = {};
const mobTypes = {};
const projectiles = {};
const itemEntities = {};
const brewingHandlers = {}; // Store brewing stand handlers by position
let currentWorld = 'default';

// Block types and their properties
const blockTypes = {
  grass: { name: 'Grass', hardness: 1 },
  dirt: { name: 'Dirt', hardness: 1 },
  stone: { name: 'Stone', hardness: 2 },
  wood: { name: 'Wood', hardness: 1.5 },
  leaves: { name: 'Leaves', hardness: 0.5 },
  sand: { name: 'Sand', hardness: 1 },
  water: { name: 'Water', hardness: 0 },
  lava: { name: 'Lava', hardness: 0 },
  glass: { name: 'Glass', hardness: 1 },
  brick: { name: 'Brick', hardness: 2 },
  cobblestone: { name: 'Cobblestone', hardness: 2 },
  iron_ore: { name: 'Iron Ore', hardness: 3 },
  diamond_ore: { name: 'Diamond Ore', hardness: 4 },
  
  // Nether blocks
  netherrack: { name: 'Netherrack', hardness: 0.4 },
  soul_sand: { name: 'Soul Sand', hardness: 0.5, slowness: true },
  soul_soil: { name: 'Soul Soil', hardness: 0.5 },
  basalt: { name: 'Basalt', hardness: 1.25 },
  blackstone: { name: 'Blackstone', hardness: 1.5 },
  nether_gold_ore: { name: 'Nether Gold Ore', hardness: 3 },
  nether_quartz_ore: { name: 'Nether Quartz Ore', hardness: 3 },
  crimson_nylium: { name: 'Crimson Nylium', hardness: 0.4 },
  warped_nylium: { name: 'Warped Nylium', hardness: 0.4 },
  crimson_stem: { name: 'Crimson Stem', hardness: 2 },
  warped_stem: { name: 'Warped Stem', hardness: 2 },
  crimson_wart_block: { name: 'Crimson Wart Block', hardness: 1 },
  warped_wart_block: { name: 'Warped Wart Block', hardness: 1 },
  shroomlight: { name: 'Shroomlight', hardness: 1, light: 15 },
  nether_wart_block: { name: 'Nether Wart Block', hardness: 1 },
  magma_block: { name: 'Magma Block', hardness: 0.5, damage: true, light: 3 },
  glowstone: { name: 'Glowstone', hardness: 0.3, light: 15 },
  obsidian: { name: 'Obsidian', hardness: 50, blast_resistance: 1200 },
  ancient_debris: { name: 'Ancient Debris', hardness: 30 },
  nether_brick: { name: 'Nether Brick', hardness: 2 },
  gilded_blackstone: { name: 'Gilded Blackstone', hardness: 1.5 },
  nether_portal: { name: 'Nether Portal', hardness: -1, solid: false, transparent: true, light: 11 },
  
  // Ocean monument blocks
  prismarine: { name: 'Prismarine', hardness: 1.5 },
  prismarine_bricks: { name: 'Prismarine Bricks', hardness: 1.5 },
  dark_prismarine: { name: 'Dark Prismarine', hardness: 1.5 },
  sea_lantern: { name: 'Sea Lantern', hardness: 0.3, light: 15 },
  
  // Caves & Cliffs blocks
  candle: { name: 'Candle', hardness: 0.1, light: 3, transparent: true },
  white_candle: { name: 'White Candle', hardness: 0.1, light: 3, transparent: true },
  orange_candle: { name: 'Orange Candle', hardness: 0.1, light: 3, transparent: true },
  magenta_candle: { name: 'Magenta Candle', hardness: 0.1, light: 3, transparent: true },
  light_blue_candle: { name: 'Light Blue Candle', hardness: 0.1, light: 3, transparent: true },
  yellow_candle: { name: 'Yellow Candle', hardness: 0.1, light: 3, transparent: true },
  lime_candle: { name: 'Lime Candle', hardness: 0.1, light: 3, transparent: true },
  pink_candle: { name: 'Pink Candle', hardness: 0.1, light: 3, transparent: true },
  gray_candle: { name: 'Gray Candle', hardness: 0.1, light: 3, transparent: true },
  light_gray_candle: { name: 'Light Gray Candle', hardness: 0.1, light: 3, transparent: true },
  cyan_candle: { name: 'Cyan Candle', hardness: 0.1, light: 3, transparent: true },
  purple_candle: { name: 'Purple Candle', hardness: 0.1, light: 3, transparent: true },
  blue_candle: { name: 'Blue Candle', hardness: 0.1, light: 3, transparent: true },
  brown_candle: { name: 'Brown Candle', hardness: 0.1, light: 3, transparent: true },
  green_candle: { name: 'Green Candle', hardness: 0.1, light: 3, transparent: true },
  red_candle: { name: 'Red Candle', hardness: 0.1, light: 3, transparent: true },
  black_candle: { name: 'Black Candle', hardness: 0.1, light: 3, transparent: true }
};

// Tool types and their properties
const toolTypes = {
  wooden_pickaxe: { name: 'Wooden Pickaxe', durability: 60, efficiency: 1.2 },
  wooden_axe: { name: 'Wooden Axe', durability: 60, efficiency: 1.2 },
  wooden_sword: { name: 'Wooden Sword', durability: 60, damage: 4 },
  stone_pickaxe: { name: 'Stone Pickaxe', durability: 132, efficiency: 1.5 },
  stone_axe: { name: 'Stone Axe', durability: 132, efficiency: 1.5 },
  stone_sword: { name: 'Stone Sword', durability: 132, damage: 5 },
  iron_pickaxe: { name: 'Iron Pickaxe', durability: 251, efficiency: 2 },
  iron_axe: { name: 'Iron Axe', durability: 251, efficiency: 2 },
  iron_sword: { name: 'Iron Sword', durability: 251, damage: 6 },
  diamond_pickaxe: { name: 'Diamond Pickaxe', durability: 1562, efficiency: 3 },
  diamond_axe: { name: 'Diamond Axe', durability: 1562, efficiency: 3 },
  diamond_sword: { name: 'Diamond Sword', durability: 1562, damage: 7 }
};

// Initialize mob manager
const mobManager = new MobManager();

// Generate a random world seed
const worldSeed = Math.floor(Math.random() * 1000000);

// Create a world generator with default settings
const worldGenerator = new WorldGenerator({
  seed: worldSeed,
  seaLevel: 63,
  generationSettings: {
    generateCaves: true,
    generateStructures: true,
    generateDecorations: true,
    chunkSize: 16,
    generateBedrock: true
  }
});

// Connect mob manager to biome manager for biome-specific spawning
mobManager.setBiomeManager(worldGenerator.biomeManager);
mobManager.setWorldSeed(worldSeed);

// Create "world" object that will be used by various systems
const world = {
  getBlock: (x, y, z) => {
    const posKey = `${x},${y},${z}`;
    return blocks[posKey];
  },
  getMaxHeight: () => 256,
  getMinHeight: () => 0,
  seed: worldSeed,
  generator: worldGenerator
};

// Weather state
let isRaining = false;
let moonPhase = 0;
let worldTime = 0;

// Initialize enchantment system
const enchantmentTable = new EnchantmentTable();
const enchantmentManager = new EnchantmentManager();

// Initialize status effects manager
global.statusEffectsManager = new StatusEffectsManager();

// Initialize brewing system
global.brewingSystem = new BrewingSystem(io);

// Initialize combat manager
global.combatManager = new CombatManager({
  server: io,
  statusEffectsManager: global.statusEffectsManager
});

// Initialize dimension manager
global.dimensionManager = new DimensionManager({ server: io });

// Initialize portal manager
global.portalManager = new PortalManager();

// Link portal manager to dimension manager
global.portalManager.on('portalCreated', (portalData) => {
  global.dimensionManager.registerPortal(portalData);
});

// Initialize dimensions
// Initialize the Nether dimension with the same seed as the overworld for consistency
const netherDimension = new NetherDimension({ 
  seed: worldSeed,
  server: io 
});

// Initialize weather system
const weatherSystem = new WeatherSystem();

// Initialize weather system with world reference
weatherSystem.world = world;

// Listen for weather change events
weatherSystem.on('weatherChange', (data) => {
  console.log(`Weather changed to: ${data.weather}, duration: ${data.duration} ticks`);
});

// Listen for lightning strike events
weatherSystem.on('lightningStrike', (strike) => {
  console.log(`Lightning strike at: ${strike.x}, ${strike.y}, ${strike.z}`);
});

// Initialize dimension manager and register dimensions
global.dimensionManager.addDimension('overworld', { 
  id: 'overworld',
  getBlockType: (posKey) => blocks[posKey] ? blocks[posKey].type : null,
  setBlock: (posKey, blockData) => {
    blocks[posKey] = blockData;
    io.emit('blockUpdate', { position: posKey, type: blockData.type });
  }
});
global.dimensionManager.addDimension('nether', netherDimension);

// Initialize game systems
const potionRegistry = new PotionRegistry();
global.villageReputationManager = new VillageReputationManager();

// Initialize managers
global.craftingManager = new CraftingManager();
global.craftingManager.registerDefaultRecipes();

// Initialize backup system
global.backupSystem = new BackupSystem({
  backupDir: path.join(__dirname, '../backups'),
  maxBackups: 10,
  backupInterval: 3600000, // 1 hour
  maxErrors: 3,
  recoveryDelay: 5000 // 5 seconds
});

// Generate initial world
function generateWorld() {
  // Generate a small world area (41x41 blocks centered at origin)
  blocks = worldGenerator.generateWorld(41, 41);
  
  // Spawn initial mobs
  spawnInitialMobs();
}

// Spawn initial mobs in the world
function spawnInitialMobs() {
  // Spawn some passive mobs
  for (let i = 0; i < 5; i++) {
    const x = (Math.random() * 40) - 20;
    const z = (Math.random() * 40) - 20;
    const mobType = ['sheep', 'cow', 'pig', 'chicken'][Math.floor(Math.random() * 4)];
    mobManager.spawnMob(mobType, { x, y: 1, z });
  }
  
  // Spawn some neutral mobs
  for (let i = 0; i < 3; i++) {
    const x = (Math.random() * 40) - 20;
    const z = (Math.random() * 40) - 20;
    const mobType = ['wolf', 'spider'][Math.floor(Math.random() * 2)];
    mobManager.spawnMob(mobType, { x, y: 1, z });
  }
  
  // Spawn some hostile mobs in dark areas
  for (let i = 0; i < 5; i++) {
    const x = (Math.random() * 40) - 20;
    const z = (Math.random() * 40) - 20;
    const mobType = ['zombie', 'skeleton', 'creeper'][Math.floor(Math.random() * 3)];
    mobManager.spawnMob(mobType, { x, y: 1, z });
  }
}

// Game update loop
const TICK_RATE = 20; // 20 ticks per second
let lastUpdateTime = Date.now();

function gameLoop() {
  const now = Date.now();
  const deltaTime = now - lastUpdateTime;
  lastUpdateTime = now;
  
  // Convert to game ticks
  const deltaTicks = deltaTime * TICK_RATE / 1000;
  
  // Update world time
  worldTime += deltaTicks;
  if (worldTime >= 24000) {
    worldTime = worldTime % 24000;
    
    // Update moon phase every day
    moonPhase = (moonPhase + 1) % 8;
    mobManager.setMoonPhase(moonPhase);
    console.log(`Moon phase changed to: ${moonPhase}`);
  }
  
  // Update weather with our new WeatherSystem
  weatherSystem.update(deltaTicks);
  // Update mob manager with current weather state
  mobManager.setWeather(weatherSystem.currentWeather !== 'clear');
  // Broadcast weather updates to clients
  io.emit('weatherUpdate', { 
    weather: weatherSystem.currentWeather,
    isRaining: weatherSystem.currentWeather !== 'clear',
    isThundering: weatherSystem.currentWeather === 'thunder'
  });
  
  // Process any lightning strikes
  for (const strike of weatherSystem.lightningStrikes) {
    // Check if any lightning rods should attract this strike
    checkLightningRodAttractions(strike);
    
    // Notify clients about the lightning strike
    io.emit('lightningStrike', strike);
  }
  
  // Update mobs
  mobManager.update({blocks}, players, deltaTicks);
  
  // Send updated mob data to all clients
  io.emit('mobUpdate', mobManager.getMobData());
  
  // Send projectile data
  io.emit('projectileUpdate', mobManager.getProjectileData());
  
  // Process pending portal teleports
  if (global.dimensionManager) {
    // global.dimensionManager.processPendingTeleports(); // Method doesn't exist yet
  }
  
  // Update status effects
  if (global.statusEffectsManager) {
    global.statusEffectsManager.update(TICK_RATE);
  }
  
  // Update combat manager (cooldowns, shield states, etc.)
  if (global.combatManager) {
    global.combatManager.tick(deltaTime);
    
    // Send cooldown updates to players
    for (const playerId in players) {
      const cooldown = global.combatManager.getAttackCooldown(playerId);
      if (cooldown) {
        io.to(playerId).emit('attackCooldownUpdate', cooldown);
      }
    }
  }
  
  // Update reputation system
  if (global.villageReputationManager) {
    global.villageReputationManager.update(deltaTime);
  }
  
  // Schedule next update
  setTimeout(gameLoop, 1000 / TICK_RATE);
}

// Initialize world
generateWorld();

// Start game loop
gameLoop();

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Create new player with inventory
  const player = {
    id: socket.id,
    position: { x: 0, y: 1, z: 0 },
    rotation: { y: 0 },
    health: 100,
    maxHealth: 100,
    movementMode: 'walk',
    isBlocking: false,
    offhandItem: null,
    mainHandItem: null,
    inventory: {
      grass: 64,
      dirt: 64,
      stone: 64,
      wood: 64,
      leaves: 64,
      sand: 64,
      glass: 64,
      brick: 64,
      cobblestone: 0,
      iron_ore: 0,
      diamond_ore: 0,
      iron_ingot: 0,
      diamond: 0,
      wooden_planks: 0,
      stick: 0
    }
  };
  players[socket.id] = player;

  // Send initial game state to the new player
  socket.emit('gameState', { 
    players, 
    blocks, 
    mobs: mobManager.getMobData(),
    projectiles: mobManager.getProjectileData() 
  });

  // Broadcast new player to others
  socket.broadcast.emit('playerJoin', player);

  // Handle save game request
  socket.on('saveGame', (worldName) => {
    // Get mob data for saving
    const mobData = mobManager.getMobData();
    
    // Get reputation data if available
    const reputationData = global.villageReputationManager ? 
      global.villageReputationManager.serialize() : null;
    
    if (saveSystem.saveGame(worldName, players, blocks, mobData, { reputation: reputationData })) {
      socket.emit('saveComplete', { success: true, worldName });
    } else {
      socket.emit('saveComplete', { success: false, error: 'Failed to save game' });
    }
  });

  // Handle load game request
  socket.on('loadGame', (worldName) => {
    const saveData = saveSystem.loadGame(worldName);
    if (saveData) {
      Object.assign(players, saveData.players);
      Object.assign(blocks, saveData.blocks);
      
      // Load mobs if available
      if (saveData.mobs) {
        // Clear existing mobs
        mobManager.mobs = {};
        
        // Load saved mobs
        for (const mobId in saveData.mobs) {
          const mobData = saveData.mobs[mobId];
          const mob = mobManager.spawnMob(mobData.type, mobData.position);
          
          // Apply saved properties
          if (mob) {
            Object.assign(mob, mobData);
          }
        }
      }
      
      // Load reputation data if available
      if (saveData.reputation && global.villageReputationManager) {
        global.villageReputationManager.deserialize(saveData.reputation);
      }
      
      currentWorld = worldName;
      io.emit('gameState', { 
        players, 
        blocks, 
        mobs: mobManager.getMobData(),
        projectiles: mobManager.getProjectileData() 
      });
      socket.emit('loadComplete', { success: true, worldName });
    } else {
      socket.emit('loadComplete', { success: false, error: 'Failed to load game' });
    }
  });

  // Handle block updates
  socket.on('blockUpdate', (data) => {
    const { position, type } = data;
    const player = players[socket.id];
    
    if (!player) return;

    // Check if player has the block in inventory when placing
    if (type && (!player.inventory[type] || player.inventory[type] <= 0)) {
      return;
    }

    // Update block
    if (type === null) {
      // Removing block
      if (blocks[position]) {
        const removedType = blocks[position].type;
        // Only add to inventory if it's a collectible block
        if (blockTypes[removedType] && removedType !== 'water' && removedType !== 'lava') {
          player.inventory[removedType] = (player.inventory[removedType] || 0) + 1;
        }
        delete blocks[position];
      }
    } else {
      // Placing block
      if (!blocks[position]) {
        player.inventory[type]--;
        blocks[position] = { type };
      }
    }

    // Broadcast block update to all players
    io.emit('blockUpdate', { position, type });
    // Update player's inventory
    io.emit('playerUpdate', player);
  });

  // Handle chat messages
  socket.on('chatMessage', (data) => {
    io.emit('chatMessage', data);
  });

  // Handle player position update
  socket.on('playerUpdate', (data) => {
    const player = players[socket.id];
    if (!player) return;
    
    // Update player data
    Object.assign(player, data);
    
    // Broadcast to other players
    socket.broadcast.emit('playerUpdate', player);
  });

  // Handle player attacking a mob
  socket.on('attackMob', (data) => {
    const player = players[socket.id];
    if (!player) return;
    
    const { mobId, damage, itemId } = data;
    
    // Check attack cooldown through Combat Manager
    const cooldown = global.combatManager.getAttackCooldown(socket.id);
    if (cooldown && cooldown.progress < 1) {
      // Attack still on cooldown, apply damage multiplier
      const damageMultiplier = global.combatManager.getDamageMultiplier(socket.id);
      data.damage = (damage || 1) * damageMultiplier;
    }
    
    // Process the attack
    const result = mobManager.handlePlayerAttack(socket.id, mobId, data.damage || 1);
    
    // Start a new attack cooldown if attack was successful
    if (result.success) {
      global.combatManager.startAttackCooldown(socket.id, itemId || 'hand');
    }
    
    // Send cooldown info with the result
    const newCooldown = global.combatManager.getAttackCooldown(socket.id);
    result.cooldown = newCooldown;
    
    socket.emit('attackResult', result);
  });

  // Handle player interaction with a mob
  socket.on('interactMob', (data) => {
    const player = players[socket.id];
    if (!player) return;
    
    const { mobId, action, actionData } = data;
    const result = mobManager.handlePlayerInteraction(socket.id, mobId, { 
      action, 
      ...actionData 
    });
    
    socket.emit('interactResult', result);
    
    // If interaction changed the mob, broadcast update
    if (result.success) {
      io.emit('mobUpdate', { [mobId]: mobManager.mobs[mobId].serialize() });
    }
  });

  // Handle player hit
  socket.on('playerHit', (data) => {
    const attacker = players[data.attackerId];
    const target = players[data.targetId];
    
    if (!attacker || !target) return;
    
    // Create attack data object
    const attackData = {
      itemId: data.weaponId || 'hand',
      baseDamage: data.damage || 1,
      knockback: data.knockback || 0.5,
      effects: data.effects || []
    };
    
    // Process attack through combat manager (handles cooldowns, shields, etc.)
    const processedAttack = global.combatManager.processAttack(
      data.attackerId, 
      data.targetId, 
      attackData
    );
    
    // Check if target is blocking with shield
    let wasBlocked = false;
    let blockMessage = '';
    
    // Apply damage based on processed attack
    target.health -= processedAttack.damage;
    
    // If damage was reduced due to shield blocking
    if (processedAttack.damage < attackData.baseDamage) {
      wasBlocked = true;
      blockMessage = 'Attack partially blocked by shield!';
    }
    
    // Check for death
    if (target.health <= 0) {
      target.health = 0;
      
      // Store the death location for recovery compass
      target.lastDeathLocation = { 
        x: target.position.x, 
        y: target.position.y, 
        z: target.position.z,
        dimension: target.dimension || 'overworld' // Track dimension for cross-dimension support
      };

      io.emit('playerDeath', { playerId: target.id });
    }

    // Update target's health
    io.emit('playerUpdate', target);
    
    // Send attack result to attacker
    io.to(data.attackerId).emit('attackResult', {
      success: true,
      damage: processedAttack.damage,
      wasBlocked,
      message: blockMessage,
      cooldown: global.combatManager.getAttackCooldown(data.attackerId)
    });
    
    // Send hit info to target
    io.to(data.targetId).emit('playerDamaged', {
      damage: processedAttack.damage,
      attacker: data.attackerId,
      wasBlocked,
      knockback: processedAttack.knockback
    });
  });

  // Handle player respawn
  socket.on('playerRespawn', () => {
    const player = players[socket.id];
    if (!player) return;

    player.health = 100;
    player.position = { x: 0, y: 1, z: 0 };
    player.rotation = { y: 0 };
    
    // Don't clear lastDeathLocation on respawn - needed for recovery compass
    
    io.emit('playerUpdate', player);
  });

  // Handle brewing stand interactions
  socket.on('brewingStand:getState', (data) => {
    const { position } = data;
    const posKey = `${position.x},${position.y},${position.z}`;
    
    // Check if a brewing stand exists at this position
    if (!blocks[posKey] || blocks[posKey].type !== 'brewing_stand') {
      return socket.emit('error', { message: 'No brewing stand found at this position' });
    }
    
    // Get or create the brewing handler for this brewing stand
    let brewingHandler = brewingHandlers[posKey];
    if (!brewingHandler) {
      const world = { server: { itemRegistry } };
      brewingHandler = new BrewingHandler(world, position, itemRegistry.getPotionRegistry());
      brewingHandlers[posKey] = brewingHandler;
    }
    
    // Send the current state
    socket.emit('brewingStand:state', brewingHandler.getState());
  });
  
  socket.on('brewingStand:moveItem', (data) => {
    const { position, fromType, fromIndex, toType, toIndex, count } = data;
    const posKey = `${position.x},${position.y},${position.z}`;
    
    // Check if a brewing stand exists at this position
    if (!blocks[posKey] || blocks[posKey].type !== 'brewing_stand') {
      return socket.emit('error', { message: 'No brewing stand found at this position' });
    }
    
    // Get the brewing handler
    const brewingHandler = brewingHandlers[posKey];
    if (!brewingHandler) {
      return socket.emit('error', { message: 'Brewing stand not initialized' });
    }
    
    // Get the player
    const player = players[socket.id];
    if (!player) {
      return socket.emit('error', { message: 'Player not found' });
    }
    
    // Process the move action
    const action = {
      type: 'moveItem',
      fromType,
      fromIndex,
      toType,
      toIndex,
      count
    };
    
    brewingHandler.handleInteraction(player, 'move', action);
    
    // Send updated state back to client
    socket.emit('brewingStand:state', brewingHandler.getState());
  });
  
  socket.on('brewingStand:close', (data) => {
    const { position } = data;
    const posKey = `${position.x},${position.y},${position.z}`;
    
    // Get the brewing handler
    const brewingHandler = brewingHandlers[posKey];
    if (brewingHandler) {
      // Handle any cleanup needed when closing the UI
      // This could include dropping items if the player was disconnected, etc.
    }
  });

  // Handle player disconnection
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    // Handle any brewing stands the player had open
    for (const posKey in brewingHandlers) {
      const brewingHandler = brewingHandlers[posKey];
      // Check if the brewing stand needs cleanup for this player
      // This could involve returning items to the world if the player had some, etc.
    }
    
    delete players[socket.id];
    io.emit('playerLeave', socket.id);
    
    // Clear any status effects on the player
    if (global.statusEffectsManager && player) {
      global.statusEffectsManager.clearEffects(player.id);
    }
  });

  // Enchantment table events
  socket.on('openEnchantmentTable', data => {
    // Register player as using the enchantment table
    const tableId = `${data.position.x},${data.position.y},${data.position.z}`;
    
    // Register table if it doesn't exist
    if (!enchantmentTable.activeTables.has(tableId)) {
      enchantmentTable.registerTable(tableId, data.position);
    }
    
    // Register player as using the table
    enchantmentTable.playerOpenTable(tableId, socket.id);
    
    // Send a response with the table state
    socket.emit('enchantmentTableOpened', { tableId });
  });
  
  socket.on('closeEnchantmentTable', data => {
    // Unregister player from the enchantment table
    if (data.tableId) {
      enchantmentTable.playerCloseTable(data.tableId, socket.id);
    }
  });
  
  socket.on('getEnchantmentOptions', data => {
    const { tableId, item, playerLevel } = data;
    
    // Get enchantment options for the item
    const options = enchantmentTable.getEnchantmentOptions(tableId, item, playerLevel);
    
    // Send options back to the client
    socket.emit('enchantmentOptions', { tableId, options });
  });
  
  socket.on('enchantItem', data => {
    const { tableId, item, optionIndex, playerLevel } = data;
    
    // Perform the enchantment
    const result = enchantmentTable.enchantItem(tableId, item, optionIndex, playerLevel);
    
    // Send result back to the client
    socket.emit('itemEnchanted', result);
  });
  
  socket.on('combineItems', data => {
    const { item1, item2, playerLevel } = data;
    
    // Combine the items using anvil mechanics
    const result = enchantmentTable.combineItems(item1, item2, playerLevel);
    
    // Send result back to the client
    socket.emit('itemsCombined', result);
  });
  
  // Handle when player attacks with enchanted weapon
  socket.on('playerAttack', data => {
    const { targetId, itemInHand } = data;
    
    // Get the target entity
    const target = players[targetId] || mobManager.mobs[targetId];
    
    if (!target) {
      socket.emit('attackResult', { success: false, error: 'Target not found' });
      return;
    }
    
    // Start with base attack data
    let attackData = {
      damage: 1, // Base damage
      knockback: 0,
      effects: []
    };
    
    // Set target type for special enchantments
    if (target.type) {
      // Check if the mob type is undead or arthropod
      if (['zombie', 'skeleton'].includes(target.type)) {
        attackData.targetType = 'undead';
      } else if (['spider'].includes(target.type)) {
        attackData.targetType = 'arthropod';
      }
    }
    
    // Apply enchantment effects if the item is enchanted
    if (itemInHand && itemInHand.enchantments && itemInHand.enchantments.length > 0) {
      attackData = enchantmentManager.applyEnchantmentEffects(itemInHand, 'attack', attackData);
    }
    
    // Apply the attack to the target
    if (target.health) {
      target.health = Math.max(0, target.health - attackData.damage);
      
      // Apply effects like fire
      if (attackData.effects && attackData.effects.length > 0) {
        target.effects = target.effects || [];
        
        // Add each new effect
        for (const effect of attackData.effects) {
          target.effects.push(effect);
        }
      }
      
      // Apply knockback
      if (attackData.knockback > 0) {
        // Calculate knockback direction away from player
        const player = players[socket.id];
        if (player && player.position) {
          const dx = target.position.x - player.position.x;
          const dz = target.position.z - player.position.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          
          if (distance > 0) {
            // Normalize and apply knockback
            const kbPower = attackData.knockback * 0.2;
            target.velocity = target.velocity || { x: 0, y: 0, z: 0 };
            target.velocity.x = (dx / distance) * kbPower;
            target.velocity.z = (dz / distance) * kbPower;
            target.velocity.y = Math.min(0.4, kbPower * 0.5);
          }
        }
      }
      
      // Check for death
      if (target.health <= 0) {
        // Process mob loot if it's a mob
        if (mobManager.mobs[targetId]) {
          const lootMultiplier = attackData.lootBonus ? (1 + attackData.lootBonus / 100) : 1;
          const extraDrops = attackData.extraDrops || 0;
          
          // Get drops with adjusted loot table
          const drops = mobManager.getMobDrops(targetId, lootMultiplier, extraDrops);
          
          // Send drops to the player
          socket.emit('mobDrops', { mobId: targetId, drops });
          
          // Remove the mob
          delete mobManager.mobs[targetId];
          io.emit('mobRemoved', { mobId: targetId });
        }
      } else {
        // Update entity state
        if (players[targetId]) {
          io.to(targetId).emit('playerDamaged', { 
            damage: attackData.damage,
            attacker: socket.id,
            effects: attackData.effects
          });
        } else {
          // Update mob state
          io.emit('mobUpdated', { 
            mobId: targetId, 
            health: target.health,
            effects: target.effects,
            velocity: target.velocity
          });
        }
      }
      
      socket.emit('attackResult', { 
        success: true, 
        damage: attackData.damage,
        effects: attackData.effects
      });
    } else {
      socket.emit('attackResult', { success: false, error: 'Target cannot be damaged' });
    }
  });
  
  // Handle when player mines a block with enchanted tool
  socket.on('blockMine', data => {
    const { position, itemInHand } = data;
    
    // Start with base mining data
    let miningData = {
      miningSpeed: 1,
      fortuneLevel: 0,
      silkTouch: false
    };
    
    // Apply enchantment effects if the item is enchanted
    if (itemInHand && itemInHand.enchantments && itemInHand.enchantments.length > 0) {
      miningData = enchantmentManager.applyEnchantmentEffects(itemInHand, 'mining', miningData);
    }
    
    // Get the block at the position
    const blockKey = `${position.x},${position.y},${position.z}`;
    const block = blocks[blockKey];
    
    if (!block) {
      socket.emit('blockMineResult', { success: false, error: 'Block not found' });
      return;
    }
    
    // Get the drops for the block, considering Fortune and Silk Touch
    let drops = [];
    
    if (miningData.silkTouch) {
      // With Silk Touch, drop the block itself
      drops.push({
        type: block.type,
        count: 1
      });
    } else if (miningData.fortuneLevel > 0) {
      // With Fortune, potentially get more drops
      drops = getBlockDropsWithFortune(block.type, miningData.fortuneLevel);
    } else {
      // Normal drops
      drops = getBlockDrops(block.type);
    }
    
    // Remove the block
    delete blocks[blockKey];
    
    // Broadcast the block break
    io.emit('blockBreak', { position });
    
    // Send drops to the player
    socket.emit('blockDrops', { position, drops });
    
    // Apply durability changes to the item
    if (itemInHand && itemInHand.durability) {
      const durabilityData = {
        reduceDurability: true
      };
      
      // Apply unbreaking enchantment effects
      const durabilityResult = enchantmentManager.applyEnchantmentEffects(
        itemInHand, 
        'durability', 
        durabilityData
      );
      
      if (durabilityResult.reduceDurability !== false) {
        // Reduce durability by 1
        itemInHand.durability -= 1;
        
        // Check if the item broke
        if (itemInHand.durability <= 0) {
          // Item broke
          socket.emit('itemBroke', { slot: data.slot });
        } else {
          // Update item durability
          socket.emit('itemDurabilityChanged', { 
            slot: data.slot, 
            durability: itemInHand.durability 
          });
        }
      }
    }
    
    socket.emit('blockMineResult', { 
      success: true, 
      position,
      drops,
      miningSpeed: miningData.miningSpeed
    });
  });
  
  // Handle when player collects XP with enchanted items
  socket.on('collectXP', data => {
    const { amount } = data;
    const player = players[socket.id];
    
    if (!player) {
      socket.emit('xpCollectResult', { success: false, error: 'Player not found' });
      return;
    }
    
    // Start with base XP data
    let xpData = {
      xpAmount: amount
    };
    
    // Get player's equipment for Mending
    const equipment = player.equipment || {};
    
    // Check all equipped items for Mending enchantment
    for (const slot in equipment) {
      const item = equipment[slot];
      
      if (item && item.enchantments && item.durability < item.maxDurability) {
        // Apply Mending enchantment effect
        const result = enchantmentManager.applyEnchantmentEffects(item, 'experience', xpData);
        
        // If the item was repaired, update it
        if (result.repairAmount > 0) {
          item.durability += result.repairAmount;
          
          // Update the result XP amount
          xpData = result;
          
          // Notify the player of the repair
          socket.emit('itemRepaired', { 
            slot, 
            durability: item.durability,
            repairAmount: result.repairAmount 
          });
        }
      }
    }
    
    // Update player XP
    player.xp = (player.xp || 0) + xpData.xpAmount;
    
    // Check for level up
    const xpForNextLevel = calculateXPForLevel(player.level + 1);
    if (player.xp >= xpForNextLevel) {
      player.level = (player.level || 0) + 1;
      player.xp -= xpForNextLevel;
      
      // Notify the player of level up
      socket.emit('playerLevelUp', { level: player.level });
    }
    
    // Update XP
    socket.emit('xpUpdate', { xp: player.xp, level: player.level });
    
    socket.emit('xpCollectResult', { 
      success: true, 
      collected: amount,
      remaining: xpData.xpAmount
    });
  });

  // Handle player activating a portal with flint and steel
  socket.on('activatePortal', (data) => {
    const player = players[socket.id];
    if (!player) return;
    
    const { position, heldItemId } = data;
    
    // Validate the player is holding flint and steel
    if (heldItemId !== 'flint_and_steel') {
      return socket.emit('error', { message: 'You need flint and steel to activate a portal' });
    }
    
    // Check if there's a valid portal frame
    if (global.portalManager) {
      const result = global.portalManager.tryActivatePortal({
        getBlockType: (posKey) => blocks[posKey] ? blocks[posKey].type : null,
        setBlock: (posKey, blockData) => {
          blocks[posKey] = blockData;
          io.emit('blockUpdate', { position: posKey, type: blockData.type });
        },
        playSound: (soundData) => {
          io.emit('playSound', soundData);
        },
        dimensionId: 'overworld'
      }, position);
      
      if (result.success) {
        // Reduce durability of flint and steel
        if (player.inventory[heldItemId]) {
          player.inventory[heldItemId] = Math.max(0, player.inventory[heldItemId] - 1);
          socket.emit('playerUpdate', player);
        }
        
        // Notify player of successful portal activation
        socket.emit('portalActivated', {
          position: result.portalPosition,
          orientation: result.orientation
        });
      }
    }
  });

  // Handle player interacting with a portal
  socket.on('enterPortal', (data) => {
    const player = players[socket.id];
    if (!player) return;
    
    const { position, portalType } = data;
    
    // Notify the dimension manager that an entity entered a portal
    if (global.dimensionManager) {
      global.dimensionManager.handleEntityEnterPortal({
        entity: player,
        portalPosition: position,
        dimension: 'overworld', // Default dimension
        portalType
      });
    }
  });
  
  // Handle player placing fire near obsidian (potential portal creation)
  socket.on('placeFire', (data) => {
    const { position } = data;
    
    // Check if this fire placement might create a portal
    if (global.portalManager) {
      global.portalManager.onFireCreated({
        position,
        worldGetter: (posKey) => blocks[posKey] ? blocks[posKey].type : null
      });
    }
  });

  // Add handler for dimension change requests
  socket.on('changeDimension', (data) => {
    const player = players[socket.id];
    if (!player) return;
    
    const { targetDimension } = data;
    
    // Only allow valid dimensions
    if (!global.dimensionManager.dimensions.has(targetDimension)) {
      return socket.emit('error', { message: `Invalid dimension: ${targetDimension}` });
    }
    
    const currentDimension = player.dimension || 'overworld';
    
    // Update player's dimension
    player.dimension = targetDimension;
    
    // Generate terrain around player in the new dimension
    if (targetDimension === 'nether') {
      // Scale coordinates by 1/8 when going from overworld to nether
      if (currentDimension === 'overworld') {
        player.position.x = Math.floor(player.position.x / 8);
        player.position.z = Math.floor(player.position.z / 8);
      }
      
      // Generate nether terrain around the player
      netherDimension.generateAroundPlayer(player);
      
      // Send nether blocks to the player
      const nearbyBlocks = {};
      const radius = 32;
      const px = Math.floor(player.position.x);
      const py = Math.floor(player.position.y);
      const pz = Math.floor(player.position.z);
      
      for (let x = px - radius; x <= px + radius; x++) {
        for (let y = Math.max(0, py - radius); y <= Math.min(netherDimension.ceilingHeight, py + radius); y++) {
          for (let z = pz - radius; z <= pz + radius; z++) {
            const posKey = `${x},${y},${z}`;
            const block = netherDimension.blocks.get(posKey);
            if (block) {
              nearbyBlocks[posKey] = block;
            }
          }
        }
      }
      
      // Send the blocks and confirm dimension change
      socket.emit('dimensionChanged', {
        dimension: targetDimension,
        position: player.position,
        blocks: nearbyBlocks
      });
    } else if (targetDimension === 'overworld') {
      // Scale coordinates by 8 when going from nether to overworld
      if (currentDimension === 'nether') {
        player.position.x = Math.floor(player.position.x * 8);
        player.position.z = Math.floor(player.position.z * 8);
      }
      
      // Confirm dimension change and let client request blocks as needed
      socket.emit('dimensionChanged', {
        dimension: targetDimension,
        position: player.position,
        blocks // Send main world blocks
      });
    }
    
    // Broadcast to other players
    socket.broadcast.emit('playerUpdate', player);
  });
  
  // Add handler for nether block requests (when client needs more nether blocks)
  socket.on('requestNetherBlocks', (data) => {
    const { position, radius } = data;
    
    // Get blocks from the nether dimension
    const nearbyBlocks = {};
    const px = Math.floor(position.x);
    const py = Math.floor(position.y);
    const pz = Math.floor(position.z);
    
    for (let x = px - radius; x <= px + radius; x++) {
      for (let y = Math.max(0, py - radius); y <= Math.min(netherDimension.ceilingHeight, py + radius); y++) {
        for (let z = pz - radius; z <= pz + radius; z++) {
          const posKey = `${x},${y},${z}`;
          const block = netherDimension.blocks.get(posKey);
          if (block) {
            nearbyBlocks[posKey] = block;
          }
        }
      }
    }
    
    // Send the requested blocks
    socket.emit('netherBlocks', {
      position,
      blocks: nearbyBlocks
    });
  });

  // Handle villager trade interaction
  socket.on('villagerTrade', (data) => {
    const { mobId, action, tradeId } = data;
    const player = players[socket.id];
    
    if (!player) return;
    
    // Get the villager
    const villager = mobManager.mobs[mobId];
    if (!villager) {
      return socket.emit('tradeResult', { success: false, error: 'Villager not found' });
    }
    
    // Process the trade
    if (action === 'get_trades') {
      // Return available trades
      const tradeData = mobManager.handleVillagerTrade(socket.id, mobId, { action });
      
      // Add village reputation if available
      if (villager.villageId && global.villageReputationManager) {
        tradeData.reputation = global.villageReputationManager.getReputation(
          villager.villageId, 
          socket.id
        );
        
        tradeData.discount = global.villageReputationManager.getPriceDiscount(
          villager.villageId, 
          socket.id
        );
      }
      
      socket.emit('tradeResult', tradeData);
    } else if (action === 'execute_trade') {
      // Execute the trade with reputation manager if available
      let result;
      if (villager.villageId && global.villageReputationManager) {
        result = villager.executeTrade(player, tradeId, global.villageReputationManager);
      } else {
        result = villager.executeTrade(player, tradeId);
      }
      
      // Return result to client
      socket.emit('tradeResult', result);
      
      // If inventory updated, broadcast to other players
      if (result.success) {
        socket.broadcast.emit('playerUpdate', {
          id: socket.id,
          inventory: player.inventory
        });
      }
    } else {
      socket.emit('tradeResult', { success: false, error: 'Unknown action' });
    }
  });

  // Add handler for zombie villager curing
  socket.on('cureZombieVillager', (data) => {
    const { mobId } = data;
    const player = players[socket.id];
    
    if (!player) return;
    
    // Check if player has necessary items (golden apple & weakness potion)
    if (!player.inventory.golden_apple || player.inventory.golden_apple < 1) {
      return socket.emit('cureResult', { 
        success: false, 
        error: 'Missing golden apple' 
      });
    }
    
    if (!player.inventory.potion_weakness || player.inventory.potion_weakness < 1) {
      return socket.emit('cureResult', { 
        success: false, 
        error: 'Missing weakness potion' 
      });
    }
    
    // Get the zombie villager
    const zombieVillager = mobManager.mobs[mobId];
    if (!zombieVillager || zombieVillager.type !== 'zombie_villager') {
      return socket.emit('cureResult', { 
        success: false, 
        error: 'Not a zombie villager' 
      });
    }
    
    // Consume items
    player.inventory.golden_apple--;
    player.inventory.potion_weakness--;
    
    // Start cure process (zombieVillager.startCuring would be implemented in the zombie villager class)
    if (typeof zombieVillager.startCuring === 'function') {
      zombieVillager.startCuring(player.id);
      
      socket.emit('cureResult', { 
        success: true, 
        message: 'Started curing process' 
      });
      
      // Update player inventory
      io.emit('playerUpdate', player);
    } else {
      socket.emit('cureResult', { 
        success: false, 
        error: 'Cannot cure this zombie villager' 
      });
    }
  });

  // Add handler for reputation events
  socket.on('villageReputationEvent', (data) => {
    const { villageId, eventType } = data;
    const playerId = socket.id;
    
    if (!global.villageReputationManager) {
      return socket.emit('error', { message: 'Reputation system not available' });
    }
    
    // Update reputation (only certain events are allowed from client)
    const allowedClientEvents = ['ZOMBIE_ATTACK_DEFENDED'];
    if (!allowedClientEvents.includes(eventType)) {
      return socket.emit('error', { message: 'Invalid reputation event' });
    }
    
    // Update reputation
    const newReputation = global.villageReputationManager.updateReputation(
      villageId, 
      playerId, 
      eventType
    );
    
    // Return updated reputation
    socket.emit('reputationUpdate', {
      villageId,
      reputation: newReputation
    });
  });

  // Handle player shield actions
  socket.on('shieldAction', (data) => {
    const player = players[socket.id];
    if (!player) return;

    const { action, shieldItem } = data;
    
    if (action === 'block') {
      // Start blocking with shield
      const activated = global.combatManager.activateShield(socket.id, shieldItem);
      
      socket.emit('shieldActionResult', {
        success: activated,
        action: 'block',
        message: activated ? 'Shield raised' : 'Shield could not be activated'
      });
      
      // Broadcast shield state to other players
      socket.broadcast.emit('playerUpdate', {
        id: socket.id,
        isBlocking: activated
      });
    } 
    else if (action === 'lower') {
      // Stop blocking
      global.combatManager.deactivateShield(socket.id);
      
      socket.emit('shieldActionResult', {
        success: true,
        action: 'lower',
        message: 'Shield lowered'
      });
      
      // Broadcast shield state to other players
      socket.broadcast.emit('playerUpdate', {
        id: socket.id,
        isBlocking: false
      });
    }
  });
  
  // Handle offhand item management
  socket.on('setOffhandItem', (data) => {
    const player = players[socket.id];
    if (!player) return;
    
    const { item } = data;
    
    // Set item in offhand
    global.combatManager.setOffhandItem(socket.id, item);
    
    // Update player inventory
    player.offhandItem = item;
    
    socket.emit('offhandItemSet', {
      success: true,
      item
    });
    
    // Broadcast offhand update to other players
    socket.broadcast.emit('playerUpdate', {
      id: socket.id,
      offhandItem: item
    });
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Backup system initialized');
});

// Function to calculate XP required for a level
function calculateXPForLevel(level) {
  if (level <= 15) {
    return 2 * level + 7;
  } else if (level <= 30) {
    return 5 * level - 38;
  } else {
    return 9 * level - 158;
  }
}

// Function to get block drops with Fortune enchantment
function getBlockDropsWithFortune(blockType, fortuneLevel) {
  // Default drop
  const normalDrops = getBlockDrops(blockType);
  
  // Fortune only affects certain blocks
  const fortuneBlocks = [
    'coal_ore', 'diamond_ore', 'emerald_ore', 'lapis_ore', 'nether_quartz_ore',
    'redstone_ore', 'carrot', 'potato', 'wheat', 'beetroot', 'melon'
  ];
  
  // If the block is not affected by Fortune, return normal drops
  if (!fortuneBlocks.includes(blockType)) {
    return normalDrops;
  }
  
  // Clone the drops
  const drops = [...normalDrops];
  
  // Apply Fortune effect
  for (const drop of drops) {
    // Ores have a chance for extra drops
    if (blockType.endsWith('_ore')) {
      // Each Fortune level adds a 1/3 chance per level of doubling drops
      const extraDropChance = fortuneLevel / 3;
      let extraDrops = 0;
      
      // Roll once per Fortune level
      for (let i = 0; i < fortuneLevel; i++) {
        if (Math.random() < extraDropChance) {
          extraDrops++;
        }
      }
      
      // Add extra drops
      drop.count += extraDrops;
    } 
    // Crops have different Fortune mechanics
    else if (['carrot', 'potato', 'wheat', 'beetroot'].includes(blockType)) {
      // Fortune adds a +1 to max additional drops
      const maxAdditionalDrops = Math.min(10, 3 + fortuneLevel);
      const minAdditionalDrops = 1;
      
      // Random additional drops
      const additionalDrops = Math.floor(
        Math.random() * (maxAdditionalDrops - minAdditionalDrops + 1) + minAdditionalDrops
      );
      
      drop.count += additionalDrops;
    }
    // Melons have special Fortune treatment
    else if (blockType === 'melon') {
      // Fortune adds 1 per level to max drops (base: 3-7)
      const maxDrops = 7 + fortuneLevel;
      const minDrops = 3;
      
      // Random drops between min and max
      drop.count = Math.floor(
        Math.random() * (maxDrops - minDrops + 1) + minDrops
      );
    }
  }
  
  return drops;
}

// Function to get normal block drops
function getBlockDrops(blockType) {
  // Default drop is the block itself
  const defaultDrop = {
    type: blockType,
    count: 1
  };
  
  // Define special drops for certain blocks
  const specialDrops = {
    'coal_ore': { type: 'coal', count: 1 },
    'diamond_ore': { type: 'diamond', count: 1 },
    'emerald_ore': { type: 'emerald', count: 1 },
    'lapis_ore': { type: 'lapis_lazuli', count: 4 + Math.floor(Math.random() * 5) }, // 4-8
    'redstone_ore': { type: 'redstone', count: 4 + Math.floor(Math.random() * 2) }, // 4-5
    'nether_quartz_ore': { type: 'quartz', count: 1 },
    'stone': { type: 'cobblestone', count: 1 }
  };
  
  return [specialDrops[blockType] || defaultDrop];
}

// Add to the cleanup function
function cleanup() {
  // Clean up brewing system
  if (global.brewingSystem) {
    global.brewingSystem.cleanup();
  }
  
  // Clean up dimension manager
  if (global.dimensionManager) {
    global.dimensionManager.cleanup();
  }
}

// Add to the server shutdown handler
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  
  // Save brewing system data
  if (global.brewingSystem) {
    global.brewingSystem.cleanup();
  }
  
  // Clean up dimension manager
  if (global.dimensionManager) {
    global.dimensionManager.cleanup();
  }
  
  // ... rest of existing shutdown code ...
  
  process.exit(0);
});

// Add potion item handling to the use item function
function handleItemUse(player, itemId, useContext) {
  // Check if it's a potion item
  if (itemId.startsWith('potion_')) {
    const item = player.inventory.getItem(itemId);
    if (item && item.use) {
      // Use the potion's built-in use method
      return item.use(player, useContext);
    }
  }
  
  // ... rest of existing item use code ...
}

// Add to entity damage handler to account for resistance and other effects
function damageEntity(entity, amount, damageSource) {
  // Check for protective effects
  let finalAmount = amount;
  if (global.statusEffectsManager) {
    // Protection effect reduces damage
    const protectionLevel = global.statusEffectsManager.getEffectLevel(entity.id, 'PROTECTION');
    if (protectionLevel > 0) {
      finalAmount = Math.max(0, finalAmount - (finalAmount * (protectionLevel * 0.2)));
    }
    
    // Fire resistance makes fire damage ineffective
    if (damageSource === 'fire' && global.statusEffectsManager.hasEffect(entity.id, 'FIRE_RESISTANCE')) {
      finalAmount = 0;
    }
  }
  
  // ... continue with damage application using finalAmount instead of amount ...
}

// Check if any lightning rods attract a lightning strike
function checkLightningRodAttractions(strike) {
  const maxDistance = 128; // Maximum attraction distance
  
  // Check all blocks to find lightning rods
  // In a real implementation, we would use a spatial partitioning system
  // to only check nearby blocks, not the entire world
  for (const posKey in blocks) {
    const block = blocks[posKey];
    
    // Skip if not a lightning rod
    if (!block || block.type !== 'lightning_rod') continue;
    
    // Parse position from posKey
    const [x, y, z] = posKey.split(',').map(Number);
    
    // Calculate distance to strike
    const dx = strike.x - x;
    const dy = strike.y - y;
    const dz = strike.z - z;
    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    // Skip if too far
    if (distance > maxDistance) continue;
    
    // Lightning rod attracts the strike
    console.log(`Lightning rod at ${posKey} attracted lightning strike`);
    
    // Create a new strike at the lightning rod position
    const rodStrike = {
      x,
      y: y + 1,
      z,
      time: Date.now(),
      power: 15,
      isAttracted: true
    };
    
    // Emit event for this attracted strike
    io.emit('lightningStrike', rodStrike);
    
    // Activate lightning rod (in a real implementation, we would modify the block state)
    if (block.onLightningStrike) {
      block.onLightningStrike(rodStrike);
    }
    
    // A single lightning strike might be attracted by multiple rods,
    // but we'll just use the first one we find for simplicity
    return true;
  }
  
  return false;
}
