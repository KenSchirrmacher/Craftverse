/**
 * TestBase - Base class for all test suites
 * Provides common test functionality and utilities
 */
const assert = require('assert');
const { v4: uuidv4 } = require('uuid');

class TestBase {
  /**
   * Create a test suite
   * @param {string} name - The test suite name
   */
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
    this.beforeAllHooks = [];
    this.afterAllHooks = [];
  }
  
  /**
   * Add a test case
   * @param {string} name - The test name
   * @param {Function} fn - The test function
   */
  test(name, fn) {
    this.tests.push({ name, fn });
  }
  
  /**
   * Add a before each hook
   * @param {Function} fn - The hook function
   */
  beforeEach(fn) {
    this.beforeEachHooks.push(fn);
  }
  
  /**
   * Add an after each hook
   * @param {Function} fn - The hook function
   */
  afterEach(fn) {
    this.afterEachHooks.push(fn);
  }
  
  /**
   * Add a before all hook
   * @param {Function} fn - The hook function
   */
  beforeAll(fn) {
    this.beforeAllHooks.push(fn);
  }
  
  /**
   * Add an after all hook
   * @param {Function} fn - The hook function
   */
  afterAll(fn) {
    this.afterAllHooks.push(fn);
  }
  
  /**
   * Run all tests in the suite
   * @returns {Object} Test results
   */
  async runTests() {
    const results = {
      name: this.name,
      passed: 0,
      failed: 0,
      errors: []
    };
    
    // Run before all hooks
    for (const hook of this.beforeAllHooks) {
      try {
        await hook();
      } catch (error) {
        results.errors.push({
          type: 'beforeAll',
          error
        });
        return results;
      }
    }
    
    // Run each test
    for (const test of this.tests) {
      // Run before each hooks
      for (const hook of this.beforeEachHooks) {
        try {
          await hook();
        } catch (error) {
          results.errors.push({
            type: 'beforeEach',
            test: test.name,
            error
          });
          continue;
        }
      }
      
      // Run the test
      try {
        await test.fn();
        results.passed++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          type: 'test',
          test: test.name,
          error
        });
      }
      
      // Run after each hooks
      for (const hook of this.afterEachHooks) {
        try {
          await hook();
        } catch (error) {
          results.errors.push({
            type: 'afterEach',
            test: test.name,
            error
          });
        }
      }
    }
    
    // Run after all hooks
    for (const hook of this.afterAllHooks) {
      try {
        await hook();
      } catch (error) {
        results.errors.push({
          type: 'afterAll',
          error
        });
      }
    }
    
    return results;
  }
  
  /**
   * Create a test world
   * @returns {Object} A test world instance
   */
  createTestWorld() {
    return {
      blocks: new Map(),
      entities: new Map(),
      blockStateUpdates: [],
      particleEffects: [],
      activatedBlocks: [],
      soundEffects: [],
      
      getBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        return this.blocks.get(key) || { type: 'air', isSolid: false };
      },
      
      setBlock(x, y, z, block) {
        const key = `${x},${y},${z}`;
        this.blocks.set(key, block);
        this.blockStateUpdates.push({ x, y, z, block });
      },
      
      getEntitiesInRadius(position, radius) {
        return Array.from(this.entities.values()).filter(entity => {
          const dx = entity.position.x - position.x;
          const dy = entity.position.y - position.y;
          const dz = entity.position.z - position.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          return distance <= radius;
        });
      },
      
      addEntity(entity) {
        this.entities.set(entity.id, entity);
        entity.world = this;
      },
      
      removeEntity(id) {
        this.entities.delete(id);
      },
      
      emitEntityUpdate() {
        // Real implementation would emit events
      },
      
      addParticleEffect(effect) {
        this.particleEffects.push(effect);
      },
      
      addSoundEffect(effect) {
        this.soundEffects.push(effect);
      },
      
      activateBlock(x, y, z) {
        this.activatedBlocks.push({ x, y, z });
      },
      
      reset() {
        this.blocks.clear();
        this.entities.clear();
        this.blockStateUpdates = [];
        this.particleEffects = [];
        this.activatedBlocks = [];
        this.soundEffects = [];
      }
    };
  }
  
  /**
   * Create a test player
   * @param {Object} options - Player options
   * @returns {Object} A test player instance
   */
  createTestPlayer(options = {}) {
    return {
      id: options.id || uuidv4(),
      position: options.position || { x: 0, y: 0, z: 0 },
      rotation: options.rotation || { x: 0, y: 0, z: 0 },
      velocity: options.velocity || { x: 0, y: 0, z: 0 },
      health: options.health || 20,
      gameMode: options.gameMode || 'survival',
      inventory: options.inventory || [],
      world: options.world || null,
      
      getLookDirection() {
        return {
          x: -Math.sin(this.rotation.y) * Math.cos(this.rotation.x),
          y: -Math.sin(this.rotation.x),
          z: Math.cos(this.rotation.y) * Math.cos(this.rotation.x)
        };
      },
      
      getHeldItem() {
        return this.inventory[0] || null;
      },
      
      sendEvent(event) {
        // Real implementation would send events
      }
    };
  }
  
  /**
   * Create a test entity
   * @param {Object} options - Entity options
   * @returns {Object} A test entity instance
   */
  createTestEntity(options = {}) {
    return {
      id: options.id || uuidv4(),
      type: options.type || 'test_entity',
      position: options.position || { x: 0, y: 0, z: 0 },
      velocity: options.velocity || { x: 0, y: 0, z: 0 },
      width: options.width || 0.6,
      height: options.height || 1.8,
      health: options.health || 20,
      world: options.world || null,
      
      takeDamage(amount, source) {
        this.health -= amount;
        if (this.health <= 0) {
          this.dead = true;
        }
      }
    };
  }
}

module.exports = TestBase; 