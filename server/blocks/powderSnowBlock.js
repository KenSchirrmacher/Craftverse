/**
 * Powder Snow Block - a special snow block that entities can sink into
 * Part of the Caves & Cliffs update
 */

const Block = require('./blockBase');
const { getRandomInt } = require('../utils/mathUtils');

class PowderSnowBlock extends Block {
  /**
   * Create a new powder snow block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'powder_snow',
      name: 'Powder Snow',
      hardness: 0.25,
      transparent: true,
      solid: false,
      ...options
    });
    
    // Special properties for powder snow
    this.collisionReduction = 0.9;
    this.allowEntitySinking = true;
    this.movementFactor = 0.3;
    this.sinkRate = 0.1;
    this.freezeDamage = 1;
    this.freezeInterval = 40; // Ticks between freeze damage
    this.lightFilter = 3;
    this.canFallThrough = true;
    this.canBeCollectedWithBucket = true;

    // Set up textures
    this.textures = {
      top: 'blocks/powder_snow',
      bottom: 'blocks/powder_snow',
      sides: 'blocks/powder_snow'
    };
  }
  
  /**
   * Handle entity collision with this block
   * Most entities sink in powder snow unless they're wearing leather boots
   * or are naturally resistant (like goats)
   */
  onEntityCollision(entity, world) {
    // Skip for entities that don't sink
    if (this.isEntityImmuneToSinking(entity)) {
      return;
    }

    // Apply sinking effect
    if (entity.velocity) {
      entity.velocity.y = -this.sinkRate;
    }

    // Generate particles if entity is moving
    if (world && this.hasSignificantMovement(entity)) {
      this.generateSnowParticles(entity, world);
    }
  }
  
  /**
   * Handle when an entity is inside this block
   * Apply freezing effect over time
   */
  onEntityInside(entity, world) {
    // Apply freezing damage to non-resistant entities
    if (!this.isEntityImmuneToFreezing(entity)) {
      // Increase frozen time counter
      if (!entity.frozenTime) {
        entity.frozenTime = 0;
      }
      
      entity.frozenTime++;
      
      // Apply damage at intervals
      if (entity.frozenTime % this.freezeInterval === 0) {
        if (typeof entity.applyDamage === 'function') {
          entity.applyDamage(this.freezeDamage, 'freezing');
        }
      }
    }
  }
  
  /**
   * Handle when an entity exits this block
   */
  onEntityExit(entity) {
    // Reset frozen time when leaving powder snow
    if (entity.frozenTime) {
      entity.frozenTime = 0;
    }
  }
  
  /**
   * Check if entity is immune to sinking in powder snow
   */
  isEntityImmuneToSinking(entity) {
    // Entities that don't sink in powder snow
    if (!entity) return false;
    
    const immuneTypes = ['goat', 'snow_golem', 'rabbit'];
    
    // Check entity type
    if (immuneTypes.includes(entity.type)) {
      return true;
    }
    
    // Check for leather boots
    if (entity.wearingBoots && entity.hasLeatherBoots) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if entity is immune to freezing damage
   */
  isEntityImmuneToFreezing(entity) {
    // Entities immune to freezing
    if (!entity) return false;
    
    const immuneTypes = ['snow_golem', 'stray', 'polar_bear'];
    
    // Check entity type
    if (immuneTypes.includes(entity.type)) {
      return true;
    }
    
    // Check for cold resistance property
    if (entity.coldResistant) {
      return true;
    }
    
    // Check for full leather armor
    if (entity.hasLeatherArmor) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if entity has significant movement to generate particles
   */
  hasSignificantMovement(entity) {
    if (!entity || !entity.velocity) return false;
    
    const movementThreshold = 0.1;
    const velocity = entity.velocity;
    
    return Math.abs(velocity.x) > movementThreshold || 
           Math.abs(velocity.z) > movementThreshold;
  }
  
  /**
   * Generate snow particles when entities move through powder snow
   */
  generateSnowParticles(entity, world) {
    if (!world || !entity) return;
    
    const particleCount = getRandomInt(1, 3);
    const particleType = Math.random() > 0.5 ? 'snow' : 'snow_puff';
    
    world.spawnParticles(
      particleType,
      entity.position.x,
      entity.position.y,
      entity.position.z,
      particleCount,
      0.2
    );
  }
  
  /**
   * Handle random ticks - can melt in hot biomes
   */
  onRandomTick(world, x, y, z) {
    if (!world) return;
    
    // Check temperature at this position
    const temperature = world.getTemperatureAt(x, y, z);
    
    // Melt in hot biomes (temperature > 1.0)
    if (temperature > 1.0) {
      const meltChance = (temperature - 1.0) * 0.2;
      
      if (Math.random() < meltChance) {
        // Melt to water or air depending on temperature
        const newBlockId = temperature > 1.5 ? 'air' : 'water';
        world.setBlockAt(x, y, z, newBlockId);
      }
    }
  }
  
  /**
   * Handle when a player interacts with this block
   */
  onInteract(player, itemInHand, world, x, y, z) {
    // If player has a bucket, collect the powder snow
    if (itemInHand && itemInHand.id === 'bucket') {
      // Remove the bucket from inventory
      player.inventory.removeItem(itemInHand.id, 1);
      
      // Add powder snow bucket to inventory
      player.inventory.addItem('powder_snow_bucket', 1);
      
      // Replace the block with air
      world.setBlockAt(x, y, z, 'air');
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Serialize block data for saving
   */
  serialize() {
    return {
      ...super.serialize()
    };
  }
  
  /**
   * Deserialize block data when loading
   */
  static deserialize(data) {
    return new PowderSnowBlock(data);
  }
}

module.exports = PowderSnowBlock; 