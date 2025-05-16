/**
 * Camel mob test suite
 * Tests the Camel implementation for the Trails & Tales Update
 */

const assert = require('assert');
const Camel = require('../mobs/camel');

// Mock world for testing
class MockWorld {
  constructor() {
    this.blocks = {};
  }

  getBlockState(x, y, z) {
    const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
    return this.blocks[key];
  }

  setBlockState(x, y, z, blockState) {
    const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
    this.blocks[key] = blockState;
  }
}

// Mock player for testing
class MockPlayer {
  constructor(id) {
    this.id = id;
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.input = {};
    this.riding = null;
    this.inventory = {
      removeItem: (id, count) => {
        // Track removed items
        if (!this.removedItems) this.removedItems = {};
        this.removedItems[id] = (this.removedItems[id] || 0) + count;
        return true;
      }
    };
  }
}

describe('Camel', () => {
  let world;
  let camel;
  
  beforeEach(() => {
    world = new MockWorld();
    // Create a camel at position 0,0,0
    camel = new Camel({ x: 0, y: 0, z: 0 });
    
    // Create a ground block for the camel to stand on
    world.setBlockState(0, -1, 0, { type: 'stone' });
    
    // Track emitted events
    camel.emittedEvents = [];
    camel.emitEvent = (eventName, data) => {
      camel.emittedEvents.push({ eventName, data });
    };
  });
  
  describe('Basic properties', () => {
    it('should have correct type and initial properties', () => {
      assert.strictEqual(camel.type, 'camel');
      assert.strictEqual(camel.health, 32);
      assert.strictEqual(camel.maxHealth, 32);
      assert.strictEqual(camel.speed, 0.3);
      assert.strictEqual(camel.isAdult, true);
      assert.strictEqual(camel.isSitting, false);
      assert.deepStrictEqual(camel.riders, [null, null]);
      assert.strictEqual(camel.saddled, false);
    });
    
    it('should create baby camel with correct properties', () => {
      const babyCamel = new Camel({ x: 0, y: 0, z: 0 }, { isAdult: false });
      assert.strictEqual(babyCamel.isAdult, false);
      assert.strictEqual(babyCamel.age, 0);
      assert.strictEqual(babyCamel.width, 0.85);
      assert.strictEqual(babyCamel.height, 1.25);
    });
  });
  
  describe('Sitting behavior', () => {
    it('should be able to toggle sitting', () => {
      assert.strictEqual(camel.isSitting, false);
      
      camel.toggleSitting();
      assert.strictEqual(camel.isSitting, true);
      
      // Should have emitted sit animation and sound
      const sitEvent = camel.emittedEvents.find(e => 
        e.eventName === 'playAnimation' && e.data.animation === 'sit');
      assert.ok(sitEvent, 'Should emit sit animation event');
      
      const sitSoundEvent = camel.emittedEvents.find(e => 
        e.eventName === 'playSound' && e.data.sound === 'entity.camel.sit');
      assert.ok(sitSoundEvent, 'Should emit sit sound event');
      
      // Toggle back to standing
      camel.emittedEvents = []; // Clear events
      camel.sitCooldown = 0; // Reset cooldown
      
      camel.toggleSitting();
      assert.strictEqual(camel.isSitting, false);
      
      // Should have emitted stand animation and sound
      const standEvent = camel.emittedEvents.find(e => 
        e.eventName === 'playAnimation' && e.data.animation === 'stand');
      assert.ok(standEvent, 'Should emit stand animation event');
      
      const standSoundEvent = camel.emittedEvents.find(e => 
        e.eventName === 'playSound' && e.data.sound === 'entity.camel.stand');
      assert.ok(standSoundEvent, 'Should emit stand sound event');
    });
    
    it('should not move when sitting', () => {
      camel.toggleSitting();
      assert.strictEqual(camel.isSitting, true);
      
      // Try to move
      camel.velocity.x = 1;
      camel.velocity.z = 1;
      
      camel.applyPhysics(world, 1);
      
      // Velocity should be reset to 0
      assert.strictEqual(camel.velocity.x, 0);
      assert.strictEqual(camel.velocity.y, 0);
      assert.strictEqual(camel.velocity.z, 0);
    });
    
    it('should respect cooldown when toggling sitting', () => {
      camel.toggleSitting();
      assert.strictEqual(camel.isSitting, true);
      
      // Try to toggle again before cooldown expires
      camel.emittedEvents = []; // Clear events
      camel.toggleSitting();
      
      // Should still be sitting
      assert.strictEqual(camel.isSitting, true);
      assert.strictEqual(camel.emittedEvents.length, 0, 'Should not emit events during cooldown');
    });
  });
  
  describe('Dash ability', () => {
    it('should be able to dash when conditions are met', () => {
      camel.startDash();
      
      assert.strictEqual(camel.isDashing, true);
      assert.strictEqual(camel.dashProgress, 0);
      
      // Should have emitted dash animation and sound
      const dashEvent = camel.emittedEvents.find(e => 
        e.eventName === 'playAnimation' && e.data.animation === 'dash');
      assert.ok(dashEvent, 'Should emit dash animation event');
      
      const dashSoundEvent = camel.emittedEvents.find(e => 
        e.eventName === 'playSound' && e.data.sound === 'entity.camel.dash');
      assert.ok(dashSoundEvent, 'Should emit dash sound event');
    });
    
    it('should not dash when sitting', () => {
      camel.toggleSitting();
      camel.emittedEvents = []; // Clear events
      
      camel.startDash();
      
      assert.strictEqual(camel.isDashing, false, 'Should not dash when sitting');
      assert.strictEqual(camel.emittedEvents.length, 0, 'Should not emit events');
    });
    
    it('should end dash after duration expires', () => {
      camel.startDash();
      assert.strictEqual(camel.isDashing, true);
      
      // Simulate time passing
      camel.updateDashing(camel.dashDuration);
      
      assert.strictEqual(camel.isDashing, false, 'Dash should end after duration');
      assert.strictEqual(camel.dashProgress, 0, 'Dash progress should reset');
      assert.strictEqual(camel.dashCooldown, camel.dashMaxCooldown, 'Dash cooldown should be set');
    });
    
    it('should apply increased speed during dash', () => {
      camel.rotation.y = 0; // Facing +z direction
      camel.startDash();
      
      // Add a small initial velocity
      camel.velocity.z = 0.01;
      
      // Update dash and physics for a sufficient time
      for (let i = 0; i < 5; i++) {
        camel.updateDashing(1);
        camel.applyPhysics(world, 1);
      }
      
      // Should have significant velocity in z direction
      assert.ok(camel.velocity.z > 0.05, 'Should have significant forward velocity during dash');
    });
  });
  
  describe('Riding mechanics', () => {
    it('should not allow riding without a saddle', () => {
      const player = new MockPlayer('player1');
      
      const result = camel.handleRiding(player);
      assert.strictEqual(result, false, 'Should not allow riding without saddle');
      assert.deepStrictEqual(camel.riders, [null, null], 'No riders should be added');
    });
    
    it('should allow mounting and dismounting with saddle', () => {
      const player = new MockPlayer('player1');
      camel.saddled = true;
      
      // Mount player
      const mountResult = camel.handleRiding(player);
      assert.strictEqual(mountResult, true, 'Should allow mounting');
      assert.deepStrictEqual(camel.riders, [player.id, null], 'Player should be in first seat');
      assert.strictEqual(player.riding, camel.id, 'Player should reference camel as mount');
      
      // Should emit mount sound
      const mountSoundEvent = camel.emittedEvents.find(e => 
        e.eventName === 'playSound' && e.data.sound === 'entity.camel.mount');
      assert.ok(mountSoundEvent, 'Should emit mount sound');
      
      // Dismount
      camel.emittedEvents = []; // Clear events
      const dismountResult = camel.handleRiding(player);
      assert.strictEqual(dismountResult, true, 'Should allow dismounting');
      assert.deepStrictEqual(camel.riders, [null, null], 'No riders after dismount');
      assert.strictEqual(player.riding, null, 'Player should not reference camel after dismount');
      
      // Should emit dismount sound
      const dismountSoundEvent = camel.emittedEvents.find(e => 
        e.eventName === 'playSound' && e.data.sound === 'entity.camel.dismount');
      assert.ok(dismountSoundEvent, 'Should emit dismount sound');
    });
    
    it('should support two riders', () => {
      const player1 = new MockPlayer('player1');
      const player2 = new MockPlayer('player2');
      camel.saddled = true;
      
      // Mount first player
      camel.handleRiding(player1);
      assert.deepStrictEqual(camel.riders, [player1.id, null], 'First player in front seat');
      
      // Mount second player
      const result = camel.handleRiding(player2);
      assert.strictEqual(result, true, 'Should allow second rider');
      assert.deepStrictEqual(camel.riders, [player1.id, player2.id], 'Both seats filled');
      assert.strictEqual(player2.riding, camel.id, 'Second player should reference camel');
    });
    
    it('should stand up when trying to mount while sitting', () => {
      const player = new MockPlayer('player1');
      camel.saddled = true;
      camel.toggleSitting();
      camel.sitCooldown = 0; // Reset cooldown
      camel.emittedEvents = []; // Clear events
      
      const result = camel.handleRiding(player);
      assert.strictEqual(result, true, 'Interaction should succeed');
      assert.strictEqual(camel.isSitting, false, 'Camel should stand up');
      
      // Should have stand animation
      const standEvent = camel.emittedEvents.find(e => 
        e.eventName === 'playAnimation' && e.data.animation === 'stand');
      assert.ok(standEvent, 'Should emit stand animation');
    });
  });
  
  describe('Breeding mechanics', () => {
    it('should enter love state when fed cactus', () => {
      const player = new MockPlayer('player1');
      
      const result = camel.interact(player, {
        type: 'use_item',
        item: { id: 'cactus1', type: 'cactus' }
      });
      
      assert.strictEqual(result, true, 'Interaction should succeed');
      assert.strictEqual(camel.inLove, true, 'Should be in love');
      assert.ok(camel.loveCooldown > 0, 'Should have love cooldown');
      
      // Should consume cactus
      assert.strictEqual(player.removedItems.cactus1, 1, 'Should consume one cactus');
      
      // Should emit heart particles
      const particleEvent = camel.emittedEvents.find(e => 
        e.eventName === 'spawnParticle' && e.data.type === 'heart');
      assert.ok(particleEvent, 'Should emit heart particles');
    });
    
    it('should breed when two camels in love are near each other', () => {
      const camel2 = new Camel({ x: 1, y: 0, z: 0 });
      camel2.emitEvent = () => {}; // Mock event emitter for second camel
      
      // Put both camels in love state
      camel.inLove = true;
      camel2.inLove = true;
      
      // Add camels to mobs dictionary
      const mobs = {
        [camel.id]: camel,
        [camel2.id]: camel2
      };
      
      // Should breed and create baby
      camel.handleBreeding(mobs);
      
      assert.strictEqual(camel.inLove, false, 'Should no longer be in love');
      assert.strictEqual(camel.breedingPartner, camel2.id, 'Should record breeding partner');
      assert.ok(camel.loveCooldown > 0, 'Should have breeding cooldown');
      
      // Should spawn baby camel
      const spawnEvent = camel.emittedEvents.find(e => 
        e.eventName === 'spawnEntity' && e.data.entity.type === 'camel');
      assert.ok(spawnEvent, 'Should spawn baby camel');
      assert.strictEqual(spawnEvent.data.entity.isAdult, false, 'Spawned camel should be baby');
      
      // Should give XP
      const xpEvent = camel.emittedEvents.find(e => 
        e.eventName === 'giveExperience');
      assert.ok(xpEvent, 'Should give XP');
    });
    
    it('should accelerate baby growth when fed cactus', () => {
      const player = new MockPlayer('player1');
      const babyCamel = new Camel({ x: 0, y: 0, z: 0 }, { isAdult: false });
      babyCamel.emittedEvents = [];
      babyCamel.emitEvent = (eventName, data) => {
        babyCamel.emittedEvents.push({ eventName, data });
      };
      
      // For testing inventory interactions
      player.removedItems = {};
      
      const initialAge = babyCamel.age;
      
      const result = babyCamel.interact(player, {
        type: 'use_item',
        item: { id: 'cactus1', type: 'cactus' }
      });
      
      assert.strictEqual(result, true, 'Interaction should succeed');
      assert.ok(babyCamel.age > initialAge, 'Age should increase');
      
      // Should consume cactus
      assert.strictEqual(player.removedItems.cactus1, 1, 'Should consume one cactus');
      
      // Should emit growth particles
      const particleEvent = babyCamel.emittedEvents.find(e => 
        e.eventName === 'spawnParticle' && e.data.type === 'happy_villager');
      assert.ok(particleEvent, 'Should emit growth particles');
    });
  });
  
  describe('Saddle mechanics', () => {
    it('should apply saddle when used on adult camel', () => {
      const player = new MockPlayer('player1');
      
      const result = camel.interact(player, {
        type: 'use_item',
        item: { id: 'saddle1', type: 'saddle' }
      });
      
      assert.strictEqual(result, true, 'Interaction should succeed');
      assert.strictEqual(camel.saddled, true, 'Should be saddled');
      
      // Should consume saddle
      assert.strictEqual(player.removedItems.saddle1, 1, 'Should consume one saddle');
    });
    
    it('should drop saddle when killed if saddled', () => {
      camel.saddled = true;
      
      const drops = camel.getDrops();
      
      // Should include leather and saddle
      const leatherDrop = drops.find(drop => drop.type === 'leather');
      assert.ok(leatherDrop, 'Should drop leather');
      
      const saddleDrop = drops.find(drop => drop.type === 'saddle');
      assert.ok(saddleDrop, 'Should drop saddle');
      assert.strictEqual(saddleDrop.count, 1, 'Should drop one saddle');
    });
  });
  
  describe('Serialization and deserialization', () => {
    it('should correctly serialize and deserialize camel state', () => {
      // Modify some properties
      camel.saddled = true;
      camel.isSitting = true;
      camel.riders = ['player1', null];
      camel.inLove = true;
      camel.isDashing = true;
      camel.velocity = { x: 0.5, y: 0, z: 0.3 };
      
      // Serialize
      const serialized = camel.serialize();
      
      // Deserialize to new instance
      const deserialized = Camel.deserialize(serialized);
      
      // Check deserialized properties
      assert.strictEqual(deserialized.type, 'camel', 'Type should match');
      assert.strictEqual(deserialized.saddled, true, 'Saddle state should be preserved');
      assert.strictEqual(deserialized.isSitting, true, 'Sitting state should be preserved');
      assert.deepStrictEqual(deserialized.riders, ['player1', null], 'Riders should be preserved');
      assert.strictEqual(deserialized.inLove, true, 'Love state should be preserved');
      assert.strictEqual(deserialized.isDashing, true, 'Dash state should be preserved');
      assert.deepStrictEqual(deserialized.velocity, { x: 0.5, y: 0, z: 0.3 }, 'Velocity should be preserved');
    });
  });
});

// Run tests
if (require.main === module) {
  describe('Camel Tests', () => {
    before(() => {
      console.log('Running Camel tests...');
    });
    
    // Run all the tests
    describe('Camel', () => {
      // The test suite is defined above
      it('Temporary placeholder to ensure the tests run', () => {
        assert.strictEqual(1, 1);
      });
    });
    
    after(() => {
      console.log('Camel tests complete!');
    });
  });
} 