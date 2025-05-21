const assert = require('assert');
const World = require('../world/world');
const BlockRegistry = require('../registry/blockRegistry');
const { EntityRegistry } = require('../entity/entityRegistry');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');

describe('World', () => {
  let world;
  let blockRegistry;

  beforeEach(() => {
    world = new World();
    blockRegistry = BlockRegistry.getInstance();
  });

  describe('Block Management', () => {
    it('should set and get blocks correctly', () => {
      const block = blockRegistry.get('stone');
      world.setBlock(0, 0, 0, block);
      assert.strictEqual(world.getBlock(0, 0, 0), block);
    });

    it('should set and get block states correctly', () => {
      const state = { powered: true };
      world.setBlockState(0, 0, 0, state);
      assert.deepStrictEqual(world.getBlockState(0, 0, 0), state);
    });

    it('should get blocks in region correctly', () => {
      const block1 = blockRegistry.get('stone');
      const block2 = blockRegistry.get('dirt');
      world.setBlock(0, 0, 0, block1);
      world.setBlock(1, 0, 0, block2);

      const blocks = world.getBlocksInRegion(0, 0, 0, 1, 0, 0);
      assert.strictEqual(blocks.length, 2);
      assert.strictEqual(blocks[0].block, block1);
      assert.strictEqual(blocks[1].block, block2);
    });
  });

  describe('Entity Management', () => {
    it('should add and get entities correctly', () => {
      const entity = { id: 'test-entity' };
      world.addEntity(entity);
      assert.strictEqual(world.getEntity('test-entity'), entity);
    });

    it('should remove entities correctly', () => {
      const entity = { id: 'test-entity' };
      world.addEntity(entity);
      world.removeEntity('test-entity');
      assert.strictEqual(world.getEntity('test-entity'), undefined);
    });
  });

  describe('Particle and Sound Effects', () => {
    it('should track particle effects correctly', () => {
      const particle = { type: 'portal', x: 0, y: 0, z: 0 };
      world.addParticleEffect(particle);
      assert.strictEqual(world.getParticleCount(), 1);
    });

    it('should track sound effects correctly', () => {
      const sound = { type: 'portal', x: 0, y: 0, z: 0 };
      world.playSound(sound);
      assert.strictEqual(world.getSoundCount(), 1);
    });
  });

  describe('Dimension Management', () => {
    it('should set and get dimension correctly', () => {
      world.setDimension('nether');
      assert.strictEqual(world.getDimension(), 'nether');
    });
  });

  describe('Bounds Checking', () => {
    it('should validate positions within bounds', () => {
      assert.strictEqual(world.isInBounds(0, 0, 0), true);
      assert.strictEqual(world.isInBounds(30000001, 0, 0), false);
      assert.strictEqual(world.isInBounds(0, 257, 0), false);
      assert.strictEqual(world.isInBounds(0, 0, 30000001), false);
    });
  });
});

class WorldTest {
  constructor() {
    this.world = new World();
  }

  runTests() {
    this.testBlockManagement();
    this.testBlockStates();
    this.testEntityManagement();
    this.testParticleEffects();
    this.testSoundEffects();
    this.testDimensionManagement();
    this.testTuffVariants();
  }

  testBlockManagement() {
    console.log('Testing block management...');
    
    const block = new TuffBricksBlock();
    
    // Test block placement
    this.world.setBlock(0, 0, 0, block);
    const retrievedBlock = this.world.getBlock(0, 0, 0);
    assert.strictEqual(retrievedBlock, block, 'Block not found after placement');
    
    // Test block removal
    this.world.setBlock(0, 0, 0, null);
    const removedBlock = this.world.getBlock(0, 0, 0);
    assert.strictEqual(removedBlock, null, 'Block not removed');
  }

  testBlockStates() {
    console.log('Testing block states...');
    
    const state = { facing: 'north', half: 'bottom' };
    
    // Test state setting
    this.world.setBlockState(0, 0, 0, state);
    const retrievedState = this.world.getBlockState(0, 0, 0);
    assert.deepStrictEqual(retrievedState, state, 'State not found after setting');
    
    // Test state removal
    this.world.setBlockState(0, 0, 0, null);
    const removedState = this.world.getBlockState(0, 0, 0);
    assert.strictEqual(removedState, null, 'State not removed');
  }

  testEntityManagement() {
    console.log('Testing entity management...');
    
    const entity = { id: 'test-entity', type: 'test' };
    
    // Test entity addition
    this.world.addEntity(entity);
    const retrievedEntity = this.world.getEntity('test-entity');
    assert.strictEqual(retrievedEntity, entity, 'Entity not found after addition');
    
    // Test entity removal
    this.world.removeEntity('test-entity');
    const removedEntity = this.world.getEntity('test-entity');
    assert.strictEqual(removedEntity, undefined, 'Entity not removed');
  }

  testParticleEffects() {
    console.log('Testing particle effects...');
    
    const effect = { type: 'block_break', x: 0, y: 0, z: 0 };
    
    // Test effect addition
    this.world.addParticleEffect(effect);
    assert.strictEqual(this.world.particleEffects.length, 1, 'Effect not added');
    assert.deepStrictEqual(this.world.particleEffects[0], effect, 'Effect not stored correctly');
  }

  testSoundEffects() {
    console.log('Testing sound effects...');
    
    const sound = { type: 'block_place', x: 0, y: 0, z: 0 };
    
    // Test sound addition
    this.world.playSound(sound);
    assert.strictEqual(this.world.soundEffects.length, 1, 'Sound not added');
    assert.deepStrictEqual(this.world.soundEffects[0], sound, 'Sound not stored correctly');
  }

  testDimensionManagement() {
    console.log('Testing dimension management...');
    
    // Test dimension setting
    this.world.setDimension('nether');
    assert.strictEqual(this.world.getDimension(), 'nether', 'Dimension not set correctly');
    
    // Test dimension change
    this.world.setDimension('overworld');
    assert.strictEqual(this.world.getDimension(), 'overworld', 'Dimension not changed correctly');
  }

  testTuffVariants() {
    console.log('Testing Tuff variants in world...');
    
    const variants = [
      new TuffBricksBlock(),
      new TuffBrickSlabBlock(),
      new TuffBrickStairsBlock(),
      new TuffBrickWallBlock(),
      new ChiseledTuffBlock()
    ];
    
    variants.forEach((variant, index) => {
      // Test block placement
      this.world.setBlock(index, 0, 0, variant);
      const retrievedBlock = this.world.getBlock(index, 0, 0);
      assert.strictEqual(retrievedBlock, variant, `Failed to place ${variant.constructor.name}`);
      
      // Test block state
      const state = { variant: index };
      this.world.setBlockState(index, 0, 0, state);
      const retrievedState = this.world.getBlockState(index, 0, 0);
      assert.deepStrictEqual(retrievedState, state, `Failed to set state for ${variant.constructor.name}`);
      
      // Test region retrieval
      const blocks = this.world.getBlocksInRegion(index, 0, 0, index, 0, 0);
      assert.strictEqual(blocks.length, 1, `Failed to retrieve ${variant.constructor.name} from region`);
      assert.strictEqual(blocks[0].block, variant, `Incorrect block retrieved for ${variant.constructor.name}`);
    });
  }
}

// Run tests
const test = new WorldTest();
test.runTests();
console.log('All world tests passed!');

module.exports = WorldTest; 