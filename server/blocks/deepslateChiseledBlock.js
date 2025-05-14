const Block = require('./block');

class DeepslateChiseledBlock extends Block {
  constructor() {
    super({
      id: 'chiseled_deepslate',
      name: 'Chiseled Deepslate',
      hardness: 3.5,
      blastResistance: 6.0,
      toolType: 'pickaxe',
      toolLevel: 1,
      transparent: false,
      solid: true,
      color: '#3A3A3A'
    });
  }

  onBreak(world, x, y, z) {
    // Always drop itself when broken
    world.dropItem(x, y, z, {
      type: 'chiseled_deepslate',
      count: 1
    });
  }

  getDrops() {
    return {
      type: 'chiseled_deepslate',
      count: 1
    };
  }
}

module.exports = DeepslateChiseledBlock; 