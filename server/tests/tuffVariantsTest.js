/**
 * Tests for Tuff Variant Blocks implementation
 * Verifies the functionality of tuff variants for the 1.21 Tricky Trials update
 */

const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');

// Mock world for testing placement mechanics
class MockWorld {
  constructor() {
    this.blocks = new Map();
  }
  
  getBlockAt(x, y, z) {
    return this.blocks.get(`${x},${y},${z}`);
  }
  
  setBlockAt(x, y, z, block) {
    this.blocks.set(`${x},${y},${z}`, block);
    return true;
  }
}

// Mock player for testing placement mechanics
class MockPlayer {
  constructor(direction = 'north', lookingAt = { face: 'top' }) {
    this.direction = direction;
    this.lookingAt = lookingAt;
  }
}

/**
 * Run all the tests for Tuff Variant Blocks
 * @returns {boolean} Whether all tests passed
 */
function run() {
  console.log('Running Tuff Variant Blocks Tests...');
  let success = true;
  
  try {
    // Chiseled Tuff Tests
    console.log('\nTesting: Chiseled Tuff Block');
    
    const chiseled = new ChiseledTuffBlock();
    
    // Verify basic properties
    assert.strictEqual(chiseled.id, 'chiseled_tuff', 'id should be chiseled_tuff');
    assert.strictEqual(chiseled.name, 'Chiseled Tuff', 'name should be Chiseled Tuff');
    assert.ok(chiseled.hardness > 0, 'hardness should be positive');
    
    // Verify textures
    assert.strictEqual(chiseled.textures.top, 'blocks/chiseled_tuff_top', 'top texture should be correct');
    assert.strictEqual(chiseled.textures.bottom, 'blocks/chiseled_tuff_top', 'bottom texture should be correct');
    assert.strictEqual(chiseled.textures.sides, 'blocks/chiseled_tuff_side', 'sides texture should be correct');
    
    // Test serialization
    const chiseledSerialized = chiseled.serialize();
    const chiseledDeserialized = ChiseledTuffBlock.deserialize(chiseledSerialized);
    
    assert.strictEqual(chiseledDeserialized.id, 'chiseled_tuff', 'deserialized id should match');
    assert.strictEqual(chiseledDeserialized.name, 'Chiseled Tuff', 'deserialized name should match');
    
    console.log('- Chiseled Tuff Block tests passed');
    
    // Tuff Bricks Tests
    console.log('\nTesting: Tuff Bricks Block');
    
    const bricks = new TuffBricksBlock();
    
    // Verify basic properties
    assert.strictEqual(bricks.id, 'tuff_bricks', 'id should be tuff_bricks');
    assert.strictEqual(bricks.name, 'Tuff Bricks', 'name should be Tuff Bricks');
    assert.ok(bricks.hardness > 0, 'hardness should be positive');
    
    // Verify blast resistance (should be higher than regular tuff)
    assert.strictEqual(bricks.blast_resistance, 7.0, 'blast_resistance should be 7.0');
    
    // Verify textures
    assert.strictEqual(bricks.textures.all, 'blocks/tuff_bricks', 'texture should be correct');
    
    // Test serialization
    const bricksSerialized = bricks.serialize();
    const bricksDeserialized = TuffBricksBlock.deserialize(bricksSerialized);
    
    assert.strictEqual(bricksDeserialized.id, 'tuff_bricks', 'deserialized id should match');
    assert.strictEqual(bricksDeserialized.blast_resistance, 7.0, 'deserialized blast_resistance should match');
    
    console.log('- Tuff Bricks Block tests passed');
    
    // Tuff Brick Slab Tests
    console.log('\nTesting: Tuff Brick Slab Block');
    
    const slab = new TuffBrickSlabBlock();
    
    // Verify basic properties
    assert.strictEqual(slab.id, 'tuff_brick_slab', 'id should be tuff_brick_slab');
    assert.strictEqual(slab.name, 'Tuff Brick Slab', 'name should be Tuff Brick Slab');
    assert.strictEqual(slab.toolType, 'pickaxe', 'toolType should be pickaxe');
    
    // Verify slab specific properties
    assert.strictEqual(slab.isTop, false, 'isTop should be false by default');
    assert.strictEqual(slab.isDouble, false, 'isDouble should be false by default');
    assert.strictEqual(slab.transparent, true, 'transparent should be true for single slab');
    
    // Verify textures
    assert.strictEqual(slab.textures.all, 'blocks/tuff_bricks', 'texture should be correct');
    
    // Verify bounding box
    assert.deepStrictEqual(
      slab.boundingBox, 
      { minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 0.5, maxZ: 1 },
      'bounding box should be correct for bottom slab'
    );
    
    // Test double slab
    const doubleSlab = new TuffBrickSlabBlock({ isDouble: true });
    assert.deepStrictEqual(
      doubleSlab.boundingBox, 
      { minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 },
      'bounding box should be full size for double slab'
    );
    assert.strictEqual(doubleSlab.transparent, false, 'transparent should be false for double slab');
    
    // Test placement on existing slab
    const world = new MockWorld();
    const position = { x: 0, y: 0, z: 0 };
    const player = new MockPlayer();
    
    // Place first slab
    world.setBlockAt(position.x, position.y, position.z, new TuffBrickSlabBlock());
    
    // Place second slab
    const secondSlab = new TuffBrickSlabBlock();
    const placeResult = secondSlab.onPlace(world, position, player);
    
    // Verify result
    assert.strictEqual(placeResult.type, 'tuff_brick_slab', 'placement result type should be correct');
    assert.strictEqual(placeResult.isDouble, true, 'placement should result in double slab');
    
    // Test placement based on face clicked
    const playerLookingDown = new MockPlayer('north', { face: 'bottom' });
    const topSlabResult = slab.onPlace(new MockWorld(), position, playerLookingDown);
    
    assert.strictEqual(topSlabResult.isTop, true, 'when clicking bottom face, should place top slab');
    
    // Test serialization
    const slabSerialized = doubleSlab.serialize();
    const slabDeserialized = TuffBrickSlabBlock.deserialize(slabSerialized);
    
    assert.strictEqual(slabDeserialized.id, 'tuff_brick_slab', 'deserialized id should match');
    assert.strictEqual(slabDeserialized.isDouble, true, 'deserialized isDouble should match');
    
    console.log('- Tuff Brick Slab Block tests passed');
    
    // Tuff Brick Stairs Tests
    console.log('\nTesting: Tuff Brick Stairs Block');
    
    const stairs = new TuffBrickStairsBlock();
    
    // Verify basic properties
    assert.strictEqual(stairs.id, 'tuff_brick_stairs', 'id should be tuff_brick_stairs');
    assert.strictEqual(stairs.name, 'Tuff Brick Stairs', 'name should be Tuff Brick Stairs');
    assert.strictEqual(stairs.toolType, 'pickaxe', 'toolType should be pickaxe');
    
    // Verify stairs specific properties
    assert.strictEqual(stairs.facing, 'north', 'facing should be north by default');
    assert.strictEqual(stairs.half, 'bottom', 'half should be bottom by default');
    assert.strictEqual(stairs.shape, 'straight', 'shape should be straight by default');
    assert.strictEqual(stairs.transparent, true, 'transparent should be true');
    assert.strictEqual(stairs.render, 'stairs', 'render type should be stairs');
    
    // Verify textures
    assert.strictEqual(stairs.textures.all, 'blocks/tuff_bricks', 'texture should be correct');
    
    // Test placement based on player direction
    const eastPlayer = new MockPlayer('east');
    const eastStairsResult = stairs.onPlace(new MockWorld(), position, eastPlayer);
    
    assert.strictEqual(eastStairsResult.facing, 'east', 'stairs should face based on player direction');
    
    // Test direction conversion
    assert.strictEqual(stairs.getFacingFromDirection('north'), 'north', 'north conversion');
    assert.strictEqual(stairs.getFacingFromDirection('east'), 'east', 'east conversion');
    assert.strictEqual(stairs.getFacingFromDirection('southwest'), 'south', 'southwest conversion');
    assert.strictEqual(stairs.getFacingFromDirection('northeast'), 'north', 'northeast conversion');
    
    // Test serialization
    const customStairs = new TuffBrickStairsBlock({
      facing: 'west',
      half: 'top',
      shape: 'inner_left'
    });
    
    const stairsSerialized = customStairs.serialize();
    const stairsDeserialized = TuffBrickStairsBlock.deserialize(stairsSerialized);
    
    assert.strictEqual(stairsDeserialized.id, 'tuff_brick_stairs', 'deserialized id should match');
    assert.strictEqual(stairsDeserialized.facing, 'west', 'deserialized facing should match');
    assert.strictEqual(stairsDeserialized.half, 'top', 'deserialized half should match');
    assert.strictEqual(stairsDeserialized.shape, 'inner_left', 'deserialized shape should match');
    
    console.log('- Tuff Brick Stairs Block tests passed');
    
    // Tuff Brick Wall Tests
    console.log('\nTesting: Tuff Brick Wall Block');
    
    const wall = new TuffBrickWallBlock();
    
    // Verify basic properties
    assert.strictEqual(wall.id, 'tuff_brick_wall', 'id should be tuff_brick_wall');
    assert.strictEqual(wall.name, 'Tuff Brick Wall', 'name should be Tuff Brick Wall');
    assert.strictEqual(wall.toolType, 'pickaxe', 'toolType should be pickaxe');
    
    // Verify wall specific properties
    assert.strictEqual(wall.up, false, 'up should be false by default');
    assert.strictEqual(wall.north, 'none', 'north should be none by default');
    assert.strictEqual(wall.east, 'none', 'east should be none by default');
    assert.strictEqual(wall.south, 'none', 'south should be none by default');
    assert.strictEqual(wall.west, 'none', 'west should be none by default');
    assert.strictEqual(wall.transparent, true, 'transparent should be true');
    assert.strictEqual(wall.render, 'wall', 'render type should be wall');
    
    // Verify textures
    assert.strictEqual(wall.textures.all, 'blocks/tuff_bricks', 'texture should be correct');
    
    // Test wall connections
    const wallWorld = new MockWorld();
    const wallPosition = { x: 0, y: 0, z: 0 };
    
    // Add a solid block to the north
    wallWorld.setBlockAt(0, 0, -1, { id: 'stone', solid: true });
    
    // Add a wall to the east
    wallWorld.setBlockAt(1, 0, 0, { id: 'tuff_brick_wall' });
    
    // Place the wall and test connections
    const placeWallResult = wall.onPlace(wallWorld, wallPosition, new MockPlayer());
    
    assert.strictEqual(placeWallResult.up, false, 'up should be false');
    assert.strictEqual(placeWallResult.north, 'low', 'north should be low for solid block');
    assert.strictEqual(placeWallResult.east, 'tall', 'east should be tall for wall block');
    
    // Test connection detection
    const emptyConnections = wall.getConnections(new MockWorld(), wallPosition);
    assert.deepStrictEqual(
      emptyConnections,
      { up: false, north: 'none', south: 'none', east: 'none', west: 'none' },
      'connections should be empty with no neighbors'
    );
    
    // Test serialization
    const customWall = new TuffBrickWallBlock({
      up: true,
      north: 'tall',
      south: 'low',
      east: 'none',
      west: 'low'
    });
    
    const wallSerialized = customWall.serialize();
    const wallDeserialized = TuffBrickWallBlock.deserialize(wallSerialized);
    
    assert.strictEqual(wallDeserialized.id, 'tuff_brick_wall', 'deserialized id should match');
    assert.strictEqual(wallDeserialized.up, true, 'deserialized up should match');
    assert.strictEqual(wallDeserialized.north, 'tall', 'deserialized north should match');
    assert.strictEqual(wallDeserialized.south, 'low', 'deserialized south should match');
    assert.strictEqual(wallDeserialized.east, 'none', 'deserialized east should match');
    assert.strictEqual(wallDeserialized.west, 'low', 'deserialized west should match');
    
    console.log('- Tuff Brick Wall Block tests passed');
    
    console.log('\n✅ ALL TESTS PASSED: Tuff Variant Blocks tests completed successfully');
  } catch (error) {
    console.error(`❌ TEST FAILED: ${error.message}`);
    console.error(error.stack);
    success = false;
  }
  
  return success;
}

// Run the tests if this file is executed directly
if (require.main === module) {
  const success = run();
  process.exit(success ? 0 : 1);
}

module.exports = { run }; 