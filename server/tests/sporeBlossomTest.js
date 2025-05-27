/**
 * Tests for SporeBlossomBlock implementation
 */

// Dependencies
const assert = require('assert');
const SporeBlossomBlock = require('../blocks/sporeBlossomBlock');
const ParticleSystem = require('../particles/particleSystem');
const World = require('../world/world');

// Test world implementation
class TestWorld extends World {
  constructor() {
    super();
    this.droppedItems = [];
  }
  
  dropItem(item, position) {
    this.droppedItems.push({ item, position });
  }
  
  breakBlock(x, y, z, options = {}) {
    const block = this.getBlock(x, y, z);
    if (block) {
      this.blocks.delete(`${x},${y},${z}`);
      return true;
    }
    return false;
  }
}

// Test player implementation
class TestPlayer {
  constructor() {
    this.gameMode = 'survival';
  }
}

// Test suite
describe('SporeBlossomBlock', function() {
  let sporeBlossomBlock;
  let world;
  let player;
  
  beforeEach(function() {
    sporeBlossomBlock = new SporeBlossomBlock();
    world = new TestWorld();
    player = new TestPlayer();
    
    // Setup solid ceiling block
    world.setBlock(5, 6, 5, {
      type: 'stone',
      solid: true
    });
  });
  
  describe('Block Properties', function() {
    it('should have the correct block properties', function() {
      assert.strictEqual(sporeBlossomBlock.id, 'spore_blossom');
      assert.strictEqual(sporeBlossomBlock.name, 'Spore Blossom');
      assert.strictEqual(sporeBlossomBlock.hardness, 0.5);
      assert.strictEqual(sporeBlossomBlock.solid, false);
      assert.strictEqual(sporeBlossomBlock.transparent, true);
      assert.strictEqual(sporeBlossomBlock.requiresCeiling, true);
    });
    
    it('should have correct particle properties', function() {
      assert.strictEqual(sporeBlossomBlock.particleType, 'spore');
      assert.strictEqual(sporeBlossomBlock.particleColor, '#E5A9FF');
      assert.strictEqual(typeof sporeBlossomBlock.particleRate, 'number');
      assert.strictEqual(typeof sporeBlossomBlock.particleRange, 'number');
    });
    
    it('should have collision boxes that aren\'t full size', function() {
      const collisionBoxes = sporeBlossomBlock.getCollisionBoxes();
      
      // Should have at least one collision box
      assert.ok(collisionBoxes.length > 0);
      
      // Box should be smaller than a full block
      const box = collisionBoxes[0];
      assert.ok(box.minX > 0);
      assert.ok(box.minY >= 0);
      assert.ok(box.minZ > 0);
      assert.ok(box.maxX < 1);
      assert.ok(box.maxY < 1);
      assert.ok(box.maxZ < 1);
    });
  });
  
  describe('Placement Mechanics', function() {
    it('should only be placeable on the bottom of blocks', function() {
      // Should be placeable below a solid block
      assert.strictEqual(sporeBlossomBlock.canPlaceAt(world, { x: 5, y: 5, z: 5 }), true);
      
      // Should not be placeable without a block above
      assert.strictEqual(sporeBlossomBlock.canPlaceAt(world, { x: 5, y: 4, z: 5 }), false);
      
      // Should not be placeable beside a block
      assert.strictEqual(sporeBlossomBlock.canPlaceAt(world, { x: 6, y: 6, z: 5 }), false);
    });
    
    it('should be breakable and drop an item', function() {
      // Place the block
      world.setBlock(5, 5, 5, sporeBlossomBlock);
      
      // Break the block
      sporeBlossomBlock.onBreak(world, { x: 5, y: 5, z: 5 }, player);
      
      // Check for drops
      assert.strictEqual(world.droppedItems.length, 1);
      assert.strictEqual(world.droppedItems[0].item.id, 'spore_blossom');
    });
    
    it('should break when supporting block is removed', function() {
      // Place the block
      world.setBlock(5, 5, 5, sporeBlossomBlock);
      
      // Update the block after removing ceiling
      world.blocks.delete('5,6,5');
      sporeBlossomBlock.update(world, { x: 5, y: 5, z: 5 });
      
      // Block should be removed
      assert.strictEqual(world.getBlockAt(5, 5, 5), undefined);
    });
    
    it('should handle waterlogging correctly', function() {
      // Setup water block
      world.setBlock(5, 5, 5, { type: 'water' });
      
      // Place the block in water
      sporeBlossomBlock.onPlace(world, { x: 5, y: 5, z: 5 }, player);
      
      // Block should be waterlogged
      assert.strictEqual(sporeBlossomBlock.isWaterlogged, true);
      
      // Breaking should leave water
      world.setBlock(5, 5, 5, sporeBlossomBlock);
      sporeBlossomBlock.onBreak(world, { x: 5, y: 5, z: 5 }, player);
      
      // Should have water block remaining
      const blockAfterBreak = world.getBlockAt(5, 5, 5);
      assert.strictEqual(blockAfterBreak?.type, 'water');
    });
  });
  
  describe('Particle Emission', function() {
    it('should emit particles during update', function() {
      // Place the block
      world.setBlock(5, 5, 5, sporeBlossomBlock);
      
      // Force last particle time to be long ago
      sporeBlossomBlock.lastParticleTime = 0;
      
      // Update the block
      sporeBlossomBlock.update(world, { x: 5, y: 5, z: 5 });
      
      // Should have emitted particles
      const particles = world.getParticles();
      assert.strictEqual(particles.length, 1);
      assert.strictEqual(particles[0].type, 'spore');
      assert.strictEqual(particles[0].color, sporeBlossomBlock.particleColor);
    });
    
    it('should emit the correct number of particles', function() {
      // Place the block
      world.setBlock(5, 5, 5, sporeBlossomBlock);
      
      // Force last particle time to be long ago
      sporeBlossomBlock.lastParticleTime = 0;
      
      // Update the block
      sporeBlossomBlock.update(world, { x: 5, y: 5, z: 5 });
      
      // Should have the specified particle count
      const particles = world.getParticles();
      assert.strictEqual(particles[0].count, sporeBlossomBlock.particleCount);
    });
    
    it('should respect particle rate limiting', function() {
      // Place the block
      world.setBlock(5, 5, 5, sporeBlossomBlock);
      
      // Set last particle time to now
      sporeBlossomBlock.lastParticleTime = Date.now();
      
      // Update the block
      sporeBlossomBlock.update(world, { x: 5, y: 5, z: 5 });
      
      // Should not have emitted particles yet
      const particles = world.getParticles();
      assert.strictEqual(particles.length, 0);
    });
    
    it('should emit particles from the correct position', function() {
      // Place the block
      world.setBlock(5, 5, 5, sporeBlossomBlock);
      
      // Force last particle time to be long ago
      sporeBlossomBlock.lastParticleTime = 0;
      
      // Update the block
      sporeBlossomBlock.update(world, { x: 5, y: 5, z: 5 });
      
      // Should emit from slightly below the block center
      const particles = world.getParticles();
      const emitPos = particles[0].position;
      assert.strictEqual(emitPos.x, 5.5); // center X
      assert.strictEqual(emitPos.y, 4.8); // slightly below bottom (5.0 - 0.2)
      assert.strictEqual(emitPos.z, 5.5); // center Z
    });
  });
  
  describe('Serialization', function() {
    it('should correctly serialize to JSON', function() {
      // Create block with waterlogging
      const waterloggedBlock = new SporeBlossomBlock({ isWaterlogged: true });
      
      // Serialize
      const json = waterloggedBlock.toJSON();
      
      // Check serialized data
      assert.strictEqual(json.id, 'spore_blossom');
      assert.strictEqual(json.isWaterlogged, true);
    });
    
    it('should correctly deserialize from JSON', function() {
      // Create JSON data
      const data = {
        id: 'spore_blossom',
        isWaterlogged: true
      };
      
      // Deserialize
      const deserializedBlock = SporeBlossomBlock.fromJSON(data);
      
      // Check deserialized block
      assert.strictEqual(deserializedBlock.id, 'spore_blossom');
      assert.strictEqual(deserializedBlock.isWaterlogged, true);
    });
  });
});

// Run the tests
if (require.main === module) {
  describe('Running Spore Blossom Tests', function() {
    this.timeout(5000);
    
    before(function() {
      console.log('Starting Spore Blossom tests...');
    });
    
    require('mocha').run();
    
    after(function() {
      console.log('Spore Blossom tests completed.');
    });
  });
} 