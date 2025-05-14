const Block = require('./block');

class DeepslateBlock extends Block {
  constructor() {
    super({
      id: 'deepslate',
      name: 'Deepslate',
      hardness: 3.0,
      blastResistance: 6.0,
      toolType: 'pickaxe',
      toolLevel: 1,
      transparent: false,
      solid: true,
      color: '#4A4A4A'
    });
  }

  onBreak(world, x, y, z) {
    // Drop cobbled deepslate when broken without silk touch
    if (!this.hasSilkTouch()) {
      world.dropItem(x, y, z, {
        type: 'cobbled_deepslate',
        count: 1
      });
    } else {
      super.onBreak(world, x, y, z);
    }
  }

  getDrops() {
    if (this.hasSilkTouch()) {
      return {
        type: 'deepslate',
        count: 1
      };
    }
    return {
      type: 'cobbled_deepslate',
      count: 1
    };
  }
}

module.exports = DeepslateBlock; 