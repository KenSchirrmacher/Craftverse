const assert = require('assert');
const VaultPortalItem = require('../items/vaultPortalItem');

class TestWorld {
  constructor() {
    this.blocks = new Map();
  }

  getBlock(x, y, z) {
    return this.blocks.get(`${x},${y},${z}`);
  }

  setBlock(x, y, z, block) {
    this.blocks.set(`${x},${y},${z}`, block);
  }
}

class TestPlayer {
  constructor() {
    this.messages = [];
    this.inventory = {
      items: new Map()
    };
  }

  sendMessage(msg) {
    this.messages.push(msg);
  }

  getInventory() {
    return {
      removeItem: (id, count) => {
        const current = this.inventory.items.get(id) || 0;
        this.inventory.items.set(id, current - count);
      }
    };
  }
}

describe('VaultPortalItem', () => {
  let item;
  let world;
  let player;

  beforeEach(() => {
    item = new VaultPortalItem();
    world = new TestWorld();
    player = new TestPlayer();
  });

  describe('Item Properties', () => {
    it('should have correct basic properties', () => {
      assert.strictEqual(item.id, 'vault_portal');
      assert.strictEqual(item.name, 'Vault Portal');
      assert.strictEqual(item.maxStackSize, 1);
      assert.strictEqual(item.rarity, 'rare');
    });

    it('should have valid crafting recipe', () => {
      assert.strictEqual(item.craftingRecipe.pattern.length, 3);
      assert.strictEqual(item.craftingRecipe.result.item, 'vault_portal');
      assert.strictEqual(item.craftingRecipe.result.count, 1);
    });
  });

  describe('Placement Logic', () => {
    it('should place portal block in valid location', () => {
      // Set up valid placement scenario
      world.setBlock(0, 0, 0, { id: 'stone', isSolid: true });
      world.setBlock(0, 1, 0, { id: 'air' });

      const result = item.onUse(world, 0, 0, 0, player, 'top');
      
      assert.strictEqual(result, true);
      const placedBlock = world.getBlock(0, 1, 0);
      assert.strictEqual(placedBlock.id, 'vault_portal');
    });

    it('should not place portal block in invalid location', () => {
      // Set up invalid placement scenario (no solid block below)
      world.setBlock(0, 1, 0, { id: 'air' });

      const result = item.onUse(world, 0, 1, 0, player, 'top');
      
      assert.strictEqual(result, false);
      assert.strictEqual(player.messages.length, 1);
      assert.strictEqual(player.messages[0], 'Cannot place Vault Portal here!');
    });

    it('should consume item on successful placement', () => {
      // Set up valid placement scenario
      world.setBlock(0, 0, 0, { id: 'stone', isSolid: true });
      world.setBlock(0, 1, 0, { id: 'air' });
      player.inventory.items.set('vault_portal', 1);

      item.onUse(world, 0, 0, 0, player, 'top');
      
      assert.strictEqual(player.inventory.items.get('vault_portal'), 0);
    });
  });

  describe('Placement Validation', () => {
    it('should validate placement requirements', () => {
      // Test valid placement
      world.setBlock(0, 0, 0, { id: 'stone', isSolid: true });
      world.setBlock(0, 1, 0, { id: 'air' });
      assert.strictEqual(item.canPlaceAt(world, 0, 1, 0), true);

      // Test invalid placement (no solid block below)
      world.setBlock(0, 1, 0, { id: 'air' });
      assert.strictEqual(item.canPlaceAt(world, 0, 1, 0), false);

      // Test invalid placement (block already exists)
      world.setBlock(0, 1, 0, { id: 'stone' });
      assert.strictEqual(item.canPlaceAt(world, 0, 1, 0), false);
    });
  });
}); 