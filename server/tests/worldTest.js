const assert = require('assert');
const { World } = require('../world/World');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');

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