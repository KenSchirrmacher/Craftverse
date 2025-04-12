/**
 * DragonFight - Manages the Ender Dragon boss fight mechanics
 */

const EventEmitter = require('events');
const EnderDragon = require('../entities/enderDragon');
const EndCrystal = require('../entities/endCrystal');

class DragonFight extends EventEmitter {
  /**
   * Creates a new Dragon Fight manager
   * @param {Object} options - Fight options
   * @param {Object} options.world - End dimension world
   * @param {Object} options.server - Server instance
   * @param {Boolean} options.autoStart - Whether to auto-start the fight
   */
  constructor(options = {}) {
    super();
    this.world = options.world;
    this.server = options.server;
    this.autoStart = options.autoStart !== undefined ? options.autoStart : true;
    
    // Dragon fight state
    this.active = false;
    this.phase = 'waiting'; // waiting, preparing, active, victory, reset
    this.phaseStartTime = 0;
    this.respawnTime = 0;
    
    // Entities
    this.dragon = null;
    this.crystals = [];
    this.exitPortalLocation = { x: 0, y: 64, z: 0 };
    
    // Fight progress
    this.crystalsDestroyed = 0;
    this.previouslyKilled = false;
    this.gatewaysSpawned = 0;
    this.dragonKillTime = 0;
    
    // Players tracking
    this.playersInFight = new Set();
    
    // Initialize fight if auto-start is enabled
    if (this.autoStart) {
      this.initialize();
    }
  }
  
  /**
   * Initialize the dragon fight
   */
  initialize() {
    // Check if the fight has been completed before
    this.checkPreviouslyKilled();
    
    // If the dragon was killed before, don't start automatically
    if (this.previouslyKilled) {
      this.phase = 'waiting';
      this.active = false;
      
      // Create exit portal if it doesn't exist
      this.createExitPortal();
    } else {
      // First time, start the fight preparation
      this.startFight();
    }
  }
  
  /**
   * Update the dragon fight state
   * @param {Number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // Update phase time
    this.phaseTime = Date.now() - this.phaseStartTime;
    
    // Handle each phase
    switch (this.phase) {
      case 'waiting':
        this.handleWaitingPhase(deltaTime);
        break;
      case 'preparing':
        this.handlePreparingPhase(deltaTime);
        break;
      case 'active':
        this.handleActivePhase(deltaTime);
        break;
      case 'victory':
        this.handleVictoryPhase(deltaTime);
        break;
      case 'reset':
        this.handleResetPhase(deltaTime);
        break;
    }
    
    // Update respawn timer if the dragon is killed
    if (this.respawnTime > 0) {
      this.respawnTime -= deltaTime;
      
      // If respawn time is up, respawn the dragon
      if (this.respawnTime <= 0) {
        this.respawnDragon();
      }
    }
    
    // Update player tracking
    this.updatePlayersInFight();
  }
  
  /**
   * Handle the waiting phase
   * @param {Number} deltaTime - Time since last update
   */
  handleWaitingPhase(deltaTime) {
    // In waiting phase, check if any player places end crystals to respawn dragon
    if (this.previouslyKilled) {
      this.checkRespawnCrystals();
    } else if (this.playersInFight.size > 0) {
      // If it's the first time and there are players, start fight
      this.startFight();
    }
  }
  
  /**
   * Handle the preparing phase
   * @param {Number} deltaTime - Time since last update
   */
  handlePreparingPhase(deltaTime) {
    // Check if preparation time is complete (20 seconds)
    if (this.phaseTime > 20000) {
      // Transition to active phase
      this.transitionToPhase('active');
      
      // Spawn the dragon
      this.spawnDragon();
    }
  }
  
  /**
   * Handle the active phase
   * @param {Number} deltaTime - Time since last update
   */
  handleActivePhase(deltaTime) {
    // Check if dragon is still alive
    if (!this.dragon || this.dragon.health <= 0) {
      // Transition to victory phase
      this.transitionToPhase('victory');
      
      // Set dragon kill time
      this.dragonKillTime = Date.now();
      this.previouslyKilled = true;
    }
  }
  
  /**
   * Handle the victory phase
   * @param {Number} deltaTime - Time since last update
   */
  handleVictoryPhase(deltaTime) {
    // After 10 seconds of victory, transition to reset phase
    if (this.phaseTime > 10000) {
      this.transitionToPhase('reset');
    }
  }
  
  /**
   * Handle the reset phase
   * @param {Number} deltaTime - Time since last update
   */
  handleResetPhase(deltaTime) {
    // Create exit portal
    this.createExitPortal();
    
    // Spawn dragon egg if first time
    if (this.gatewaysSpawned === 0) {
      this.spawnDragonEgg();
    }
    
    // Create end gateway
    this.createEndGateway();
    
    // Transition back to waiting phase
    this.transitionToPhase('waiting');
  }
  
  /**
   * Transition to a new phase
   * @param {String} newPhase - New phase name
   */
  transitionToPhase(newPhase) {
    const oldPhase = this.phase;
    this.phase = newPhase;
    this.phaseStartTime = Date.now();
    
    // Emit phase change event
    this.emit('phaseChange', {
      oldPhase,
      newPhase
    });
    
    // Handle phase-specific actions
    switch (newPhase) {
      case 'preparing':
        this.startPreparation();
        break;
      case 'active':
        this.active = true;
        break;
      case 'victory':
        this.active = false;
        this.handleDragonDefeat();
        break;
      case 'reset':
        this.cleanupFight();
        break;
    }
  }
  
  /**
   * Start the dragon fight
   */
  startFight() {
    if (this.active) return;
    
    // Transition to preparing phase
    this.transitionToPhase('preparing');
    
    // Emit fight start event
    this.emit('fightStart');
    
    // Notify clients
    if (this.server) {
      this.server.emit('dragonFightStart', {
        dimension: 'end'
      });
    }
  }
  
  /**
   * Start the preparation phase
   */
  startPreparation() {
    // Clear any existing crystals
    this.removeCrystals();
    
    // Spawn new crystals on pillars
    this.spawnCrystals();
    
    // Play preparation sound
    if (this.server) {
      this.server.emit('playSound', {
        name: 'entity.ender_dragon.growl',
        position: this.exitPortalLocation,
        volume: 1.0,
        pitch: 1.0,
        dimension: 'end',
        global: true
      });
    }
  }
  
  /**
   * Spawn the Ender Dragon
   */
  spawnDragon() {
    // Create new dragon
    this.dragon = new EnderDragon({
      position: {
        x: 0,
        y: 100,
        z: 0
      },
      world: this.world,
      server: this.server
    });
    
    // Add event listeners
    this.dragon.on('death', this.onDragonDeath.bind(this));
    
    // Add to world
    if (this.world && this.world.addEntity) {
      this.world.addEntity(this.dragon);
    }
    
    // Reset crystal tracking
    this.crystalsDestroyed = 0;
    
    // Emit dragon spawn event
    this.emit('dragonSpawn', {
      dragon: this.dragon
    });
    
    // Play spawn sound
    if (this.server) {
      this.server.emit('playSound', {
        name: 'entity.ender_dragon.growl',
        position: this.dragon.position,
        volume: 1.0,
        pitch: 0.8,
        dimension: 'end',
        global: true
      });
    }
  }
  
  /**
   * Handle dragon death event
   * @param {Object} data - Death event data
   */
  onDragonDeath(data) {
    // Update state
    this.active = false;
    
    // Award experience to nearby players
    this.awardExperience();
    
    // Transition to victory phase
    this.transitionToPhase('victory');
  }
  
  /**
   * Award experience to players in the fight
   */
  awardExperience() {
    if (!this.world) return;
    
    // Get players in the End dimension
    const players = Array.from(this.playersInFight);
    
    // Award 12000 total XP, divided among players (with minimum 500 per player)
    const totalXP = 12000;
    const xpPerPlayer = Math.max(500, Math.floor(totalXP / players.length));
    
    for (const playerId of players) {
      const player = this.world.getPlayer(playerId);
      if (player && typeof player.addExperience === 'function') {
        player.addExperience(xpPerPlayer);
      }
    }
    
    // Create experience orbs around the portal for any remaining XP
    const remainingXP = totalXP - (xpPerPlayer * players.length);
    if (remainingXP > 0 && this.world.spawnExperienceOrbs) {
      this.world.spawnExperienceOrbs(this.exitPortalLocation, remainingXP);
    }
  }
  
  /**
   * Handle dragon defeat (cleanup, rewards, etc.)
   */
  handleDragonDefeat() {
    // Mark as previously killed
    this.previouslyKilled = true;
    
    // Emit defeat event
    this.emit('dragonDefeated');
    
    // Notify clients
    if (this.server) {
      this.server.emit('dragonFightEnd', {
        dimension: 'end',
        victory: true
      });
    }
  }
  
  /**
   * Create the exit portal
   */
  createExitPortal() {
    if (!this.world) return;
    
    // Create bedrock rim
    const portalRadius = 4;
    
    for (let x = -portalRadius; x <= portalRadius; x++) {
      for (let z = -portalRadius; z <= portalRadius; z++) {
        const distSq = x * x + z * z;
        const pos = {
          x: this.exitPortalLocation.x + x,
          y: this.exitPortalLocation.y,
          z: this.exitPortalLocation.z + z
        };
        
        if (distSq <= (portalRadius * portalRadius)) {
          // Portal block in the center area
          if (distSq <= ((portalRadius - 1) * (portalRadius - 1))) {
            this.world.setBlock(pos, { type: 'end_portal' });
          } else {
            // Bedrock on the rim
            this.world.setBlock(pos, { type: 'bedrock' });
          }
        }
      }
    }
    
    // Play portal creation sound
    if (this.server) {
      this.server.emit('playSound', {
        name: 'block.end_portal.spawn',
        position: this.exitPortalLocation,
        volume: 1.0,
        pitch: 1.0,
        dimension: 'end'
      });
    }
  }
  
  /**
   * Spawn the dragon egg on the exit portal
   */
  spawnDragonEgg() {
    if (!this.world) return;
    
    // Spawn dragon egg at the top center of the portal
    const eggPos = {
      x: this.exitPortalLocation.x,
      y: this.exitPortalLocation.y + 1,
      z: this.exitPortalLocation.z
    };
    
    // Set the dragon egg block
    this.world.setBlock(eggPos, { type: 'dragon_egg' });
    
    // Play egg spawn sound
    if (this.server) {
      this.server.emit('playSound', {
        name: 'entity.ender_dragon.death',
        position: eggPos,
        volume: 0.5,
        pitch: 1.2,
        dimension: 'end'
      });
    }
  }
  
  /**
   * Create an End Gateway
   */
  createEndGateway() {
    if (!this.world) return;
    
    // Only spawn up to 20 gateways
    if (this.gatewaysSpawned >= 20) return;
    
    // Calculate gateway position in a circle
    const gatewayRadius = 75 + (this.gatewaysSpawned * 1); // Spread out slightly
    const angle = (this.gatewaysSpawned / 20) * Math.PI * 2;
    
    const gatewayX = Math.floor(Math.cos(angle) * gatewayRadius);
    const gatewayZ = Math.floor(Math.sin(angle) * gatewayRadius);
    
    // Find surface height
    let gatewayY = 75; // Default height
    for (let y = 100; y > 40; y--) {
      const blockPos = { x: gatewayX, y, z: gatewayZ };
      const blockType = this.world.getBlockType(blockPos);
      
      if (blockType === 'end_stone') {
        gatewayY = y + 1;
        break;
      }
    }
    
    // Create gateway blocks
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const pos = {
          x: gatewayX + dx,
          y: gatewayY,
          z: gatewayZ + dz
        };
        
        if (dx === 0 && dz === 0) {
          // Center is the gateway portal
          const EndGatewayBlock = require('../blocks/endGatewayBlock');
          const gateway = new EndGatewayBlock({
            exitPosition: { x: 100 * 16, y: 100, z: 0 }, // Target location in outer islands
            exactTeleport: false,
            server: this.server
          });
          
          this.world.setBlock(pos, gateway);
        } else {
          // Surrounding blocks are bedrock
          this.world.setBlock(pos, { type: 'bedrock' });
        }
      }
    }
    
    // Increment gateway count
    this.gatewaysSpawned++;
    
    // Play gateway creation sound
    if (this.server) {
      this.server.emit('playSound', {
        name: 'block.end_gateway.spawn',
        position: { x: gatewayX, y: gatewayY, z: gatewayZ },
        volume: 1.0,
        pitch: 1.0,
        dimension: 'end'
      });
      
      // Visual effect
      this.server.emit('gatewayCreated', {
        position: { x: gatewayX, y: gatewayY, z: gatewayZ },
        dimension: 'end'
      });
    }
  }
  
  /**
   * Spawn crystals on the end pillars
   */
  spawnCrystals() {
    // Create crystals using the static method
    this.crystals = EndCrystal.createPillarCrystals(this.world, this.server);
    
    // Add event listeners to all crystals
    for (const crystal of this.crystals) {
      crystal.on('death', this.onCrystalDestroyed.bind(this));
    }
  }
  
  /**
   * Handle crystal destruction
   * @param {Object} data - Crystal death data
   */
  onCrystalDestroyed(data) {
    // Increment destroyed count
    this.crystalsDestroyed++;
    
    // Update dragon if it exists
    if (this.dragon) {
      this.dragon.crystalsDestroyed = this.crystalsDestroyed;
      
      // More crystals destroyed = less damage resistance
      const resistance = 0.5 - (this.crystalsDestroyed * 0.05);
      this.dragon.damageResistance = Math.max(0, resistance);
    }
    
    // Emit crystal destroyed event
    this.emit('crystalDestroyed', {
      crystalsDestroyed: this.crystalsDestroyed,
      totalCrystals: this.crystals.length
    });
  }
  
  /**
   * Remove all end crystals
   */
  removeCrystals() {
    for (const crystal of this.crystals) {
      crystal.remove();
    }
    
    this.crystals = [];
  }
  
  /**
   * Check if the dragon fight was previously completed
   */
  checkPreviouslyKilled() {
    if (!this.world) return;
    
    // Check for dragon egg or gateway existence
    const eggPos = {
      x: this.exitPortalLocation.x,
      y: this.exitPortalLocation.y + 1,
      z: this.exitPortalLocation.z
    };
    
    const eggBlock = this.world.getBlockType(eggPos);
    
    if (eggBlock === 'dragon_egg') {
      this.previouslyKilled = true;
    } else {
      // Check for gateway blocks
      for (let radius = 70; radius < 100; radius += 10) {
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
          const x = Math.floor(Math.cos(angle) * radius);
          const z = Math.floor(Math.sin(angle) * radius);
          
          const blockType = this.world.getBlockType({ x, y: 75, z });
          
          if (blockType === 'end_gateway') {
            this.previouslyKilled = true;
            this.gatewaysSpawned++;
            break;
          }
        }
        
        if (this.previouslyKilled) break;
      }
    }
  }
  
  /**
   * Check for respawn crystals
   */
  checkRespawnCrystals() {
    if (!this.world) return;
    
    // Check for 4 end crystals around the portal
    const respawnPositions = [
      { x: this.exitPortalLocation.x - 3, y: this.exitPortalLocation.y + 1, z: this.exitPortalLocation.z },
      { x: this.exitPortalLocation.x + 3, y: this.exitPortalLocation.y + 1, z: this.exitPortalLocation.z },
      { x: this.exitPortalLocation.x, y: this.exitPortalLocation.y + 1, z: this.exitPortalLocation.z - 3 },
      { x: this.exitPortalLocation.x, y: this.exitPortalLocation.y + 1, z: this.exitPortalLocation.z + 3 }
    ];
    
    let crystalsFound = 0;
    
    // Check each position for end crystal entity
    for (const pos of respawnPositions) {
      // Look for entities at this position
      if (this.world.getEntitiesInRange) {
        const entities = this.world.getEntitiesInRange(pos, 1).filter(e => e.type === 'end_crystal');
        
        if (entities.length > 0) {
          crystalsFound++;
        }
      }
    }
    
    // If all four crystals are present, start respawning sequence
    if (crystalsFound === 4) {
      // Remove respawn crystals
      for (const pos of respawnPositions) {
        const crystals = this.world.getEntitiesInRange(pos, 1).filter(e => e.type === 'end_crystal');
        for (const crystal of crystals) {
          crystal.remove();
        }
      }
      
      // Begin dragon respawn with a 5 second respawn time
      this.respawnTime = 5;
      
      // Play respawn sound
      if (this.server) {
        this.server.emit('playSound', {
          name: 'entity.ender_dragon.growl',
          position: this.exitPortalLocation,
          volume: 1.0,
          pitch: 0.6,
          dimension: 'end',
          global: true
        });
      }
    }
  }
  
  /**
   * Respawn the Ender Dragon
   */
  respawnDragon() {
    // Start the fight
    this.startFight();
  }
  
  /**
   * Update the set of players participating in the fight
   */
  updatePlayersInFight() {
    if (!this.world) return;
    
    // Get all players in the End dimension
    const endPlayers = Array.from(this.world.getPlayers()).filter(
      player => player.dimension === 'end'
    );
    
    // Update the set of players in the fight
    this.playersInFight.clear();
    
    for (const player of endPlayers) {
      this.playersInFight.add(player.id);
    }
  }
  
  /**
   * Clean up the fight state
   */
  cleanupFight() {
    // Clear dragon reference
    this.dragon = null;
    
    // Clear crystals
    this.removeCrystals();
  }
  
  /**
   * Serializes the dragon fight state
   * @returns {Object} Serialized data
   */
  serialize() {
    return {
      active: this.active,
      phase: this.phase,
      phaseStartTime: this.phaseStartTime,
      respawnTime: this.respawnTime,
      previouslyKilled: this.previouslyKilled,
      gatewaysSpawned: this.gatewaysSpawned,
      crystalsDestroyed: this.crystalsDestroyed,
      exitPortalLocation: { ...this.exitPortalLocation }
    };
  }
  
  /**
   * Deserializes the dragon fight state
   * @param {Object} data - Serialized data
   */
  deserialize(data) {
    if (!data) return;
    
    this.active = data.active || false;
    this.phase = data.phase || 'waiting';
    this.phaseStartTime = data.phaseStartTime || 0;
    this.respawnTime = data.respawnTime || 0;
    this.previouslyKilled = data.previouslyKilled || false;
    this.gatewaysSpawned = data.gatewaysSpawned || 0;
    this.crystalsDestroyed = data.crystalsDestroyed || 0;
    
    if (data.exitPortalLocation) {
      this.exitPortalLocation = { ...data.exitPortalLocation };
    }
  }
}

module.exports = DragonFight; 