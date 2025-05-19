/**
 * SporeBlossomBlock - Implementation of the spore blossom plant that hangs from ceilings and emits particles
 * Part of the Caves & Cliffs update
 */

// Base block for extension
const Block = require('./baseBlock');

class SporeBlossomBlock extends Block {
  /**
   * Create a new spore blossom block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    // Set default options for spore blossom
    super({
      id: 'spore_blossom',
      name: 'Spore Blossom',
      hardness: 0.5,
      resistance: 0.5,
      requiresTool: false,
      transparent: true,
      solid: false,
      ...options
    });
    
    // Block-specific properties
    this.isPlant = true;
    this.requiresCeiling = true;
    this.canBeWaterlogged = true;
    this.isWaterlogged = options.isWaterlogged || false;
    
    // Particle emission properties
    this.particleType = 'spore';
    this.particleColor = '#E5A9FF'; // Pale pink/purple
    this.particleRate = 0.2; // Particles per second (average)
    this.particleRange = 8; // Blocks downward from the blossom
    this.particleCount = options.particleCount || 3; // Number of particles in a burst
    this.lastParticleTime = 0;
  }
  
  /**
   * Check if block can be placed at the given position
   * @param {World} world - World object
   * @param {Vector3} position - Position to check
   * @returns {boolean} Whether block can be placed here
   */
  canPlaceAt(world, position) {
    if (!world) return false;
    
    // Check if there's a solid block above to hang from
    const blockAbove = world.getBlockAt(position.x, position.y + 1, position.z);
    return blockAbove && blockAbove.solid;
  }
  
  /**
   * Handle block placement in the world
   * @param {World} world - World object
   * @param {Vector3} position - Position where block is placed
   * @param {Player} player - Player who placed the block
   * @returns {boolean} Whether placement was successful
   */
  onPlace(world, position, player) {
    if (!this.canPlaceAt(world, position)) {
      return false;
    }
    
    // Check if the position is in water
    const blockAtPosition = world.getBlockAt(position.x, position.y, position.z);
    if (blockAtPosition && blockAtPosition.type === 'water') {
      this.isWaterlogged = true;
    }
    
    return true;
  }
  
  /**
   * Update the block (called on block tick)
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Object} options - Additional update options
   */
  update(world, position, options = {}) {
    if (!world) return;
    
    // Check if supporting block is still there
    if (!this.canPlaceAt(world, position)) {
      world.breakBlock(position.x, position.y, position.z, options);
      return;
    }
    
    // Emit particles if time has passed
    const now = Date.now();
    if (now - this.lastParticleTime > (1000 / this.particleRate)) {
      this.emitParticles(world, position);
      this.lastParticleTime = now;
    }
  }
  
  /**
   * Emit spore particles from the blossom
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   */
  emitParticles(world, position) {
    if (!world || !world.emitParticles) return;
    
    const centerX = position.x + 0.5;
    const centerY = position.y - 0.2; // Slightly below the block
    const centerZ = position.z + 0.5;
    
    // Create a particle burst
    world.emitParticles({
      type: this.particleType,
      position: { x: centerX, y: centerY, z: centerZ },
      count: this.particleCount,
      color: this.particleColor,
      velocity: { x: 0, y: -0.02, z: 0 }, // Slowly drift downward
      randomizeVelocity: 0.01, // Small random variation in velocity
      lifespan: 20000, // 20 seconds
      size: 0.1,
      maxDistance: this.particleRange,
      gravity: 0.005 // Very slight gravity
    });
  }
  
  /**
   * Handle block breaking
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Player} player - Player who broke the block
   * @param {Object} options - Additional break options
   */
  onBreak(world, position, player, options = {}) {
    if (!world) return;
    
    // Drop the item if not in creative mode
    if (player && player.gameMode !== 'creative') {
      world.dropItem({
        id: this.id,
        count: 1
      }, position);
    }
    
    // If waterlogged, leave water in its place
    if (this.isWaterlogged) {
      world.setBlock(position.x, position.y, position.z, { type: 'water' });
    }
    
    return true;
  }
  
  /**
   * Get block collision boxes
   * @returns {Object[]} Array of collision boxes
   */
  getCollisionBoxes() {
    // Simplified collision box
    return [
      {
        minX: 0.3,
        minY: 0.0,
        minZ: 0.3,
        maxX: 0.7,
        maxY: 0.5,
        maxZ: 0.7
      }
    ];
  }
  
  /**
   * Convert block to JSON for serialization
   * @returns {Object} Block data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      isWaterlogged: this.isWaterlogged
    };
  }
  
  /**
   * Create block from JSON data
   * @param {Object} data - Block data
   * @returns {SporeBlossomBlock} Block instance
   */
  static fromJSON(data) {
    return new SporeBlossomBlock({
      isWaterlogged: data.isWaterlogged
    });
  }
}

module.exports = SporeBlossomBlock; 