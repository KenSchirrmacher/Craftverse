const assert = require('assert');
const TestBase = require('./testBase');
const World = require('../world/world');

class WorldInitializationTest extends TestBase {
  constructor() {
    super('World Initialization Test');
    
    this.test('World should initialize with correct blocks', async () => {
      const world = new World();
      world.initialize();
      
      // Check total block count
      assert.ok(world.blocks.size > 0, 'World should have blocks');
      console.log('Total blocks:', world.blocks.size);
      
      // Check ground level blocks
      const groundLevel = 64;
      const worldSize = 16;
      
      // Verify grass blocks at ground level
      for (let x = -worldSize/2; x < worldSize/2; x++) {
        for (let z = -worldSize/2; z < worldSize/2; z++) {
          const block = world.getBlock(x, groundLevel, z);
          assert.strictEqual(block.type, 'grass', `Should have grass block at (${x}, ${groundLevel}, ${z})`);
        }
      }
      
      // Verify dirt blocks below grass
      for (let x = -worldSize/2; x < worldSize/2; x++) {
        for (let z = -worldSize/2; z < worldSize/2; z++) {
          for (let y = groundLevel - 1; y > groundLevel - 4; y--) {
            const block = world.getBlock(x, y, z);
            assert.strictEqual(block.type, 'dirt', `Should have dirt block at (${x}, ${y}, ${z})`);
          }
        }
      }
      
      // Verify stone blocks below dirt
      for (let x = -worldSize/2; x < worldSize/2; x++) {
        for (let z = -worldSize/2; z < worldSize/2; z++) {
          for (let y = groundLevel - 4; y > groundLevel - 8; y--) {
            const block = world.getBlock(x, y, z);
            assert.strictEqual(block.type, 'stone', `Should have stone block at (${x}, ${y}, ${z})`);
          }
        }
      }
      
      // Verify trees
      const treePositions = [
        { x: 2, y: groundLevel + 1, z: 2 },
        { x: -3, y: groundLevel + 1, z: -4 },
        { x: 5, y: groundLevel + 1, z: -2 }
      ];
      
      treePositions.forEach(pos => {
        // Check log blocks
        for (let i = 0; i < 4; i++) {
          const block = world.getBlock(pos.x, pos.y + i, pos.z);
          assert.strictEqual(block.type, 'wood', `Should have wood block at (${pos.x}, ${pos.y + i}, ${pos.z})`);
        }
        
        // Check some leaf blocks
        const leafPositions = [
          { x: pos.x + 1, y: pos.y + 2, z: pos.z },
          { x: pos.x - 1, y: pos.y + 2, z: pos.z },
          { x: pos.x, y: pos.y + 2, z: pos.z + 1 },
          { x: pos.x, y: pos.y + 2, z: pos.z - 1 }
        ];
        
        leafPositions.forEach(leafPos => {
          const block = world.getBlock(leafPos.x, leafPos.y, leafPos.z);
          assert.strictEqual(block.type, 'leaves', `Should have leaves block at (${leafPos.x}, ${leafPos.y}, ${leafPos.z})`);
        });
      });
    });
  }
}

// Run the tests
(async () => {
  const test = new WorldInitializationTest();
  const results = await test.runTests();
  console.log('Test results:', results);
})(); 