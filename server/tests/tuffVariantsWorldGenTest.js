/**
 * World Generation Tests for Tuff Variants
 * Verifies that Tuff variants are properly integrated into world generation
 */

const assert = require('assert');
const World = require('../world/world');
const WorldGenerator = require('../world/worldGenerator');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');

class TuffVariantsWorldGenTest {
  constructor() {
    this.world = new World();
    this.worldGenerator = new WorldGenerator(this.world);
  }

  runTests() {
    this.testTuffGeneration();
    this.testTuffBrickStructures();
    this.testChiseledTuffGeneration();
    this.testTuffBrickWallGeneration();
  }

  testTuffGeneration() {
    console.log('Testing Tuff Generation...');

    // Generate a chunk
    const chunkX = 0;
    const chunkZ = 0;
    this.worldGenerator.generateChunk(chunkX, chunkZ);

    // Check for Tuff blocks in the chunk
    let tuffFound = false;
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 256; y++) {
        for (let z = 0; z < 16; z++) {
          const block = this.world.getBlockAt(
            chunkX * 16 + x,
            y,
            chunkZ * 16 + z
          );
          if (block.type === 'tuff') {
            tuffFound = true;
            break;
          }
        }
        if (tuffFound) break;
      }
      if (tuffFound) break;
    }

    assert.strictEqual(tuffFound, true, 'Tuff blocks should generate in the world');
  }

  testTuffBrickStructures() {
    console.log('Testing Tuff Brick Structures...');

    // Generate a structure with Tuff Bricks
    const structureX = 100;
    const structureY = 64;
    const structureZ = 100;
    this.worldGenerator.generateStructure('tuff_brick_ruins', structureX, structureY, structureZ);

    // Check for Tuff Brick blocks in the structure
    let tuffBricksFound = false;
    for (let x = -5; x <= 5; x++) {
      for (let y = 0; y < 10; y++) {
        for (let z = -5; z <= 5; z++) {
          const block = this.world.getBlockAt(
            structureX + x,
            structureY + y,
            structureZ + z
          );
          if (block.type === 'tuff_bricks') {
            tuffBricksFound = true;
            break;
          }
        }
        if (tuffBricksFound) break;
      }
      if (tuffBricksFound) break;
    }

    assert.strictEqual(tuffBricksFound, true, 'Tuff Brick structures should generate in the world');
  }

  testChiseledTuffGeneration() {
    console.log('Testing Chiseled Tuff Generation...');

    // Generate a structure with Chiseled Tuff
    const structureX = 200;
    const structureY = 64;
    const structureZ = 200;
    this.worldGenerator.generateStructure('tuff_temple', structureX, structureY, structureZ);

    // Check for Chiseled Tuff blocks in the structure
    let chiseledTuffFound = false;
    for (let x = -5; x <= 5; x++) {
      for (let y = 0; y < 10; y++) {
        for (let z = -5; z <= 5; z++) {
          const block = this.world.getBlockAt(
            structureX + x,
            structureY + y,
            structureZ + z
          );
          if (block.type === 'chiseled_tuff') {
            chiseledTuffFound = true;
            break;
          }
        }
        if (chiseledTuffFound) break;
      }
      if (chiseledTuffFound) break;
    }

    assert.strictEqual(chiseledTuffFound, true, 'Chiseled Tuff should generate in structures');
  }

  testTuffBrickWallGeneration() {
    console.log('Testing Tuff Brick Wall Generation...');

    // Generate a structure with Tuff Brick Walls
    const structureX = 300;
    const structureY = 64;
    const structureZ = 300;
    this.worldGenerator.generateStructure('tuff_fortress', structureX, structureY, structureZ);

    // Check for Tuff Brick Wall blocks in the structure
    let tuffBrickWallFound = false;
    for (let x = -5; x <= 5; x++) {
      for (let y = 0; y < 10; y++) {
        for (let z = -5; z <= 5; z++) {
          const block = this.world.getBlockAt(
            structureX + x,
            structureY + y,
            structureZ + z
          );
          if (block.type === 'tuff_brick_wall') {
            tuffBrickWallFound = true;
            break;
          }
        }
        if (tuffBrickWallFound) break;
      }
      if (tuffBrickWallFound) break;
    }

    assert.strictEqual(tuffBrickWallFound, true, 'Tuff Brick Walls should generate in structures');
  }
}

module.exports = TuffVariantsWorldGenTest; 