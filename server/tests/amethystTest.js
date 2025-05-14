const assert = require('assert');
const World = require('../world/world');
const BlockRegistry = require('../blocks/blockRegistry');

describe('Amethyst Block Tests', () => {
  let world;
  let blockRegistry;

  beforeEach(() => {
    world = new World();
    blockRegistry = new BlockRegistry();
  });

  describe('AmethystBlock', () => {
    it('should drop amethyst shards when broken', () => {
      const amethystBlock = blockRegistry.getBlock('amethyst_block');
      const drops = amethystBlock.getDrops();
      assert.strictEqual(drops.type, 'amethyst_shard');
      assert.strictEqual(drops.count, 4);
    });
  });

  describe('AmethystCluster', () => {
    it('should grow through stages when placed on budding amethyst', () => {
      const cluster = blockRegistry.getBlock('amethyst_cluster');
      const buddingAmethyst = blockRegistry.getBlock('budding_amethyst');
      
      // Place budding amethyst
      world.setBlock(0, 0, 0, buddingAmethyst);
      
      // Place cluster
      world.setBlock(0, 1, 0, cluster);
      
      // Simulate growth
      for (let i = 0; i < 1000; i++) {
        cluster.update(world, 0, 1, 0);
      }
      
      const block = world.getBlock(0, 1, 0);
      assert(block.growthStage > 0);
    });

    it('should drop more shards at higher growth stages', () => {
      const cluster = blockRegistry.getBlock('amethyst_cluster');
      cluster.growthStage = 3; // Full cluster
      const drops = cluster.getDrops();
      assert.strictEqual(drops.count, 4);
    });
  });

  describe('BuddingAmethyst', () => {
    it('should not drop anything when broken', () => {
      const buddingAmethyst = blockRegistry.getBlock('budding_amethyst');
      const drops = buddingAmethyst.getDrops();
      assert.strictEqual(drops, null);
    });

    it('should grow small buds in adjacent air blocks', () => {
      const buddingAmethyst = blockRegistry.getBlock('budding_amethyst');
      
      // Place budding amethyst
      world.setBlock(0, 0, 0, buddingAmethyst);
      
      // Create air blocks around it
      world.setBlock(1, 0, 0, { id: 'air' });
      
      // Simulate growth
      for (let i = 0; i < 1000; i++) {
        buddingAmethyst.update(world, 0, 0, 0);
      }
      
      const block = world.getBlock(1, 0, 0);
      assert(block && block.id === 'small_amethyst_bud');
    });
  });

  describe('Amethyst Buds', () => {
    it('should break when not attached to budding amethyst', () => {
      const smallBud = blockRegistry.getBlock('small_amethyst_bud');
      
      // Place bud without budding amethyst
      world.setBlock(0, 0, 0, smallBud);
      
      // Update should break it
      smallBud.update(world, 0, 0, 0);
      
      const block = world.getBlock(0, 0, 0);
      assert.strictEqual(block.id, 'air');
    });

    it('should grow through stages', () => {
      const buddingAmethyst = blockRegistry.getBlock('budding_amethyst');
      const smallBud = blockRegistry.getBlock('small_amethyst_bud');
      
      // Place budding amethyst and small bud
      world.setBlock(0, 0, 0, buddingAmethyst);
      world.setBlock(0, 1, 0, smallBud);
      
      // Simulate growth
      for (let i = 0; i < 1000; i++) {
        smallBud.update(world, 0, 1, 0);
      }
      
      const block = world.getBlock(0, 1, 0);
      assert(block.id === 'medium_amethyst_bud' || block.id === 'large_amethyst_bud' || block.id === 'amethyst_cluster');
    });
  });
}); 