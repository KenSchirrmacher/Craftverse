/**
 * EndCrystal - Represents an End Crystal entity that heals the Ender Dragon
 */

const EventEmitter = require('events');

class EndCrystal extends EventEmitter {
  /**
   * Creates a new End Crystal entity
   * @param {Object} options - Crystal options
   * @param {String} options.id - Entity ID
   * @param {Object} options.position - Initial position
   * @param {Object} options.beamTarget - Position the beam points to (usually 0,0,0)
   * @param {Boolean} options.showBase - Whether to show the obsidian base
   * @param {Object} options.world - World instance
   * @param {Object} options.server - Server instance
   */
  constructor(options = {}) {
    super();
    this.id = options.id || `crystal_${Date.now()}`;
    this.type = 'end_crystal';
    this.position = options.position || { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.beamTarget = options.beamTarget || { x: 0, y: 64, z: 0 };
    this.showBase = options.showBase !== undefined ? options.showBase : true;
    this.world = options.world;
    this.server = options.server;
    this.dimension = 'end';
    
    // Properties
    this.health = 1; // Only 1 health, one-hit kill
    this.invulnerable = false;
    this.lightLevel = 15; // Emits light
    this.boundingBox = this.calculateBoundingBox();
    this.size = { width: 2, height: 2, depth: 2 };
    
    // Visual properties
    this.isBeaming = true; // Whether the crystal is beaming to target
    this.rotation.y = Math.random() * Math.PI * 2; // Random rotation for visual effect
    this.rotationSpeed = 0.02 + Math.random() * 0.03; // Random rotation speed
    
    // Emit spawn event
    this.emitSpawn();
  }
  
  /**
   * Updates the crystal's state
   * @param {Number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // Rotate crystal
    this.rotation.y = (this.rotation.y + this.rotationSpeed) % (Math.PI * 2);
    
    // Update bounding box
    this.boundingBox = this.calculateBoundingBox();
    
    // Emit update
    this.emit('update', {
      id: this.id,
      type: this.type,
      position: { ...this.position },
      rotation: { ...this.rotation },
      beamTarget: { ...this.beamTarget },
      isBeaming: this.isBeaming
    });
  }
  
  /**
   * Calculate the crystal's bounding box
   * @returns {Object} Bounding box with min/max coordinates
   */
  calculateBoundingBox() {
    const halfWidth = this.size.width / 2;
    const halfDepth = this.size.depth / 2;
    
    return {
      min: {
        x: this.position.x - halfWidth,
        y: this.position.y,
        z: this.position.z - halfDepth
      },
      max: {
        x: this.position.x + halfWidth,
        y: this.position.y + this.size.height,
        z: this.position.z + halfDepth
      }
    };
  }
  
  /**
   * Take damage from an entity or source
   * @param {Number} amount - Amount of damage
   * @param {Object} source - Damage source
   * @returns {Boolean} Whether damage was applied
   */
  damage(amount, source) {
    if (this.invulnerable || this.health <= 0) return false;
    
    // End crystals always die in one hit
    this.health = 0;
    
    // Emit damage event
    this.emit('damaged', {
      entity: this,
      amount,
      source
    });
    
    // Explode and die
    this.explode();
    
    return true;
  }
  
  /**
   * Explode the crystal
   */
  explode() {
    // Create explosion
    if (this.world) {
      // Check if world has explosion method
      if (typeof this.world.createExplosion === 'function') {
        this.world.createExplosion({
          position: this.position,
          power: 6, // Fairly powerful explosion
          fire: false,
          source: this
        });
      }
    }
    
    // Play explosion sound
    if (this.server) {
      this.server.emit('playSound', {
        name: 'entity.generic.explode',
        position: this.position,
        volume: 1.0,
        pitch: 1.0,
        dimension: this.dimension
      });
    }
    
    // Emit death event
    this.emit('death', {
      entity: this,
      position: this.position
    });
    
    // Notify dragon fight
    if (this.world && typeof this.world.onCrystalDestroyed === 'function') {
      this.world.onCrystalDestroyed(this);
    }
    
    // Remove entity
    this.remove();
  }
  
  /**
   * Set the beam target position
   * @param {Object} target - Target position
   */
  setBeamTarget(target) {
    if (!target) {
      this.isBeaming = false;
      return;
    }
    
    this.beamTarget = { ...target };
    this.isBeaming = true;
    
    // Emit update for beam change
    this.emit('beamChanged', {
      id: this.id,
      beamTarget: this.beamTarget
    });
  }
  
  /**
   * Remove this crystal from the world
   */
  remove() {
    // Remove from world
    if (this.world) {
      this.world.removeEntity(this.id);
    }
    
    // Emit remove event
    this.emit('removed', {
      entity: this
    });
    
    // Remove all listeners
    this.removeAllListeners();
  }
  
  /**
   * Emit spawn event
   */
  emitSpawn() {
    this.emit('spawn', {
      id: this.id,
      type: this.type,
      position: { ...this.position },
      beamTarget: { ...this.beamTarget },
      showBase: this.showBase
    });
    
    // Also notify server
    if (this.server) {
      this.server.emit('entitySpawned', {
        id: this.id,
        type: this.type,
        position: { ...this.position },
        beamTarget: { ...this.beamTarget },
        showBase: this.showBase,
        dimension: this.dimension
      });
    }
  }
  
  /**
   * Serializes the crystal entity
   * @returns {Object} Serialized data
   */
  serialize() {
    return {
      id: this.id,
      type: this.type,
      position: { ...this.position },
      rotation: { ...this.rotation },
      beamTarget: { ...this.beamTarget },
      showBase: this.showBase,
      isBeaming: this.isBeaming,
      invulnerable: this.invulnerable
    };
  }
  
  /**
   * Creates an End Crystal entity from serialized data
   * @param {Object} data - Serialized data
   * @param {Object} world - World instance
   * @param {Object} server - Server instance
   * @returns {EndCrystal} New End Crystal entity
   */
  static deserialize(data, world, server) {
    const crystal = new EndCrystal({
      id: data.id,
      position: data.position,
      beamTarget: data.beamTarget,
      showBase: data.showBase,
      world,
      server
    });
    
    crystal.rotation = data.rotation || crystal.rotation;
    crystal.isBeaming = data.isBeaming !== undefined ? data.isBeaming : true;
    crystal.invulnerable = data.invulnerable || false;
    
    return crystal;
  }
  
  /**
   * Create end crystals on the obsidian pillars
   * @param {Object} world - World instance
   * @param {Object} server - Server instance
   * @param {Number} count - Number of crystals to create
   * @returns {Array} Array of created crystals
   */
  static createPillarCrystals(world, server, count = 10) {
    if (!world) return [];
    
    const crystals = [];
    const radius = 43; // Standard pillar radius
    
    // Calculate positions in a circle
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.round(Math.cos(angle) * radius);
      const z = Math.round(Math.sin(angle) * radius);
      
      // Find the top of the obsidian pillar
      let y = 76; // Default height if pillar not found
      
      // Scan for obsidian pillar top
      for (let scanY = 120; scanY > 50; scanY--) {
        const blockPos = { x, y: scanY, z };
        const blockType = world.getBlockType(blockPos);
        
        if (blockType === 'obsidian') {
          y = scanY + 1; // Position above the obsidian
          break;
        }
      }
      
      // Create the crystal
      const crystal = new EndCrystal({
        position: { x, y, z },
        beamTarget: { x: 0, y: 100, z: 0 }, // Beam points up above the central island
        showBase: true,
        world,
        server
      });
      
      // Add to world
      if (world.addEntity) {
        world.addEntity(crystal);
      }
      
      crystals.push(crystal);
    }
    
    return crystals;
  }
}

module.exports = EndCrystal; 