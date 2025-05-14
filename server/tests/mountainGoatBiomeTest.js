/**
 * Test file for Mountain Goat Biome implementation
 * Tests the special features of the Mountain Goat Biome:
 * - Higher goat spawn rates
 * - Powder snow generation
 * - Higher base elevation and steeper peaks
 */

const MountainGoatBiome = require('../biomes/mountainGoatBiome');
const MountainsBiome = require('../biomes/mountainsBiome');
const { Goat } = require('../mobs/neutralMobs');
const assert = require('assert');

describe('Mountain Goat Biome Tests', () => {
  // Mock noise generators for testing
  const mockNoiseGenerators = {
    base: {
      get: (x, z) => Math.sin(x * 0.05) * Math.cos(z * 0.05) * 0.5 + 0.5
    },
    ridge: {
      get: (x, z) => Math.abs(Math.sin(x * 0.1 + z * 0.1))
    },
    peak: {
      get: (x, z) => Math.pow(Math.sin(x * 0.02) * Math.cos(z * 0.02), 2)
    },
    steepness: {
      get: (x, z) => Math.sin(x * 0.03) * Math.cos(z * 0.03) * 0.5 + 0.5
    },
    powderSnow: {
      get: (x, z) => Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5 + 0.5
    }
  };

  // Mock random number generator
  const mockRandom = {
    random: () => Math.random()
  };

  describe('Biome Properties', () => {
    it('should have correct base properties', () => {
      const biome = new MountainGoatBiome();
      
      // Check basic properties
      assert.strictEqual(biome.id, 'mountain_goat');
      assert.strictEqual(biome.name, 'Mountain Goat Peaks');
      
      // Should have higher base height than regular mountains
      const regularMountains = new MountainsBiome();
      assert(biome.baseHeight > regularMountains.baseHeight);
      
      // Should have higher height variation than regular mountains
      assert(biome.heightVariation > regularMountains.heightVariation);
      
      // Should have lower snow level
      assert(biome.snowLevel < regularMountains.snowLevel);
      
      // Should have powder snow settings
      assert(typeof biome.powderSnowChance === 'number');
      assert(biome.powderSnowChance > 0);
    });

    it('should have higher goat spawn rates', () => {
      const biome = new MountainGoatBiome();
      const regularMountains = new MountainsBiome();
      
      // Mountain Goat Biome should have higher goat spawn rate
      assert(biome.spawnRates.passive.goat > regularMountains.spawnRates.passive.goat);
      
      // And specifically should be at maximum (1.0)
      assert.strictEqual(biome.spawnRates.passive.goat, 1.0);
      
      // Should have reduced rates for other passive mobs
      assert(biome.spawnRates.passive.sheep < regularMountains.spawnRates.passive.sheep);
    });
  });

  describe('Terrain Generation', () => {
    it('should generate steeper terrain than regular mountains', () => {
      const biome = new MountainGoatBiome();
      const regularMountains = new MountainsBiome();
      
      // Check height at several test points
      const testPoints = [
        [0, 0],
        [100, 100],
        [200, 50],
        [50, 200]
      ];
      
      // Count how many points have higher elevation in the goat biome
      let higherCount = 0;
      
      for (const [x, z] of testPoints) {
        const goatHeight = biome.getHeight(x, z, mockNoiseGenerators);
        const regularHeight = regularMountains.getHeight(x, z, mockNoiseGenerators);
        
        if (goatHeight > regularHeight) {
          higherCount++;
        }
      }
      
      // Most points should be higher in the goat biome
      assert(higherCount > testPoints.length / 2);
    });

    it('should generate powder snow in appropriate locations', () => {
      const biome = new MountainGoatBiome();
      
      // Force powder snow noise to return a value that ensures powder snow generation
      const snowNoiseGenerators = {
        ...mockNoiseGenerators,
        powderSnow: {
          get: () => 0.1 // Well below the threshold
        }
      };
      
      // Set surface height above snow level
      const surfaceHeight = biome.snowLevel + 5;
      
      // Track powder snow blocks
      let powderSnowCount = 0;
      let snowLayerCount = 0;
      
      // Test on a flat area (no slope)
      const flatAreaNoiseGenerators = {
        ...snowNoiseGenerators,
        // Make sure getHeight returns consistent values to simulate flat terrain
        base: { get: () => 0.5 },
        ridge: { get: () => 0.5 },
        peak: { get: () => 0.5 }
      };
      
      // Check multiple positions
      for (let x = 0; x < 10; x++) {
        for (let z = 0; z < 10; z++) {
          const block = biome.getBlockAt(x, surfaceHeight, z, surfaceHeight, flatAreaNoiseGenerators);
          
          if (block.id === 'powder_snow') {
            powderSnowCount++;
          } else if (block.id === 'snow_layer') {
            snowLayerCount++;
          }
        }
      }
      
      // Some blocks should be powder snow
      assert(powderSnowCount > 0);
      
      // But not all (some should still be snow layer)
      assert(snowLayerCount > 0);
    });
  });

  describe('Feature Generation', () => {
    it('should generate special features like goat horn fragments', () => {
      const biome = new MountainGoatBiome();
      
      // Force random to return low values to ensure horn fragment generation
      const testRandom = {
        random: () => 0.01 // Below the 0.05 threshold
      };
      
      // Set up for a high mountain position
      const x = 100;
      const z = 100;
      const heightNoiseGenerators = {
        ...mockNoiseGenerators,
        // Make sure getHeight returns a high value above snow level
        base: { get: () => 1.0 },
        ridge: { get: () => 1.0 },
        peak: { get: () => 1.0 }
      };
      
      // Get the height at the test position
      const height = biome.getHeight(x, z, heightNoiseGenerators);
      
      // Ensure it's above snow level for horn fragments
      assert(height > biome.snowLevel);
      
      // Get features at the position
      const features = biome.getFeaturesAt(x, z, testRandom, heightNoiseGenerators);
      
      // There should be at least one feature
      assert(features.length > 0);
      
      // Find horn fragment features
      const hornFragments = features.filter(f => 
        f.type === 'item' && f.id === 'goat_horn_fragment'
      );
      
      // Should have at least one horn fragment
      assert(hornFragments.length > 0);
      
      // The horn fragment should be positioned correctly
      const fragment = hornFragments[0];
      assert.strictEqual(fragment.position.x, x);
      assert.strictEqual(fragment.position.y, height + 1);
      assert.strictEqual(fragment.position.z, z);
    });
  });
}); 