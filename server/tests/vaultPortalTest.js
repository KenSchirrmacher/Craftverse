const assert = require('assert');
const World = require('../world/world');
const VaultPortalBlock = require('../blocks/vaultPortalBlock');
const VaultPortalItem = require('../items/vaultPortalItem');
const VaultDimension = require('../dimensions/vaultDimension');
const VaultPortalManager = require('../systems/vaultPortalManager');
const Player = require('../entities/player');
const ReinforcedDeepslateBlock = require('../blocks/reinforcedDeepslateBlock');
const { BlockRegistry } = require('../registry/blockRegistry');

class VaultPortalTest {
  constructor() {
    this.world = new World();
    this.vaultDimension = new VaultDimension();
    this.vaultPortalManager = new VaultPortalManager(this.world, this.vaultDimension);
    this.blockRegistry = new BlockRegistry();
    this.blockRegistry.register('reinforced_deepslate', ReinforcedDeepslateBlock);
  }

  runTests() {
    this.testVaultPortalBlock();
    this.testVaultPortalItem();
    this.testVaultDimension();
    this.testVaultPortalManager();
    this.testPortalFrameValidation();
    this.testPortalFormation();
    this.testPortalEffects();
    this.testPortalLinking();
    this.testPlayerTeleportation();
  }

  testVaultPortalBlock() {
    console.log('Testing Vault Portal Block...');
    
    // Create and place portal block
    const portalBlock = new VaultPortalBlock();
    const placedPortal = portalBlock.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test basic properties
    assert.strictEqual(placedPortal.isValidPlacement(), true);
    assert.strictEqual(placedPortal.isActive(), false);
    assert.strictEqual(placedPortal.getFrameBlocks().length, 0);
    
    // Test frame construction
    const frameBlock = new ReinforcedDeepslateBlock();
    this.world.setBlock(0, 1, 0, frameBlock);
    placedPortal.addFrameBlock({ x: 0, y: 1, z: 0 });
    assert.strictEqual(placedPortal.getFrameBlocks().length, 1);
    
    // Test activation
    placedPortal.activate();
    assert.strictEqual(placedPortal.isActive(), true);
    
    // Test deactivation
    placedPortal.deactivate();
    assert.strictEqual(placedPortal.isActive(), false);
  }

  testVaultPortalItem() {
    console.log('Testing Vault Portal Item...');
    
    // Create portal item
    const portalItem = new VaultPortalItem();
    
    // Test item properties
    assert.strictEqual(portalItem.getMaxStackSize(), 1);
    assert.strictEqual(portalItem.isPlaceable(), true);
    
    // Test item usage
    const player = new Player();
    player.position = { x: 0, y: 0, z: 0 };
    const result = portalItem.use(player, this.world, { x: 0, y: 0, z: 0 });
    assert.strictEqual(result.success, true);
  }

  testVaultDimension() {
    console.log('Testing Vault Dimension...');
    
    // Test dimension properties
    assert.strictEqual(this.vaultDimension.getDimensionId(), 'vault');
    assert.strictEqual(this.vaultDimension.getLightLevel(), 15);
    
    // Test room generation
    const room = this.vaultDimension.generateRoom();
    assert.strictEqual(room.isValid(), true);
    assert.strictEqual(room.getSize().x > 0, true);
    assert.strictEqual(room.getSize().y > 0, true);
    assert.strictEqual(room.getSize().z > 0, true);
    
    // Test loot generation
    const loot = this.vaultDimension.generateLoot(1);
    assert.strictEqual(loot.length > 0, true);
  }

  testVaultPortalManager() {
    console.log('Testing Vault Portal Manager...');
    
    // Test portal registration
    const portalBlock = new VaultPortalBlock();
    const placedPortal = portalBlock.place(this.world, { x: 0, y: 0, z: 0 });
    this.vaultPortalManager.registerPortal(placedPortal);
    assert.strictEqual(this.vaultPortalManager.getPortalCount(), 1);
    
    // Test player teleportation
    const player = new Player();
    player.position = { x: 0, y: 0, z: 0 };
    const teleportResult = this.vaultPortalManager.teleportPlayer(player, placedPortal);
    assert.strictEqual(teleportResult.success, true);
    assert.strictEqual(player.getDimension().getId(), 'vault');
    
    // Test portal linking
    const secondPortal = new VaultPortalBlock();
    const placedSecondPortal = secondPortal.place(this.world, { x: 10, y: 0, z: 10 });
    this.vaultPortalManager.registerPortal(placedSecondPortal);
    this.vaultPortalManager.linkPortals(placedPortal, placedSecondPortal);
    assert.strictEqual(this.vaultPortalManager.arePortalsLinked(placedPortal, placedSecondPortal), true);
  }

  testPortalFrameValidation() {
    console.log('Testing Portal Frame Validation...');
    
    const portalBlock = new VaultPortalBlock();
    const placedPortal = portalBlock.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create a valid 3x3 frame
    const frameBlocks = [
      {x: -1, y: 0, z: -1}, {x: 0, y: 0, z: -1}, {x: 1, y: 0, z: -1},
      {x: -1, y: 0, z: 0}, {x: 1, y: 0, z: 0},
      {x: -1, y: 0, z: 1}, {x: 0, y: 0, z: 1}, {x: 1, y: 0, z: 1}
    ];

    // Place reinforced deepslate blocks for the frame
    for (const pos of frameBlocks) {
      const block = new ReinforcedDeepslateBlock();
      this.world.setBlock(placedPortal.position.x + pos.x, placedPortal.position.y + pos.y, placedPortal.position.z + pos.z, block);
    }

    // Test frame validation
    assert.strictEqual(placedPortal.validatePortalFrame(this.world, placedPortal.position.x, placedPortal.position.y, placedPortal.position.z), true);
  }

  testPortalFormation() {
    console.log('Testing Portal Formation...');
    
    const portalBlock = new VaultPortalBlock();
    const placedPortal = portalBlock.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Start portal formation
    placedPortal.startPortalForming(this.world, placedPortal.position.x, placedPortal.position.y, placedPortal.position.z);
    
    // Test formation state
    const state = placedPortal.getState(this.world, placedPortal.position.x, placedPortal.position.y, placedPortal.position.z);
    assert.strictEqual(state.forming, true);
    
    // Wait for formation to complete
    return new Promise(resolve => {
      setTimeout(() => {
        const finalState = placedPortal.getState(this.world, placedPortal.position.x, placedPortal.position.y, placedPortal.position.z);
        assert.strictEqual(finalState.forming, false);
        assert.strictEqual(finalState.active, true);
        resolve();
      }, 3100); // Slightly longer than the 3000ms formation time
    });
  }

  testPortalEffects() {
    console.log('Testing Portal Effects...');
    
    const portalBlock = new VaultPortalBlock();
    const placedPortal = portalBlock.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test particle effects
    const particleCount = this.world.getParticleCount();
    placedPortal.createPortalParticles(this.world, placedPortal.position.x, placedPortal.position.y, placedPortal.position.z);
    assert.strictEqual(this.world.getParticleCount() > particleCount, true);
    
    // Test sound effects
    const soundCount = this.world.getSoundCount();
    placedPortal.playPortalSound(this.world, placedPortal.position.x, placedPortal.position.y, placedPortal.position.z);
    assert.strictEqual(this.world.getSoundCount() > soundCount, true);
  }

  testPortalLinking() {
    console.log('Testing Portal Linking...');
    
    const portal1 = new VaultPortalBlock();
    const portal2 = new VaultPortalBlock();
    
    const placedPortal1 = portal1.place(this.world, { x: 0, y: 0, z: 0 });
    const placedPortal2 = portal2.place(this.world, { x: 10, y: 0, z: 10 });
    
    // Test linking
    this.vaultPortalManager.linkPortals(placedPortal1, placedPortal2);
    assert.strictEqual(placedPortal1.getLinkedPortal(), placedPortal2);
    assert.strictEqual(placedPortal2.getLinkedPortal(), placedPortal1);
    
    // Test unlinking
    this.vaultPortalManager.unlinkPortals(placedPortal1, placedPortal2);
    assert.strictEqual(placedPortal1.getLinkedPortal(), null);
    assert.strictEqual(placedPortal2.getLinkedPortal(), null);
  }

  testPlayerTeleportation() {
    console.log('Testing Player Teleportation...');
    
    const portalBlock = new VaultPortalBlock();
    const placedPortal = portalBlock.place(this.world, { x: 0, y: 0, z: 0 });
    placedPortal.activate();
    
    const player = new Player();
    player.position = { x: 0, y: 0, z: 0 };
    player.setDimension(this.world.getDimension());
    
    // Test teleportation
    const teleportResult = this.vaultPortalManager.teleportPlayer(player, placedPortal);
    assert.strictEqual(teleportResult.success, true);
    assert.strictEqual(player.getDimension().getId(), 'vault');
    
    // Test return point
    const returnPoint = teleportResult.returnPoint;
    assert.strictEqual(returnPoint.dimension.getId(), this.world.getDimension().getId());
    assert.strictEqual(returnPoint.position.x, 0);
    assert.strictEqual(returnPoint.position.y, 0);
    assert.strictEqual(returnPoint.position.z, 0);
  }
}

// Run tests
const test = new VaultPortalTest();
test.runTests().then(() => {
  console.log('All Vault Portal tests passed!');
}).catch(error => {
  console.error('Vault Portal tests failed:', error);
});

module.exports = VaultPortalTest; 