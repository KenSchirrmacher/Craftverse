/**
 * Tests for the Sculk Vein block implementation
 */

const assert = require('assert');
const SculkVeinBlock = require('../blocks/sculkVeinBlock');

describe('SculkVeinBlock', () => {
  let veinBlock;
  let mockWorld;
  let mockPlayer;
  
  beforeEach(() => {
    // Create a mock world
    mockWorld = {
      blocks: new Map(),
      getBlock: function(x, y, z) {
        const key = `${x},${y},${z}`;
        return this.blocks.get(key);
      },
      setBlock: function(x, y, z, block) {
        const key = `${x},${y},${z}`;
        this.blocks.set(key, block);
        // Set position properties on the block
        if (block && typeof block === 'object') {
          block.x = x;
          block.y = y;
          block.z = z;
        }
      },
      removeBlock: function(position) {
        const key = `${position.x},${position.y},${position.z}`;
        this.blocks.delete(key);
      },
      dropItem: function(item, position) {
        this.drops = this.drops || [];
        this.drops.push({ item, position });
      },
      addExperience: function(amount, position) {
        this.experience = this.experience || [];
        this.experience.push({ amount, position });
      }
    };
    
    // Create mock blocks for world
    // Solid blocks around the center position
    mockWorld.blocks.set('50,49,50', { id: 'stone', solid: true });
    mockWorld.blocks.set('50,51,50', { id: 'stone', solid: true });
    mockWorld.blocks.set('49,50,50', { id: 'stone', solid: true });
    mockWorld.blocks.set('51,50,50', { id: 'stone', solid: true });
    mockWorld.blocks.set('50,50,49', { id: 'stone', solid: true });
    mockWorld.blocks.set('50,50,51', { id: 'stone', solid: true });
    
    // Add a sculk catalyst
    mockWorld.blocks.set('55,50,55', { id: 'sculk_catalyst', solid: true });
    
    // Create a mock player
    mockPlayer = {
      id: 'player_1',
      type: 'player',
      gameMode: 'survival',
      inventory: [],
      getEquippedItem: function() {
        return this.equippedItem;
      }
    };
    
    // Create a sculk vein block
    veinBlock = new SculkVeinBlock();
    
    // Set position
    veinBlock.x = 50;
    veinBlock.y = 50;
    veinBlock.z = 50;
  });
  
  describe('Basic properties', () => {
    it('should have correct identification values', () => {
      assert.strictEqual(veinBlock.id, 'sculk_vein');
      assert.strictEqual(veinBlock.name, 'Sculk Vein');
    });
    
    it('should have appropriate hardness and resistance', () => {
      assert.strictEqual(veinBlock.hardness, 0.2);
      assert.strictEqual(veinBlock.resistance, 0.2);
    });
    
    it('should be transparent with no collision', () => {
      assert.strictEqual(veinBlock.transparent, true);
      assert.strictEqual(veinBlock.getCollisionShape(), null);
    });
  });
  
  describe('Face management', () => {
    it('should initialize with no faces by default', () => {
      const fresh = new SculkVeinBlock();
      assert.strictEqual(fresh.hasAnyFaces(), false);
      assert.strictEqual(fresh.getFaceCount(), 0);
    });
    
    it('should correctly add and remove faces', () => {
      const vein = new SculkVeinBlock();
      
      // Add multiple faces
      vein.addFace('up');
      vein.addFace('down');
      
      assert.strictEqual(vein.isOnFace('up'), true);
      assert.strictEqual(vein.isOnFace('down'), true);
      assert.strictEqual(vein.isOnFace('north'), false);
      assert.strictEqual(vein.getFaceCount(), 2);
      
      // Remove a face
      vein.removeFace('up');
      
      assert.strictEqual(vein.isOnFace('up'), false);
      assert.strictEqual(vein.isOnFace('down'), true);
      assert.strictEqual(vein.getFaceCount(), 1);
    });
    
    it('should detect when it has any faces', () => {
      const vein = new SculkVeinBlock();
      
      assert.strictEqual(vein.hasAnyFaces(), false);
      
      vein.addFace('east');
      
      assert.strictEqual(vein.hasAnyFaces(), true);
    });
    
    it('should correctly set all faces at once', () => {
      const vein = new SculkVeinBlock();
      
      vein.setFaces({
        up: true,
        down: true,
        north: false,
        south: false,
        east: true,
        west: false
      });
      
      assert.strictEqual(vein.isOnFace('up'), true);
      assert.strictEqual(vein.isOnFace('down'), true);
      assert.strictEqual(vein.isOnFace('north'), false);
      assert.strictEqual(vein.isOnFace('south'), false);
      assert.strictEqual(vein.isOnFace('east'), true);
      assert.strictEqual(vein.isOnFace('west'), false);
      assert.strictEqual(vein.getFaceCount(), 3);
    });
  });
  
  describe('Block placement', () => {
    it('should update faces based on adjacent blocks', () => {
      // Place the vein with adjacent solid blocks
      veinBlock.updateFaces(mockWorld, { x: 50, y: 50, z: 50 });
      
      // Should be on all six faces since we have solid blocks all around
      assert.strictEqual(veinBlock.getFaceCount(), 6);
      assert.strictEqual(veinBlock.isOnFace('up'), true);
      assert.strictEqual(veinBlock.isOnFace('down'), true);
      assert.strictEqual(veinBlock.isOnFace('north'), true);
      assert.strictEqual(veinBlock.isOnFace('south'), true);
      assert.strictEqual(veinBlock.isOnFace('east'), true);
      assert.strictEqual(veinBlock.isOnFace('west'), true);
    });
    
    it('should initialize faces on placement', () => {
      // Place block in a position with only one adjacent solid block
      mockWorld.blocks.clear();
      mockWorld.blocks.set('50,49,50', { id: 'stone', solid: true }); // Only block below is solid
      
      const result = veinBlock.onPlace(mockWorld, { x: 50, y: 50, z: 50 });
      
      assert.strictEqual(result, true, 'Placement should succeed');
      assert.strictEqual(veinBlock.isOnFace('down'), true, 'Should attach to block below');
      assert.strictEqual(veinBlock.getFaceCount(), 1, 'Should only have one face');
    });
    
    it('should not place if no valid attachment faces', () => {
      // No adjacent solid blocks
      mockWorld.blocks.clear();
      
      const result = veinBlock.onPlace(mockWorld, { x: 50, y: 50, z: 50 });
      
      assert.strictEqual(result, false, 'Placement should fail without solid neighbors');
    });
  });
  
  describe('Update behavior', () => {
    it('should be removed if it has no faces', () => {
      // Place a vein with only one attachment
      mockWorld.blocks.clear();
      mockWorld.blocks.set('50,49,50', { id: 'stone', solid: true }); // Only block below is solid
      
      veinBlock.onPlace(mockWorld, { x: 50, y: 50, z: 50 });
      assert.strictEqual(veinBlock.isOnFace('down'), true);
      
      // Now remove the supporting block
      mockWorld.blocks.delete('50,49,50');
      
      // Update should remove the vein
      veinBlock.update(mockWorld, { x: 50, y: 50, z: 50 }, 0);
      
      // Check if the block was removed
      const key = '50,50,50';
      assert.strictEqual(mockWorld.blocks.has(key), false, 'Vein should be removed');
    });
  });
  
  describe('Sculk spreading', () => {
    it('should attempt to spread at intervals', () => {
      // Mock spread success to track attempts
      let spreadAttempts = 0;
      const originalSpread = veinBlock.attemptSpread;
      veinBlock.attemptSpread = function(world, position) {
        spreadAttempts++;
      };
      
      // Initial update should not attempt spread
      veinBlock.update(mockWorld, { x: 50, y: 50, z: 50 }, 0);
      assert.strictEqual(spreadAttempts, 0, 'Should not spread on first update');
      
      // Update past interval should attempt spread
      veinBlock.update(mockWorld, { x: 50, y: 50, z: 50 }, 201);
      assert.strictEqual(spreadAttempts, 1, 'Should spread after interval');
      
      // Update soon after should not attempt again
      veinBlock.update(mockWorld, { x: 50, y: 50, z: 50 }, 202);
      assert.strictEqual(spreadAttempts, 1, 'Should not spread before next interval');
      
      // Restore original method
      veinBlock.attemptSpread = originalSpread;
    });
    
    it('should check for catalyst influence before spreading', () => {
      // Track influence checks and spread attempts
      let influenceChecked = false;
      let spreadAttempted = false;
      
      const originalInfluence = veinBlock.isInCatalystInfluence;
      const originalSpread = veinBlock.attemptSpread;
      
      // Since we're in a test environment, let's make this simpler
      veinBlock.isInCatalystInfluence = function(world, position) {
        influenceChecked = true;
        return true; // Testing mode always allows influence
      };
      
      veinBlock.attemptSpread = function(world, position) {
        spreadAttempted = true;
      };
      
      // Force update past interval
      veinBlock.lastUpdateTime = 0;
      veinBlock.update(mockWorld, { x: 50, y: 50, z: 50 }, 201);
      
      assert.strictEqual(influenceChecked, true, 'Should check for catalyst influence');
      assert.strictEqual(spreadAttempted, true, 'Should attempt spread with catalyst influence');
      
      // Now mock no influence and try again
      spreadAttempted = false; // Reset tracking
      veinBlock.lastUpdateTime = 0; // Reset update time
      
      veinBlock.isInCatalystInfluence = function(world, position) {
        influenceChecked = true;
        return false; // No influence this time
      };
      
      veinBlock.update(mockWorld, { x: 50, y: 50, z: 50 }, 402);
      
      assert.strictEqual(spreadAttempted, false, 'Should not attempt spread without catalyst influence');
      
      // Restore original methods
      veinBlock.isInCatalystInfluence = originalInfluence;
      veinBlock.attemptSpread = originalSpread;
    });
  });
  
  describe('Block drop mechanics', () => {
    it('should drop nothing by default', () => {
      mockPlayer.equippedItem = {
        type: 'diamond_pickaxe',
        enchantments: {}
      };
      
      // Break the block
      veinBlock.onBreak(mockWorld, { x: 50, y: 50, z: 50 }, mockPlayer);
      
      assert.strictEqual(!mockWorld.drops || mockWorld.drops.length === 0, true, 'Should not drop items normally');
    });
    
    it('should drop with silk touch', () => {
      mockPlayer.equippedItem = {
        type: 'diamond_pickaxe',
        enchantments: { silkTouch: 1 }
      };
      
      // Break the block
      veinBlock.onBreak(mockWorld, { x: 50, y: 50, z: 50 }, mockPlayer);
      
      assert.ok(mockWorld.drops && mockWorld.drops.length === 1, 'Should drop one item with silk touch');
      assert.strictEqual(mockWorld.drops[0].item.id, 'sculk_vein', 'Should drop a sculk vein');
    });
    
    it('should have a chance to drop XP without silk touch', () => {
      mockPlayer.equippedItem = {
        type: 'diamond_pickaxe',
        enchantments: {}
      };
      
      // Mock random to always drop XP
      const originalRandom = Math.random;
      Math.random = () => 0.05; // Below 0.1 threshold
      
      // Break the block
      veinBlock.onBreak(mockWorld, { x: 50, y: 50, z: 50 }, mockPlayer);
      
      assert.ok(mockWorld.experience && mockWorld.experience.length === 1, 'Should drop XP');
      assert.strictEqual(mockWorld.experience[0].amount, 1, 'Should drop 1 XP');
      
      // Restore original Math.random
      Math.random = originalRandom;
    });
  });
  
  describe('Serialization', () => {
    it('should properly serialize state', () => {
      // Set some state
      veinBlock.faces = {
        up: true,
        down: true,
        north: false,
        south: false,
        east: true,
        west: false
      };
      veinBlock.canSpread = true;
      veinBlock.lastUpdateTime = 150;
      
      // Serialize
      const data = veinBlock.toJSON();
      
      // Verify
      assert.deepStrictEqual(data.faces, veinBlock.faces);
      assert.strictEqual(data.canSpread, true);
      assert.strictEqual(data.lastUpdateTime, 150);
    });
    
    it('should properly deserialize state', () => {
      // Prepare data
      const data = {
        id: 'sculk_vein',
        faces: {
          up: true,
          down: false,
          north: true,
          south: false,
          east: false,
          west: true
        },
        canSpread: false,
        lastUpdateTime: 350
      };
      
      // Deserialize
      const block = SculkVeinBlock.fromJSON(data);
      
      // Verify
      assert.strictEqual(block.id, 'sculk_vein');
      assert.deepStrictEqual(block.faces, data.faces);
      assert.strictEqual(block.canSpread, false);
      assert.strictEqual(block.lastUpdateTime, 350);
    });
  });
}); 