const events = require('events');
const ParticleSystem = require('../particles/particleSystem');
const BiomeRegistry = require('../biomes/biomeRegistry');
const { integrateBambooGeneration } = require('./integrateBamboo');

class WorldGenerator extends events.EventEmitter {
  constructor(options = {}) {
    super();
    
    // ... existing initialization code
    
    // Initialize particle system
    this.particleSystem = new ParticleSystem();
    this.lastParticleUpdate = Date.now();
    
    // When a structure is generated, emit an event
    this.on('structureGenerated', (structure) => {
      console.log(`Structure generated: ${structure.type}`);
    });
    
    this.seed = options.seed || Math.floor(Math.random() * 2147483647);
    this.noiseGenerators = options.noiseGenerators || {};
    
    // Register structure generators
    this.structureGenerators = [];
    
    // Integrate bamboo generation
    integrateBambooGeneration(this);
  }
  
  // ... existing methods
  
  /**
   * Generate chunk data
   * @param {number} chunkX - Chunk X coordinate
   * @param {number} chunkZ - Chunk Z coordinate
   * @returns {Object} Generated chunk data
   */
  generateChunk(chunkX, chunkZ) {
    // Create chunk object
    const chunk = {
      x: chunkX,
      z: chunkZ,
      blocks: []
    };
    
    // Generate terrain
    this.generateTerrain(chunk);
    
    // Generate structures
    this.generateStructures(chunk, chunkX, chunkZ);
    
    // Generate ores
    this.generateOres(chunk);
    
    // Generate caves
    this.generateCaves(chunk);
    
    return chunk;
  }
  
  /**
   * Generate terrain for a chunk
   * @param {Object} chunk - The chunk to generate terrain for
   */
  generateTerrain(chunk) {
    // Placeholder for actual terrain generation logic
    console.log(`Generating terrain for chunk (${chunk.x}, ${chunk.z})`);
  }
  
  /**
   * Generate structures for a chunk
   * @param {Object} chunk - The chunk to generate structures for
   * @param {number} chunkX - Chunk X coordinate
   * @param {number} chunkZ - Chunk Z coordinate
   * @returns {Array} List of generated structures
   */
  generateStructures(chunk, chunkX, chunkZ) {
    const structures = [];
    
    // Run all structure generators
    for (const generator of this.structureGenerators) {
      const generated = generator.generate(chunk, chunkX, chunkZ, this.seed);
      if (generated) {
        structures.push(generated);
      }
    }
    
    return structures;
  }
  
  /**
   * Generate ores for a chunk
   * @param {Object} chunk - The chunk to generate ores for
   */
  generateOres(chunk) {
    // Placeholder for actual ore generation logic
    console.log(`Generating ores for chunk (${chunk.x}, ${chunk.z})`);
  }
  
  /**
   * Generate caves for a chunk
   * @param {Object} chunk - The chunk to generate caves for
   */
  generateCaves(chunk) {
    // Placeholder for actual cave generation logic
    console.log(`Generating caves for chunk (${chunk.x}, ${chunk.z})`);
  }
  
  /**
   * Get the biome for a chunk
   * @param {Object} chunk - The chunk to get the biome for
   * @returns {Object} The biome for this chunk
   */
  getBiomeForChunk(chunk) {
    // Placeholder for actual biome determination logic
    // For now, just return the default biome
    return BiomeRegistry.getDefaultBiome();
  }
  
  /**
   * Update particle effects in the world
   * @param {number} deltaTime - Time elapsed since last update in ms
   */
  updateParticles(deltaTime) {
    // Only update particles every 50ms to save performance
    const now = Date.now();
    if (now - this.lastParticleUpdate < 50) return;
    
    this.lastParticleUpdate = now;
    
    // Update existing particles
    this.particleSystem.update(this, deltaTime);
    
    // Check for blocks that emit particles
    const particleEmitterBlocks = [];
    
    // Get loaded chunks
    const loadedChunks = this.getLoadedChunks();
    
    for (const chunk of loadedChunks) {
      // Only check a subset of blocks each frame to distribute processing
      const randomOffset = Math.floor(Math.random() * 16);
      
      for (let x = 0; x < 16; x++) {
        const localX = (x + randomOffset) % 16;
        
        for (let z = 0; z < 16; z++) {
          const localZ = (z + randomOffset) % 16;
          
          // Only check certain Y levels each frame (distribute vertically)
          const yStart = Math.floor(Math.random() * 4) * 16;
          const yEnd = Math.min(yStart + 16, chunk.maxY);
          
          for (let y = yStart; y < yEnd; y++) {
            const block = chunk.getBlock(localX, y, localZ);
            
            if (block && (
                // Check for blocks that might emit particles
                block.type === 'spore_blossom' ||
                (block.type === 'cave_vine' && block.hasBerries) ||
                block.type === 'lava' ||
                block.type === 'campfire' ||
                block.type === 'soul_campfire' ||
                block.type === 'dripleaf'
            )) {
              // Get world position
              const worldX = chunk.x * 16 + localX;
              const worldZ = chunk.z * 16 + localZ;
              
              particleEmitterBlocks.push({
                block,
                position: {
                  x: worldX,
                  y,
                  z: worldZ
                }
              });
            }
          }
        }
      }
    }
    
    // Process a limited number of particle emitters per frame
    const maxEmittersPerFrame = 5;
    const emittersToProcess = particleEmitterBlocks.slice(0, maxEmittersPerFrame);
    
    for (const { block, position } of emittersToProcess) {
      // Call the block's update method to potentially emit particles
      block.update(this, position, { deltaTime });
    }
  }
  
  /**
   * Emit particles in the world
   * @param {Object} options - Particle options
   * @returns {number[]} Array of created particle IDs
   */
  emitParticles(options) {
    return this.particleSystem.emitParticles(options);
  }
  
  /**
   * Get particles for rendering
   * @param {Vector3} playerPosition - Player position for filtering
   * @param {number} viewDistance - View distance for filtering 
   * @returns {Object[]} Array of particle data objects
   */
  getParticlesForRendering(playerPosition, viewDistance) {
    if (!playerPosition) {
      return this.particleSystem.getParticlesForRendering();
    }
    
    return this.particleSystem.getParticlesInRange(playerPosition, viewDistance);
  }
  
  update(deltaTime) {
    // ... existing code ...
    
    // Update particles
    this.updateParticles(deltaTime);
    
    // ... existing code ...
  }
  
  // ... rest of the class
}

module.exports = WorldGenerator; 