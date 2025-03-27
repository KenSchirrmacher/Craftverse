const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const saveSystem = require('./saveSystem');

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
const blocks = {};
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
  diamond_ore: { name: 'Diamond Ore', hardness: 4 }
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

// Generate initial world
function generateWorld() {
  // Create a flat grass world
  for (let x = -10; x <= 10; x++) {
    for (let z = -10; z <= 10; z++) {
      blocks[`${x},0,${z}`] = { type: 'grass' };
    }
  }

  // Add some random trees
  for (let i = 0; i < 20; i++) {
    const x = Math.floor(Math.random() * 21) - 10;
    const z = Math.floor(Math.random() * 21) - 10;
    blocks[`${x},1,${z}`] = { type: 'tree' };
    blocks[`${x},2,${z}`] = { type: 'tree' };
    blocks[`${x},3,${z}`] = { type: 'tree' };
  }

  // Add some random water and lava pools
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(Math.random() * 21) - 10;
    const z = Math.floor(Math.random() * 21) - 10;
    const type = Math.random() > 0.5 ? 'water' : 'lava';
    blocks[`${x},0,${z}`] = { type };
  }

  // Add some random sand patches
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(Math.random() * 21) - 10;
    const z = Math.floor(Math.random() * 21) - 10;
    blocks[`${x},0,${z}`] = { type: 'sand' };
  }

  // Add some random ore deposits
  for (let i = 0; i < 15; i++) {
    const x = Math.floor(Math.random() * 21) - 10;
    const z = Math.floor(Math.random() * 21) - 10;
    const y = Math.floor(Math.random() * 5) + 1;
    const type = Math.random() > 0.5 ? 'iron_ore' : 'diamond_ore';
    blocks[`${x},${y},${z}`] = { type };
  }
}

// Initialize world
generateWorld();

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Create new player with inventory
  const player = {
    id: socket.id,
    position: { x: 0, y: 1, z: 0 },
    rotation: { y: 0 },
    health: 100,
    movementMode: 'walk',
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
  socket.emit('gameState', { players, blocks });

  // Broadcast new player to others
  socket.broadcast.emit('playerJoin', player);

  // Handle save game request
  socket.on('saveGame', (worldName) => {
    if (saveSystem.saveGame(worldName, players, blocks)) {
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
      currentWorld = worldName;
      io.emit('gameState', { players, blocks });
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

  // Handle player hit
  socket.on('playerHit', (data) => {
    const attacker = players[data.attackerId];
    const target = players[data.targetId];
    
    if (!attacker || !target) return;

    // Apply damage
    target.health -= data.damage;
    
    // Check for death
    if (target.health <= 0) {
        target.health = 0;
        io.emit('playerDeath', { playerId: target.id });
    }

    // Update target's health
    io.emit('playerUpdate', target);
  });

  // Handle player respawn
  socket.on('playerRespawn', () => {
    const player = players[socket.id];
    if (!player) return;

    player.health = 100;
    player.position = { x: 0, y: 1, z: 0 };
    player.rotation = { y: 0 };
    
    io.emit('playerUpdate', player);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete players[socket.id];
    io.emit('playerLeave', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
