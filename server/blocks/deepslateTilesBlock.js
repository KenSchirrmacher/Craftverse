const Block = require('./block');

class DeepslateTilesBlock extends Block {
  constructor() {
    super({
      id: 'deepslate_tiles',
      name: 'Deepslate Tiles',
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
      type: 'deepslate_tiles',
      count: 1
    });
  }

  getDrops() {
    return {
      type: 'deepslate_tiles',
      count: 1
    };
  }
}

module.exports = DeepslateTilesBlock; 