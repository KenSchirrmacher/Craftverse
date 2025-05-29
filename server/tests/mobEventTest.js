const assert = require('assert');
const TestBase = require('./testBase');
const World = require('../world/world');
const Allay = require('../mobs/allay');
const Camel = require('../mobs/camel');
const { Frog, Tadpole } = require('../mobs/frogAndTadpole');
const Sniffer = require('../mobs/sniffer');
const { Zombie, Skeleton, Creeper } = require('../mobs/hostileMobs');

class MobEventTest extends TestBase {
  constructor() {
    super('Mob Event Test');
    this.world = new World();
    this.events = [];
    
    // Set up event listener
    this.world.on('*', (eventName, data) => {
      this.events.push({ eventName, data });
    });

    this.test('Allay event emission', async () => {
      const allay = new Allay({ x: 0, y: 64, z: 0 });
      allay.world = this.world;
      
      // Test item collection event
      allay.heldItem = { type: 'diamond', count: 1 };
      allay.emitEvent('allay_collected_item', {
        id: allay.id,
        item: allay.heldItem,
        position: allay.position
      });
      
      const collectedEvent = this.events.find(e => e.eventName === 'allay_collected_item');
      assert.ok(collectedEvent, 'Should emit item collection event');
      assert.strictEqual(collectedEvent.data.item.type, 'diamond', 'Event should contain correct item data');
      
      // Test dancing event
      allay.emitEvent('allay_dancing', {
        id: allay.id,
        noteBlockPosition: { x: 0, y: 64, z: 0 },
        note: 12
      });
      
      const dancingEvent = this.events.find(e => e.eventName === 'allay_dancing');
      assert.ok(dancingEvent, 'Should emit dancing event');
      assert.strictEqual(dancingEvent.data.note, 12, 'Event should contain correct note data');
    });

    this.test('Camel event emission', async () => {
      const camel = new Camel({ x: 0, y: 64, z: 0 });
      camel.world = this.world;
      
      // Test dash event
      camel.emitEvent('playAnimation', { entityId: camel.id, animation: 'dash' });
      camel.emitEvent('playSound', { sound: 'entity.camel.dash', position: camel.position });
      
      const dashAnimEvent = this.events.find(e => e.eventName === 'playAnimation' && e.data.animation === 'dash');
      assert.ok(dashAnimEvent, 'Should emit dash animation event');
      
      const dashSoundEvent = this.events.find(e => e.eventName === 'playSound' && e.data.sound === 'entity.camel.dash');
      assert.ok(dashSoundEvent, 'Should emit dash sound event');
    });

    this.test('Frog event emission', async () => {
      const frog = new Frog({ x: 0, y: 64, z: 0 });
      frog.world = this.world;
      
      // Test tongue attack event
      frog.emitEvent('frog_tongue_attack', {
        id: frog.id,
        targetId: 'test-target',
        position: frog.position,
        targetPosition: { x: 1, y: 64, z: 1 }
      });
      
      const attackEvent = this.events.find(e => e.eventName === 'frog_tongue_attack');
      assert.ok(attackEvent, 'Should emit tongue attack event');
      assert.strictEqual(attackEvent.data.targetId, 'test-target', 'Event should contain correct target data');
    });

    this.test('Sniffer event emission', async () => {
      const sniffer = new Sniffer({ x: 0, y: 64, z: 0 });
      sniffer.world = this.world;
      
      // Test sniffing event
      sniffer.emitEvent('playAnimation', { entityId: sniffer.id, animation: 'sniffing_start' });
      sniffer.emitEvent('playSound', { sound: 'entity.sniffer.sniffing', position: sniffer.position });
      
      const sniffAnimEvent = this.events.find(e => e.eventName === 'playAnimation' && e.data.animation === 'sniffing_start');
      assert.ok(sniffAnimEvent, 'Should emit sniffing animation event');
      
      const sniffSoundEvent = this.events.find(e => e.eventName === 'playSound' && e.data.sound === 'entity.sniffer.sniffing');
      assert.ok(sniffSoundEvent, 'Should emit sniffing sound event');
    });

    this.test('Hostile mob event emission', async () => {
      // Test Zombie events
      const zombie = new Zombie({ x: 0, y: 64, z: 0 });
      zombie.world = this.world;
      
      zombie.emitEvent('mob_attack', {
        id: zombie.id,
        targetId: 'test-player',
        damage: zombie.attackDamage
      });
      
      const zombieAttackEvent = this.events.find(e => e.eventName === 'mob_attack');
      assert.ok(zombieAttackEvent, 'Should emit attack event');
      assert.strictEqual(zombieAttackEvent.data.damage, zombie.attackDamage, 'Event should contain correct damage data');
      
      // Test Skeleton events
      const skeleton = new Skeleton({ x: 0, y: 64, z: 0 });
      skeleton.world = this.world;
      
      const arrowData = skeleton.shoot({ position: { x: 1, y: 64, z: 1 } });
      assert.ok(arrowData, 'Should generate arrow data');
      assert.strictEqual(arrowData.type, 'arrow', 'Should create arrow projectile');
      
      // Test Creeper events
      const creeper = new Creeper({ x: 0, y: 64, z: 0 });
      creeper.world = this.world;
      
      const explosionData = creeper.explode();
      assert.ok(explosionData, 'Should generate explosion data');
      assert.strictEqual(explosionData.radius, creeper.attackRange, 'Should have correct explosion radius');
    });
  }

  async runTests() {
    console.log('\nRunning Mob Event Tests...');
    
    await this.testAllayEvents();
    await this.testCamelEvents();
    await this.testFrogEvents();
    await this.testSnifferEvents();
    await this.testHostileMobEvents();
    
    console.log('All Mob Event tests completed!');
  }

  async testAllayEvents() {
    await this.test('Allay event emission');
  }

  async testCamelEvents() {
    await this.test('Camel event emission');
  }

  async testFrogEvents() {
    await this.test('Frog event emission');
  }

  async testSnifferEvents() {
    await this.test('Sniffer event emission');
  }

  async testHostileMobEvents() {
    await this.test('Hostile mob event emission');
  }
}

(async () => {
  const test = new MobEventTest();
  const results = await test.runTests();
  console.log(results);
})(); 