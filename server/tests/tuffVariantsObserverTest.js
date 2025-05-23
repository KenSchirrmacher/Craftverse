const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBrickStairsBlock } = require('../blocks/tuffVariants');
const ObserverManager = require('../systems/observerManager');
const { blockRegistry } = require('../blocks/blockRegistry');

class TuffVariantsObserverTest {
  constructor() {
    this.world = new TestWorld();
    this.observerManager = new ObserverManager();
    this.testCount = 0;
    this.passedCount = 0;
    
    // Initialize block registry
    blockRegistry.registerDefaultBlocks();
  }

  runTests() {
    console.log('\n=== Running Tuff Variants Observer Tests ===\n');
    
    try {
      this.testObserverStateChange();
      this.testObserverCooldown();
      this.testObserverFacing();
      this.testObserverMultipleBlocks();
      this.testObserverStatePersistence();
      this.testObserverBlockRemoval();
      this.testObserverBlockReplacement();
      this.testObserverStateValidation();
      
      console.log(`\nTest Summary: ${this.passedCount}/${this.testCount} tests passed`);
      if (this.passedCount === this.testCount) {
        console.log('\nAll Tuff variants observer tests passed successfully!');
      } else {
        throw new Error(`Failed ${this.testCount - this.passedCount} tests`);
      }
    } catch (error) {
      console.error('\nTest failed:', error.message);
      process.exit(1);
    }
  }

  runTest(name, testFn) {
    this.testCount++;
    console.log(`\nRunning test: ${name}`);
    try {
      testFn();
      this.passedCount++;
      console.log(`✓ ${name} passed`);
    } catch (error) {
      console.error(`✗ ${name} failed:`, error.message);
      throw error;
    }
  }

  testObserverStateChange() {
    this.runTest('Observer State Change Detection', () => {
      console.log('  Creating and placing stairs block...');
      const stairs = new TuffBrickStairsBlock();
      this.world.setBlock(0, 0, 0, stairs);
      const placedStairs = this.world.getBlock(0, 0, 0);
      
      console.log('  Creating observer facing the stairs...');
      const observer = this.observerManager.createObserver({ x: 0, y: 0, z: 1 });
      this.observerManager.faceBlock(observer, placedStairs);
      
      console.log('  Checking initial state...');
      assert.strictEqual(observer.lastState, null, 'Observer should start with null state');
      
      console.log('  Updating block state...');
      placedStairs.setState('facing', 'north');
      this.observerManager.updateBlockState(placedStairs);
      
      console.log('  Verifying state change detection...');
      const detected = this.observerManager.checkDetection(observer);
      assert.strictEqual(detected, true, 'Observer should detect state change');
      
      console.log('  Verifying state update...');
      assert.notStrictEqual(observer.lastState, null, 'Observer state should be updated');
    });
  }

  testObserverCooldown() {
    this.runTest('Observer Cooldown', () => {
      console.log('  Creating and placing stairs block...');
      const stairs = new TuffBrickStairsBlock();
      this.world.setBlock(0, 0, 0, stairs);
      const placedStairs = this.world.getBlock(0, 0, 0);
      
      console.log('  Creating observer facing the stairs...');
      const observer = this.observerManager.createObserver({ x: 0, y: 0, z: 1 });
      this.observerManager.faceBlock(observer, placedStairs);
      
      console.log('  Testing first state change...');
      placedStairs.setState('facing', 'north');
      this.observerManager.updateBlockState(placedStairs);
      const firstDetection = this.observerManager.checkDetection(observer);
      assert.strictEqual(firstDetection, true, 'First state change should be detected');
      
      console.log('  Testing state change during cooldown...');
      placedStairs.setState('facing', 'south');
      this.observerManager.updateBlockState(placedStairs);
      const secondDetection = this.observerManager.checkDetection(observer);
      assert.strictEqual(secondDetection, false, 'State change during cooldown should not be detected');
      
      console.log('  Testing state change after cooldown...');
      observer.cooldown = 0;
      const thirdDetection = this.observerManager.checkDetection(observer);
      assert.strictEqual(thirdDetection, true, 'State change after cooldown should be detected');
    });
  }

  testObserverFacing() {
    this.runTest('Observer Facing', () => {
      console.log('  Creating and placing stairs block...');
      const stairs = new TuffBrickStairsBlock();
      this.world.setBlock(0, 0, 0, stairs);
      const placedStairs = this.world.getBlock(0, 0, 0);
      
      console.log('  Testing observer facing from different positions...');
      const positions = [
        { pos: { x: 0, y: 0, z: 1 }, expected: 'north' },
        { pos: { x: 0, y: 0, z: -1 }, expected: 'south' },
        { pos: { x: 1, y: 0, z: 0 }, expected: 'west' },
        { pos: { x: -1, y: 0, z: 0 }, expected: 'east' }
      ];
      
      positions.forEach(({ pos, expected }) => {
        console.log(`    Testing position: ${JSON.stringify(pos)}`);
        const observer = this.observerManager.createObserver(pos);
        this.observerManager.faceBlock(observer, placedStairs);
        assert.strictEqual(observer.facing, expected, `Observer should face ${expected} when at ${JSON.stringify(pos)}`);
      });
    });
  }

  testObserverMultipleBlocks() {
    this.runTest('Observer Multiple Blocks', () => {
      console.log('  Creating and placing multiple blocks...');
      const blocks = [
        { block: new TuffBrickStairsBlock(), pos: { x: 0, y: 0, z: 0 } },
        { block: new TuffBrickStairsBlock(), pos: { x: 2, y: 0, z: 0 } },
        { block: new TuffBrickStairsBlock(), pos: { x: 0, y: 0, z: 2 } }
      ];
      
      blocks.forEach(({ block, pos }) => {
        this.world.setBlock(pos.x, pos.y, pos.z, block);
      });
      
      console.log('  Creating observer facing the first block...');
      const observer = this.observerManager.createObserver({ x: 0, y: 0, z: 1 });
      const firstBlock = this.world.getBlock(0, 0, 0);
      this.observerManager.faceBlock(observer, firstBlock);
      
      console.log('  Testing state changes on different blocks...');
      blocks.forEach(({ pos }, index) => {
        console.log(`    Testing block at position: ${JSON.stringify(pos)}`);
        const block = this.world.getBlock(pos.x, pos.y, pos.z);
        block.setState('facing', ['north', 'south', 'east'][index]);
        this.observerManager.updateBlockState(block);
        
        const detected = this.observerManager.checkDetection(observer);
        assert.strictEqual(detected, pos.x === 0 && pos.z === 0, 
          `Observer should only detect changes in the block it's facing (${pos.x}, ${pos.z})`);
      });
    });
  }

  async testObserverStatePersistence() {
    console.log('Running test: Observer State Persistence');
    console.log('  Creating and placing stairs block...');
    const stairs = new TuffBrickStairsBlock();
    stairs.position = { x: 0, y: 0, z: 0 };
    this.world.setBlock(0, 0, 0, stairs);
    console.log('  Creating observer facing the stairs...');
    const observer = this.observerManager.createObserver({ x: 0, y: 0, z: 1 });
    this.observerManager.faceBlock(observer, stairs);
    console.log('  Setting initial state...');
    stairs.setState('facing', 'north');
    this.observerManager.updateBlockState(stairs);
    this.observerManager.checkDetection(observer);
    console.log('  Verifying state persistence...');
    // Parse lastState before checking facing
    const lastStateObj = observer.lastState ? JSON.parse(observer.lastState) : null;
    assert(lastStateObj && lastStateObj.state.facing === 'north', 'State should persist as north');
    console.log('  Updating state and verifying change...');
    stairs.setState('facing', 'south');
    this.observerManager.updateBlockState(stairs);
    observer.cooldown = 0; // Reset cooldown to allow detection
    this.observerManager.checkDetection(observer);
    const updatedStateObj = observer.lastState ? JSON.parse(observer.lastState) : null;
    assert(updatedStateObj && updatedStateObj.state.facing === 'south', 'State should reflect new facing direction');
    console.log('✓ Observer State Persistence passed\n');
  }

  testObserverBlockRemoval() {
    this.runTest('Observer Block Removal', () => {
      console.log('  Creating and placing stairs block...');
      const stairs = new TuffBrickStairsBlock();
      this.world.setBlock(0, 0, 0, stairs);
      const placedStairs = this.world.getBlock(0, 0, 0);
      
      console.log('  Creating observer facing the stairs...');
      const observer = this.observerManager.createObserver({ x: 0, y: 0, z: 1 });
      this.observerManager.faceBlock(observer, placedStairs);
      
      console.log('  Removing block and checking detection...');
      this.world.removeBlock(0, 0, 0);
      const detected = this.observerManager.checkDetection(observer);
      assert.strictEqual(detected, true, 'Observer should detect block removal');
    });
  }

  testObserverBlockReplacement() {
    this.runTest('Observer Block Replacement', () => {
      console.log('  Creating and placing initial stairs block...');
      const initialStairs = new TuffBrickStairsBlock();
      this.world.setBlock(0, 0, 0, initialStairs);
      
      console.log('  Creating observer facing the stairs...');
      const observer = this.observerManager.createObserver({ x: 0, y: 0, z: 1 });
      this.observerManager.faceBlock(observer, initialStairs);
      
      console.log('  Replacing block with new stairs...');
      const newStairs = new TuffBrickStairsBlock();
      this.world.setBlock(0, 0, 0, newStairs);
      const detected = this.observerManager.checkDetection(observer);
      assert.strictEqual(detected, true, 'Observer should detect block replacement');
    });
  }

  testObserverStateValidation() {
    this.runTest('Observer State Validation', () => {
      console.log('  Creating and placing stairs block...');
      const stairs = new TuffBrickStairsBlock();
      this.world.setBlock(0, 0, 0, stairs);
      const placedStairs = this.world.getBlock(0, 0, 0);
      
      console.log('  Creating observer facing the stairs...');
      const observer = this.observerManager.createObserver({ x: 0, y: 0, z: 1 });
      this.observerManager.faceBlock(observer, placedStairs);
      
      console.log('  Testing invalid state values...');
      assert.throws(() => {
        placedStairs.setState('facing', 'invalid');
      }, 'Should throw error for invalid facing direction');
      
      console.log('  Testing valid state values...');
      placedStairs.setState('facing', 'north');
      this.observerManager.updateBlockState(placedStairs);
      const detected = this.observerManager.checkDetection(observer);
      assert.strictEqual(detected, true, 'Observer should detect valid state change');
    });
  }
}

// Run tests
const test = new TuffVariantsObserverTest();
test.runTests();

module.exports = TuffVariantsObserverTest; 