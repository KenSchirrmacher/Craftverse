const Item = require('./item');
const { ItemRegistry } = require('../registry/itemRegistry');
const { BlockRegistry } = require('../registry/blockRegistry');

class VaultPortalItem extends Item {
  constructor() {
    super({
      id: 'vault_portal',
      name: 'Vault Portal',
      maxStackSize: 1,
      rarity: 'rare',
      craftingRecipe: {
        pattern: [
          ['reinforced_deepslate', 'echo_shard', 'reinforced_deepslate'],
          ['echo_shard', 'netherite_ingot', 'echo_shard'],
          ['reinforced_deepslate', 'echo_shard', 'reinforced_deepslate']
        ],
        result: {
          item: 'vault_portal',
          count: 1
        }
      }
    });
  }

  onUse(world, x, y, z, player, face) {
    // Get the block at the target position
    const targetBlock = world.getBlock(x, y, z);
    if (!targetBlock) return false;

    // Calculate the position to place the portal block
    const placeX = x + (face === 'west' ? -1 : face === 'east' ? 1 : 0);
    const placeY = y + (face === 'bottom' ? -1 : face === 'top' ? 1 : 0);
    const placeZ = z + (face === 'north' ? -1 : face === 'south' ? 1 : 0);

    // Check if the position is valid for placement
    if (!this.canPlaceAt(world, placeX, placeY, placeZ)) {
      player.sendMessage('Cannot place Vault Portal here!');
      return false;
    }

    // Place the portal block
    const portalBlock = BlockRegistry.getBlock('vault_portal');
    world.setBlock(placeX, placeY, placeZ, portalBlock);

    // Consume the item
    player.getInventory().removeItem(this.id, 1);

    return true;
  }

  canPlaceAt(world, x, y, z) {
    // Check if the block at the position is air
    const block = world.getBlock(x, y, z);
    if (!block || block.id !== 'air') return false;

    // Check if there's a solid block below
    const blockBelow = world.getBlock(x, y - 1, z);
    if (!blockBelow || !blockBelow.isSolid) return false;

    return true;
  }
}

// Register the item
ItemRegistry.register(new VaultPortalItem());

module.exports = VaultPortalItem; 