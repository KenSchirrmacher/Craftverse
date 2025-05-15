/**
 * SculkCatalystBlock - A sculk block that spreads sculk when mobs die nearby
 */

const Block = require('./block');
const EventEmitter = require('events');

class SculkCatalystBlock extends Block {
  /**
   * Create a new SculkCatalystBlock
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'sculk_catalyst',
      name: 'Sculk Catalyst',
      hardness: 3.0,
      resistance: 3.0,
      requiresTool: true,
      toolType: 'hoe',
      drops: [{ id: 'sculk_catalyst', count: 1 }],
      lightLevel: 6, // Emits a small amount of light
      ...options
    });

    // Sculk spread properties
    this.active = false; // Whether the catalyst is currently active (blooming)
    this.maxChargeDistance = 8; // Maximum distance for XP charge reception
    this.bloomDuration = 20; // Duration in ticks for the blooming animation
    this.bloomTimer = 0; // Current bloom animation timer
    this.chargeEvents = []; // Store recent mob death charge events
    this.maxChargeEvents = 5; // Maximum number of charge events to track
    
    // Use an EventEmitter for the catalyst events
    this.catalystEmitter = new EventEmitter();
  }

  /**
   * Handle mob death and collect XP charge
   * @param {Object} event - Mob death event
   * @param {Object} event.position - Position of the mob death
   * @param {number} event.xpAmount - Amount of XP dropped by the mob
   * @param {string} event.mobType - Type of mob that died
   * @param {number} currentTime - Current game time in ticks
   * @returns {boolean} Whether the charge was collected
   */
  handleMobDeath(event, currentTime) {
    // Calculate distance to mob death
    const dx = event.position.x - this.x;
    const dy = event.position.y - this.y;
    const dz = event.position.z - this.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Check if mob death is in range
    if (distance > this.maxChargeDistance) {
      return false;
    }

    // Calculate charge amount based on XP and distance
    const chargeAmount = Math.max(1, Math.floor(event.xpAmount * (1 - distance / this.maxChargeDistance)));
    
    // Add charge event
    const chargeEvent = {
      position: { ...event.position },
      chargeAmount: chargeAmount,
      time: currentTime,
      mobType: event.mobType,
      processed: false
    };
    
    this.chargeEvents.push(chargeEvent);
    
    // Limit the number of stored events
    if (this.chargeEvents.length > this.maxChargeEvents) {
      this.chargeEvents.shift();
    }
    
    // Activate bloom effect
    this.activateBloom(currentTime);
    
    // Emit charge collected event
    this.catalystEmitter.emit('chargeCollected', {
      position: event.position,
      chargeAmount: chargeAmount,
      catalyst: {
        x: this.x,
        y: this.y,
        z: this.z
      }
    });

    return true;
  }

  /**
   * Activate the catalyst bloom effect
   * @param {number} currentTime - Current game time in ticks
   */
  activateBloom(currentTime) {
    this.active = true;
    this.bloomTimer = this.bloomDuration;
    
    // Emit bloom started event
    this.catalystEmitter.emit('bloomStarted', {
      position: {
        x: this.x,
        y: this.y,
        z: this.z
      },
      time: currentTime
    });
  }

  /**
   * Spread sculk blocks in the area
   * @param {Object} world - World object
   * @param {Object} chargeEvent - Charge event to process
   */
  spreadSculk(world, chargeEvent) {
    if (!world || chargeEvent.processed) return;
    
    const spreadRadius = Math.min(5, chargeEvent.chargeAmount);
    const spreadPositions = [];
    
    // Find valid positions for sculk spread
    for (let x = -spreadRadius; x <= spreadRadius; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -spreadRadius; z <= spreadRadius; z++) {
          // Calculate position
          const pos = {
            x: Math.floor(chargeEvent.position.x) + x,
            y: Math.floor(chargeEvent.position.y) + y,
            z: Math.floor(chargeEvent.position.z) + z
          };
          
          // Calculate distance from charge event
          const dx = pos.x - chargeEvent.position.x;
          const dy = pos.y - chargeEvent.position.y;
          const dz = pos.z - chargeEvent.position.z;
          const distSquared = dx * dx + dy * dy + dz * dz;
          
          // Check if position is within spread radius and has a valid target block
          if (distSquared <= spreadRadius * spreadRadius) {
            const block = world.getBlock(pos.x, pos.y, pos.z);
            if (this.canReplace(block)) {
              // Add position with probability based on distance
              const probability = 1 - (Math.sqrt(distSquared) / spreadRadius);
              if (Math.random() < probability) {
                spreadPositions.push(pos);
              }
            }
          }
        }
      }
    }
    
    // Process spread positions
    for (const pos of spreadPositions) {
      // Determine sculk block type to place
      let blockType = 'sculk';
      
      // Small chance for special blocks based on charge amount
      if (chargeEvent.chargeAmount >= 4) {
        const rand = Math.random();
        if (rand < 0.05) {
          blockType = 'sculk_sensor';
        } else if (rand < 0.15 && chargeEvent.chargeAmount >= 6) {
          blockType = 'sculk_shrieker';
        }
      }
      
      // Set block in world
      world.setBlock(pos.x, pos.y, pos.z, blockType);
      
      // Emit sculk spread event
      this.catalystEmitter.emit('sculkSpread', {
        position: pos,
        blockType: blockType,
        sourceCharge: chargeEvent.chargeAmount
      });
    }
    
    // Mark event as processed
    chargeEvent.processed = true;
  }

  /**
   * Check if a block can be replaced by sculk
   * @param {Object} block - Block to check
   * @returns {boolean} Whether the block can be replaced
   */
  canReplace(block) {
    if (!block) return false;
    
    // List of replaceable blocks
    const replaceableBlocks = [
      'stone', 'dirt', 'grass_block', 'coarse_dirt', 'podzol', 'gravel',
      'sand', 'sandstone', 'clay', 'snow', 'andesite', 'diorite', 'granite',
      'deepslate', 'cobbled_deepslate', 'tuff', 'moss_block'
    ];
    
    return replaceableBlocks.includes(block.id);
  }

  /**
   * Update block state
   * @param {Object} world - World object
   * @param {Object} position - Block position
   * @param {number} currentTime - Current game time in ticks
   */
  update(world, position, currentTime) {
    // Store position references
    if (world) {
      this.world = world;
      this.x = position.x;
      this.y = position.y;
      this.z = position.z;
    }
    
    // Update bloom timer
    if (this.active && this.bloomTimer > 0) {
      this.bloomTimer--;
      
      // Deactivate after bloom duration
      if (this.bloomTimer === 0) {
        this.active = false;
        
        // Emit bloom ended event
        this.catalystEmitter.emit('bloomEnded', {
          position: {
            x: this.x,
            y: this.y,
            z: this.z
          },
          time: currentTime
        });
      }
    }
    
    // Process any unprocessed charge events
    if (world) {
      for (const event of this.chargeEvents) {
        if (!event.processed) {
          this.spreadSculk(world, event);
        }
      }
    }
  }

  /**
   * Get the current block light level
   * @returns {number} Light level (0-15)
   */
  getLightLevel() {
    // Increase light level when blooming
    return this.active ? 14 : this.lightLevel;
  }

  /**
   * Serialize block state
   * @returns {Object} Serialized block data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      active: this.active,
      bloomTimer: this.bloomTimer,
      chargeEvents: this.chargeEvents.map(event => ({
        position: event.position,
        chargeAmount: event.chargeAmount,
        time: event.time,
        mobType: event.mobType,
        processed: event.processed
      }))
    };
  }

  /**
   * Deserialize block state
   * @param {Object} data - Serialized block data
   * @returns {SculkCatalystBlock} New block instance
   */
  static fromJSON(data) {
    const block = new SculkCatalystBlock(data);
    block.active = data.active || false;
    block.bloomTimer = data.bloomTimer || 0;
    block.chargeEvents = data.chargeEvents || [];
    return block;
  }
}

module.exports = SculkCatalystBlock; 