class RedstoneManager {
  constructor() {
    this.poweredBlocks = new Map();
  }

  setPower(block, power) {
    if (power < 0 || power > 15) {
      throw new Error('Redstone power must be between 0 and 15');
    }
    this.poweredBlocks.set(block, power);
  }

  getPower(block) {
    return this.poweredBlocks.get(block) || 0;
  }

  update() {
    for (const [block, power] of this.poweredBlocks.entries()) {
      if (power > 0) {
        this.poweredBlocks.set(block, power - 1);
      }
    }
  }
}

module.exports = RedstoneManager; 