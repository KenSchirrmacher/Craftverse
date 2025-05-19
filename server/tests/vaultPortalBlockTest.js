const assert = require('assert');
const VaultPortalBlock = require('../blocks/vaultPortalBlock');

class TestWorld {
  constructor() {
    this.blocks = new Map();
    this.particleEffects = [];
    this.soundEffects = [];
    this.blockStates = new Map();
  }

  getBlock(x, y, z) {
    return this.blocks.get(`${x},${y},${z}`);
  }

  setBlock(x, y, z, block) {
    this.blocks.set(`${x},${y},${z}`, block);
  }

  addParticleEffect(effect) {
    this.particleEffects.push(effect);
  }

  playSound(sound) {
    this.soundEffects.push(sound);
  }

  getBlockState(x, y, z) {
    return this.blockStates.get(`${x},${y},${z}`);
  }

  setBlockState(x, y, z, state) {
    this.blockStates.set(`${x},${y},${z}`, state);
  }
}

describe('VaultPortalBlock', () => {
  let world;
  let block;
  let player;

  beforeEach(() => {
    world = new TestWorld();
    block = new VaultPortalBlock();
    player = {
      id: 'test_player',
      sendMessage: (msg) => {}
    };
  });

  describe('Portal Frame Validation', () => {
    it('should validate a correct portal frame', () => {
      // Create a 3x3 frame of reinforced deepslate
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && z === 0) continue; // Skip center
          world.setBlock(x, 0, z, { id: 'reinforced_deepslate' });
        }
      }

      assert.strictEqual(block.validatePortalFrame(world, 0, 0, 0), true);
    });

    it('should reject an incomplete portal frame', () => {
      // Create an incomplete frame
      world.setBlock(-1, 0, -1, { id: 'reinforced_deepslate' });
      world.setBlock(1, 0, 1, { id: 'reinforced_deepslate' });

      assert.strictEqual(block.validatePortalFrame(world, 0, 0, 0), false);
    });

    it('should reject a frame with wrong blocks', () => {
      // Create a frame with wrong blocks
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && z === 0) continue;
          world.setBlock(x, 0, z, { id: 'stone' });
        }
      }

      assert.strictEqual(block.validatePortalFrame(world, 0, 0, 0), false);
    });
  });

  describe('Portal Formation', () => {
    it('should start forming when placed in valid frame', () => {
      // Create valid frame
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && z === 0) continue;
          world.setBlock(x, 0, z, { id: 'reinforced_deepslate' });
        }
      }

      block.onPlace(world, 0, 0, 0, player);

      const state = block.getState(world, 0, 0, 0);
      assert.strictEqual(state.frameComplete, true);
      assert.strictEqual(state.forming, true);
    });

    it('should create forming particles', () => {
      // Create valid frame and place block
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && z === 0) continue;
          world.setBlock(x, 0, z, { id: 'reinforced_deepslate' });
        }
      }

      block.onPlace(world, 0, 0, 0, player);

      assert.strictEqual(world.particleEffects.length > 0, true);
      assert.strictEqual(world.soundEffects.length > 0, true);
    });
  });

  describe('Portal Activation', () => {
    it('should activate after formation', (done) => {
      // Create valid frame and place block
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && z === 0) continue;
          world.setBlock(x, 0, z, { id: 'reinforced_deepslate' });
        }
      }

      block.onPlace(world, 0, 0, 0, player);

      // Wait for activation
      setTimeout(() => {
        const state = block.getState(world, 0, 0, 0);
        assert.strictEqual(state.active, true);
        assert.strictEqual(state.forming, false);
        done();
      }, 3100);
    });
  });

  describe('Player Interaction', () => {
    it('should teleport player when active', () => {
      // Set up active portal
      block.setState(world, 0, 0, 0, { active: true });

      // Mock teleport
      let teleported = false;
      player.teleport = () => { teleported = true; };

      block.onPlayerInteract(world, 0, 0, 0, player);
      assert.strictEqual(teleported, true);
    });

    it('should not teleport player when inactive', () => {
      // Set up inactive portal
      block.setState(world, 0, 0, 0, { active: false });

      // Mock teleport
      let teleported = false;
      player.teleport = () => { teleported = true; };

      block.onPlayerInteract(world, 0, 0, 0, player);
      assert.strictEqual(teleported, false);
    });
  });
}); 