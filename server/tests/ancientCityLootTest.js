/**
 * Tests for Ancient City loot tables
 * Specifically tests if Echo Shards are properly included in Ancient City treasure chests
 */

const AncientCityGenerator = require('../utils/structures/ancientCityGenerator');
const ItemRegistry = require('../items/itemRegistry');
const assert = require('assert');

describe('Ancient City Loot Tests', () => {
  let placedBlocks = {};
  let generator;
  
  beforeEach(() => {
    // Reset tracking variables
    placedBlocks = {};
    
    // Create generator with fixed seed for deterministic testing
    generator = new AncientCityGenerator({ seed: 12345 });
    
    // Mock block setter function for testing
    const mockBlockSetter = (key, block) => {
      const [x, y, z] = key.split(',').map(Number);
      placedBlocks[key] = {
        position: { x, y, z },
        block
      };
    };
    
    // Generate the Ancient City
    const position = { x: 0, y: 64, z: 0 };
    const options = { 
      size: 'medium',
      sculkDensity: 0.5
    };
    
    // Generate the structure
    generator.generateAncientCity(
      position, 
      options, 
      mockBlockSetter
    );
  });
  
  it('should generate treasure chests', () => {
    // Find chests in the structure
    const chests = [];
    
    for (const key in placedBlocks) {
      const blockData = placedBlocks[key];
      if (blockData.block.type === 'chest') {
        chests.push(blockData);
      }
    }
    
    // Check if we found any chests
    assert.ok(chests.length > 0, 'Ancient City should contain chests');
    
    // Log number of chests for debugging
    console.log(`Found ${chests.length} chests in the Ancient City`);
  });
  
  it('should include Echo Shards in treasure chest loot tables', () => {
    // Find treasure chests
    const treasureChests = [];
    
    for (const key in placedBlocks) {
      const blockData = placedBlocks[key];
      
      if (blockData.block.type === 'chest' && 
          blockData.block.metadata && 
          blockData.block.metadata.loot === 'ancient_city_treasure') {
        treasureChests.push(blockData);
      }
    }
    
    // Check if we found any treasure chests
    assert.ok(treasureChests.length > 0, 'Ancient City should contain treasure chests');
    
    // Check if Echo Shards are included in the loot table
    let hasEchoShards = false;
    
    for (const chest of treasureChests) {
      // Check for direct item inclusions in metadata
      if (chest.block.metadata.items) {
        for (const item of chest.block.metadata.items) {
          if (item.type === 'echo_shard') {
            hasEchoShards = true;
            break;
          }
        }
      }
      
      if (hasEchoShards) break;
    }
    
    // Verify Echo Shards exist in the item registry
    const echoShardInRegistry = ItemRegistry.getItem('echo_shard');
    assert.ok(echoShardInRegistry, 'Echo Shard should be registered in the ItemRegistry');
    
    // Verify Echo Shards are found in the loot
    assert.ok(hasEchoShards, 'Echo Shards should be included in Ancient City treasure chest loot');
  });
  
  it('should provide a reasonable amount of Echo Shards', () => {
    // Find treasure chests and count Echo Shards
    let totalEchoShards = 0;
    let treasureChestCount = 0;
    
    for (const key in placedBlocks) {
      const blockData = placedBlocks[key];
      
      if (blockData.block.type === 'chest' && 
          blockData.block.metadata && 
          blockData.block.metadata.loot === 'ancient_city_treasure') {
        treasureChestCount++;
        
        // Count Echo Shards
        if (blockData.block.metadata.items) {
          for (const item of blockData.block.metadata.items) {
            if (item.type === 'echo_shard') {
              totalEchoShards += item.count || 1;
            }
          }
        }
      }
    }
    
    // Output statistics
    console.log(`Found ${treasureChestCount} treasure chests with a total of ${totalEchoShards} Echo Shards`);
    
    // Each chest should have 1-3 Echo Shards
    assert.ok(totalEchoShards > 0, 'There should be Echo Shards in the loot');
    assert.ok(totalEchoShards <= treasureChestCount * 3, 'There should be at most 3 Echo Shards per chest');
  });
}); 