/**
 * Tests for Mangrove Swamp biome and related blocks for the Wild Update
 */

const assert = require('assert');
const MangroveSwampBiome = require('../biomes/mangroveSwampBiome');
const MudBlock = require('../blocks/mudBlock');
const PackedMudBlock = require('../blocks/packedMudBlock');
const MudBricksBlock = require('../blocks/mudBricksBlock');
const BiomeRegistry = require('../biomes/biomeRegistry');
const BlockRegistry = require('../blocks/blockRegistry');

describe('Mangrove Swamp - Wild Update', () => {
  // Mock objects used across tests
  let mockWorld;
  let mockPlayer;
  let mockEntity;
  let mockStatusEffectsManager;
  
  beforeEach(() => {
    // Create mock status effects manager
    mockStatusEffectsManager = {
      addedEffects: {},
      addEffect(entityId, effectType, options) {
        if (!this.addedEffects[entityId]) {
          this.addedEffects[entityId] = {};
        }
        this.addedEffects[entityId][effectType] = options;
        return true;
      },
      hasEffect(entityId, effectType) {
        return this.addedEffects[entityId] && 
               this.addedEffects[entityId][effectType] !== undefined;
      },
      getEffectLevel(entityId, effectType) {
        if (!this.hasEffect(entityId, effectType)) return -1;
        return this.addedEffects[entityId][effectType].level || 0;
      },
      removeEffect(entityId, effectType) {
        if (this.addedEffects[entityId]) {
          delete this.addedEffects[entityId][effectType];
        }
      },
      clearEffects(entityId) {
        delete this.addedEffects[entityId];
      }
    };
    
    // Mock world
    mockWorld = {
      blocksSet: {},
      particlesAdded: [],
      soundsPlayed: [],
      statusEffectsManager: mockStatusEffectsManager,
      
      setBlock(position, blockType) {
        const key = `${position.x},${position.y},${position.z}`;
        this.blocksSet[key] = blockType;
      },
      
      getBlockAt(x, y, z) {
        const key = `${x},${y},${z}`;
        return this.blocksSet[key] || 'air';
      },
      
      getWaterDepth(x, z) {
        // Mock implementation that returns depth of water
        // For testing, hardcode some values
        if (x < 10 && z < 10) return 1; // Shallow water
        return 3; // Deep water
      },
      
      addParticle(particleData) {
        this.particlesAdded.push(particleData);
      },
      
      playSound(sound, position, volume, pitch) {
        this.soundsPlayed.push({ sound, position, volume, pitch });
      },
      
      dropItem(item, position) {
        // Not needed for these tests
      }
    };
    
    // Mock player
    mockPlayer = {
      id: 'player1',
      type: 'player',
      position: { x: 5, y: 5, z: 5 },
      inventory: [],
      
      getHeldItem() {
        return this.heldItem;
      },
      
      setHeldItem(item) {
        this.heldItem = item;
      },
      
      addItem(item) {
        this.inventory.push(item);
      },
      
      removeHeldItem(count) {
        this.heldItem = null;
      },
      
      damageHeldItem(amount) {
        if (this.heldItem && this.heldItem.durability) {
          this.heldItem.durability -= amount;
        }
      }
    };
    
    // Mock entity
    mockEntity = {
      id: 'entity1',
      type: 'mob',
      position: { x: 5, y: 5, z: 5 },
      isOnGround: true,
      isInWater: false
    };
  });
  
  describe('MangroveSwampBiome', () => {
    let biome;
    
    beforeEach(() => {
      biome = new MangroveSwampBiome();
    });
    
    it('should have the correct properties', () => {
      assert.strictEqual(biome.id, 'mangrove_swamp');
      assert.strictEqual(biome.name, 'Mangrove Swamp');
      assert.ok(biome.temperature > 0.7, 'Should be a warm biome');
      assert.ok(biome.precipitation > 0.8, 'Should be a very wet biome');
      assert.ok(biome.fogDensity > 0, 'Should have fog');
      assert.ok(biome.hasMangroves, 'Should have mangroves');
      assert.ok(biome.hasMudBlocks, 'Should have mud blocks');
      assert.ok(biome.hasFrogs, 'Should have frogs');
    });
    
    it('should generate appropriate terrain heights', () => {
      // Test with consistent inputs for reproducible results
      const height1 = biome.getHeightAt(100, 100, 0.5);
      const height2 = biome.getHeightAt(100, 150, 0.5);
      const height3 = biome.getHeightAt(150, 100, 0.5);
      
      // Heights should be relatively low and not vary too much (swamp terrain)
      assert.ok(height1 >= 0.1 && height1 <= 0.3, 'Height should be in low range');
      assert.ok(height2 >= 0.1 && height2 <= 0.3, 'Height should be in low range');
      assert.ok(height3 >= 0.1 && height3 <= 0.3, 'Height should be in low range');
      
      // Check for water pool creation (depressions)
      const poolHeight = biome.getHeightAt(125, 125, 0.5); // Position that may create a pool
      assert.ok(Math.abs(poolHeight - height1) <= 0.2, 'Pool heights should not vary too dramatically');
    });
    
    it('should provide appropriate surface blocks', () => {
      // Test various depths and conditions
      const aboveWaterSurface = biome.getSurfaceBlock(10, 65, 10, 0, false);
      const underwaterSurface = biome.getSurfaceBlock(10, 60, 10, 0, true);
      const belowSurface = biome.getSurfaceBlock(10, 64, 10, 2, false);
      
      // Surface blocks should be either mud or grass/dirt
      assert.ok(['mud', 'grass'].includes(aboveWaterSurface), 'Surface should be mud or grass');
      assert.strictEqual(underwaterSurface, 'mud', 'Underwater surface should be mud');
      assert.ok(['mud', 'dirt'].includes(belowSurface), 'Below surface should be mud or dirt');
    });
    
    it('should generate appropriate features', () => {
      // Using fixed seed for consistent results
      const random = () => 0.1; // 10% chance, should trigger the first check
      
      const features = biome.getFeaturesAt(100, 100, random);
      
      // Should include mangrove trees
      assert.ok(features.some(f => f.type === 'tree' && f.variant === 'mangrove'), 
        'Should generate mangrove trees');
        
      // Test with another random chance
      const random2 = () => 0.25; // Should trigger the second but not first check
      const features2 = biome.getFeaturesAt(100, 100, random2);
      
      // Should include mangrove roots
      assert.ok(features2.some(f => f.type === 'mangrove_roots'), 
        'Should generate mangrove roots');
    });
    
    it('should apply slowness effect on mud', () => {
      // Set up world with mud under entity
      mockWorld.setBlock({ x: 5, y: 4, z: 5 }, 'mud');
      
      // Apply biome effects to entity
      const effects = biome.applyEntityEffects(mockEntity, 100, mockWorld);
      
      // Should apply slowness
      assert.ok(effects.slowness, 'Should apply slowness effect on mud');
      assert.ok(
        mockStatusEffectsManager.hasEffect(mockEntity.id, 'SLOWNESS'),
        'Status effect manager should have added slowness effect'
      );
    });
    
    it('should be registered in the BiomeRegistry', () => {
      const registeredBiome = BiomeRegistry.getBiome('mangrove_swamp');
      assert.ok(registeredBiome, 'Biome should be registered');
      assert.strictEqual(registeredBiome.id, 'mangrove_swamp');
    });
    
    it('should appear in swamp terrain type list', () => {
      const swampBiomes = BiomeRegistry.getBiomesByTerrainType('swamp');
      assert.ok(swampBiomes.some(b => b.id === 'mangrove_swamp'), 
        'Mangrove swamp should be in swamp terrain type list');
    });
  });
  
  describe('MudBlock', () => {
    let mudBlock;
    
    beforeEach(() => {
      mudBlock = new MudBlock();
    });
    
    it('should have the correct properties', () => {
      assert.strictEqual(mudBlock.id, 'mud');
      assert.strictEqual(mudBlock.name, 'Mud Block');
      assert.strictEqual(mudBlock.hardness, 0.5, 'Should be relatively soft');
      assert.ok(mudBlock.slipperiness > 0.6, 'Should be slippery');
      assert.ok(mudBlock.slownessFactor < 1.0, 'Should slow movement');
    });
    
    it('should be registered in the BlockRegistry', () => {
      const registeredBlock = BlockRegistry.getBlock('mud');
      assert.ok(registeredBlock, 'Block should be registered');
      assert.strictEqual(registeredBlock.id, 'mud');
    });
    
    it('should apply slowness effect on collision', () => {
      mudBlock.onEntityCollision(mockWorld, { x: 5, y: 5, z: 5 }, mockEntity);
      
      assert.ok(
        mockStatusEffectsManager.hasEffect(mockEntity.id, 'SLOWNESS'),
        'Should apply slowness effect on collision'
      );
    });
    
    it('should be faster to mine with a shovel', () => {
      const noToolTime = mudBlock.getMiningTime(mockPlayer, {});
      
      // With shovel
      mockPlayer.setHeldItem({
        type: 'shovel',
        efficiency: 2.0
      });
      
      const shovelTime = mudBlock.getMiningTime(mockPlayer, { tool: mockPlayer.getHeldItem() });
      
      assert.ok(shovelTime < noToolTime, 'Mining time should be less with shovel');
    });
    
    it('should interact with water bottle', () => {
      // Player holds water bottle
      mockPlayer.setHeldItem({
        id: 'water_bottle',
        type: 'bottle'
      });
      
      const result = mudBlock.onInteract(mockWorld, { x: 5, y: 5, z: 5 }, mockPlayer, {});
      
      assert.strictEqual(result, true, 'Interaction should be handled');
      assert.ok(mockWorld.particlesAdded.length > 0, 'Should create particles');
      assert.ok(mockWorld.soundsPlayed.length > 0, 'Should play sound');
      assert.ok(mockPlayer.inventory.some(item => item.id === 'glass_bottle'), 'Should give back glass bottle');
    });
    
    it('should interact with shovel', () => {
      // Player holds shovel
      mockPlayer.setHeldItem({
        id: 'iron_shovel',
        type: 'shovel',
        durability: 100
      });
      
      const result = mudBlock.onInteract(mockWorld, { x: 5, y: 5, z: 5 }, mockPlayer, {});
      
      assert.strictEqual(result, true, 'Interaction should be handled');
      assert.strictEqual(mockWorld.blocksSet['5,5,5'], 'dirt_path', 'Should convert to path');
      assert.ok(mockWorld.soundsPlayed.length > 0, 'Should play sound');
    });
  });
  
  describe('PackedMudBlock', () => {
    let packedMudBlock;
    
    beforeEach(() => {
      packedMudBlock = new PackedMudBlock();
    });
    
    it('should have the correct properties', () => {
      assert.strictEqual(packedMudBlock.id, 'packed_mud');
      assert.strictEqual(packedMudBlock.name, 'Packed Mud');
      assert.ok(packedMudBlock.hardness > 0.5, 'Should be harder than mud');
      assert.ok(packedMudBlock.resistance > 1.0, 'Should be blast resistant');
    });
    
    it('should be registered in the BlockRegistry', () => {
      const registeredBlock = BlockRegistry.getBlock('packed_mud');
      assert.ok(registeredBlock, 'Block should be registered');
      assert.strictEqual(registeredBlock.id, 'packed_mud');
    });
    
    it('should convert to mud when interacting with water bottle', () => {
      // Player holds water bottle
      mockPlayer.setHeldItem({
        id: 'water_bottle',
        type: 'bottle'
      });
      
      const result = packedMudBlock.onInteract(mockWorld, { x: 5, y: 5, z: 5 }, mockPlayer, {});
      
      assert.strictEqual(result, true, 'Interaction should be handled');
      assert.strictEqual(mockWorld.blocksSet['5,5,5'], 'mud', 'Should convert to mud');
      assert.ok(mockWorld.particlesAdded.length > 0, 'Should create particles');
      assert.ok(mockWorld.soundsPlayed.length > 0, 'Should play sound');
    });
    
    it('should check for water block updates', () => {
      // Test with water neighbor
      packedMudBlock.onNeighborUpdate(
        mockWorld, 
        { x: 5, y: 5, z: 5 }, 
        { x: 5, y: 5, z: 6 }
      );
      
      // Set the neighbor to water to test conversion
      mockWorld.setBlock({ x: 5, y: 5, z: 6 }, 'water');
      
      // Run multiple times since there's a random chance
      let converted = false;
      for (let i = 0; i < 20; i++) {
        packedMudBlock.onNeighborUpdate(
          mockWorld, 
          { x: 5, y: 5, z: 5 }, 
          { x: 5, y: 5, z: 6 }
        );
        
        if (mockWorld.blocksSet['5,5,5'] === 'mud') {
          converted = true;
          break;
        }
      }
      
      assert.ok(converted, 'Should eventually convert to mud with water neighbor');
    });
  });
  
  describe('MudBricksBlock', () => {
    let mudBricksBlock;
    
    beforeEach(() => {
      mudBricksBlock = new MudBricksBlock();
    });
    
    it('should have the correct properties', () => {
      assert.strictEqual(mudBricksBlock.id, 'mud_bricks');
      assert.strictEqual(mudBricksBlock.name, 'Mud Bricks');
      assert.ok(mudBricksBlock.hardness > 1.0, 'Should be harder than packed mud');
      assert.ok(mudBricksBlock.resistance > 3.0, 'Should have good blast resistance');
      assert.strictEqual(mudBricksBlock.preferredTool, 'pickaxe', 'Pickaxe should be preferred tool');
    });
    
    it('should be registered in the BlockRegistry', () => {
      const registeredBlock = BlockRegistry.getBlock('mud_bricks');
      assert.ok(registeredBlock, 'Block should be registered');
      assert.strictEqual(registeredBlock.id, 'mud_bricks');
    });
    
    it('should be faster to mine with a pickaxe', () => {
      const noToolTime = mudBricksBlock.getMiningTime(mockPlayer, {});
      
      // With non-preferred tool (shovel)
      mockPlayer.setHeldItem({
        type: 'shovel',
        efficiency: 2.0
      });
      
      const shovelTime = mudBricksBlock.getMiningTime(
        mockPlayer, 
        { tool: mockPlayer.getHeldItem() }
      );
      
      // With preferred tool (pickaxe)
      mockPlayer.setHeldItem({
        type: 'pickaxe',
        efficiency: 2.0
      });
      
      const pickaxeTime = mudBricksBlock.getMiningTime(
        mockPlayer, 
        { tool: mockPlayer.getHeldItem() }
      );
      
      assert.ok(shovelTime < noToolTime, 'Mining time should be less with any tool');
      assert.ok(pickaxeTime < shovelTime, 'Mining time should be less with preferred tool');
    });
    
    it('should check for correct tool type', () => {
      // Test with wrong tool
      const wrongTool = { type: 'shovel' };
      assert.strictEqual(
        mudBricksBlock.isCorrectTool(wrongTool),
        false,
        'Shovel should not be correct tool'
      );
      
      // Test with correct tool
      const correctTool = { type: 'pickaxe' };
      assert.strictEqual(
        mudBricksBlock.isCorrectTool(correctTool),
        true,
        'Pickaxe should be correct tool'
      );
    });
  });
}); 