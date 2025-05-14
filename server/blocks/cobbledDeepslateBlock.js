const Block = require('./block');

class CobbledDeepslateBlock extends Block {
  constructor() {
    super({
      id: 'cobbled_deepslate',
      name: 'Cobbled Deepslate',
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
      type: 'cobbled_deepslate',
      count: 1
    });
  }

  getDrops() {
    return {
      type: 'cobbled_deepslate',
      count: 1
    };
  }
}

module.exports = CobbledDeepslateBlock; 