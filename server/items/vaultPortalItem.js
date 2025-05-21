const Item = require('./item');
const { ItemRegistry } = require('../registry/itemRegistry');
const { BlockRegistry } = require('../registry/blockRegistry');
const VaultPortalBlock = require('../blocks/vaultPortalBlock');

class VaultPortalItem extends Item {
  constructor() {
    super('vault_portal');
    this.maxStackSize = 1;
    this.placeable = true;
  }

  getMaxStackSize() {
    return this.maxStackSize;
  }

  isPlaceable() {
    return this.placeable;
  }

  use(player, world, position) {
    if (!this.isPlaceable()) {
      return { success: false, message: 'Item is not placeable' };
    }

    const portalBlock = new VaultPortalBlock();
    const placedBlock = portalBlock.place(world, position);

    if (!placedBlock) {
      return { success: false, message: 'Could not place portal block' };
    }

    return { success: true, block: placedBlock };
  }

  serialize() {
    return {
      ...super.serialize(),
      maxStackSize: this.maxStackSize,
      placeable: this.placeable
    };
  }

  deserialize(data) {
    super.deserialize(data);
    this.maxStackSize = data.maxStackSize;
    this.placeable = data.placeable;
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