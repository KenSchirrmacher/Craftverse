const assert = require('assert');
const { Entity } = require('../entity/entity');
const World = require('../world/world');
const { Vector3 } = require('../math/vector3');

describe('Entity and World System', () => {
  let world;
  let entity;

  beforeEach(() => {
    world = new World({
      id: 'test_world',
      name: 'Test World',
      seed: 12345
    });

    entity = new Entity({
      id: 'test_entity',
      type: 'test',
      world: world,
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 1, y: 0, z: 0 }
    });
  });

  describe('Entity', () => {
    it('should initialize with correct properties', () => {
      assert.strictEqual(entity.id, 'test_entity');
      assert.strictEqual(entity.type, 'test');
      assert.deepStrictEqual(entity.position, { x: 0, y: 0, z: 0 });
      assert.deepStrictEqual(entity.velocity, { x: 1, y: 0, z: 0 });
      assert.strictEqual(entity.world, world);
    });

    it('should update position based on velocity', () => {
      const deltaTime = 1;
      entity.update(deltaTime);
      assert.deepStrictEqual(entity.position, { x: 1, y: 0, z: 0 });
    });

    it('should handle damage and death', () => {
      assert.strictEqual(entity.damage(10), false); // Not dead yet
      assert.strictEqual(entity.health, 10);
      assert.strictEqual(entity.damage(10), true); // Now dead
      assert.strictEqual(entity.health, 0);
      assert.strictEqual(entity.isDead, true);
    });

    it('should handle healing', () => {
      entity.damage(10);
      assert.strictEqual(entity.heal(5), false); // Not fully healed
      assert.strictEqual(entity.health, 15);
      assert.strictEqual(entity.heal(5), true); // Fully healed
      assert.strictEqual(entity.health, 20);
    });

    it('should not heal when dead', () => {
      entity.damage(20);
      assert.strictEqual(entity.heal(10), false);
      assert.strictEqual(entity.health, 0);
    });

    it('should provide correct client data', () => {
      const clientData = entity.getClientData();
      assert.deepStrictEqual(clientData, {
        id: 'test_entity',
        type: 'test',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        velocity: { x: 1, y: 0, z: 0 },
        health: 20,
        maxHealth: 20,
        isDead: false
      });
    });
  });

  describe('World', () => {
    it('should initialize with correct properties', () => {
      assert.strictEqual(world.id, 'test_world');
      assert.strictEqual(world.name, 'Test World');
      assert.strictEqual(world.seed, 12345);
      assert.strictEqual(world.time, 0);
      assert.strictEqual(world.dayTime, 0);
      assert.strictEqual(world.weather, 'clear');
    });

    it('should add and remove entities', () => {
      world.addEntity(entity);
      assert.strictEqual(world.getEntity('test_entity'), entity);
      
      world.removeEntity(entity);
      assert.strictEqual(world.getEntity('test_entity'), undefined);
    });

    it('should get all entities', () => {
      const entity2 = new Entity({
        id: 'test_entity_2',
        type: 'test',
        world: world
      });

      world.addEntity(entity);
      world.addEntity(entity2);

      const entities = world.getAllEntities();
      assert.strictEqual(entities.length, 2);
      assert.ok(entities.includes(entity));
      assert.ok(entities.includes(entity2));
    });

    it('should get entities in radius', () => {
      const entity2 = new Entity({
        id: 'test_entity_2',
        type: 'test',
        world: world,
        position: { x: 5, y: 0, z: 0 }
      });

      world.addEntity(entity);
      world.addEntity(entity2);

      const nearbyEntities = world.getEntitiesInRadius({ x: 0, y: 0, z: 0 }, 3);
      assert.strictEqual(nearbyEntities.length, 1);
      assert.strictEqual(nearbyEntities[0], entity);
    });

    it('should update world time', () => {
      const deltaTime = 1;
      world.update(deltaTime);
      assert.strictEqual(world.time, 1);
      assert.strictEqual(world.dayTime, 1);
    });

    it('should handle weather changes', () => {
      world.setWeather('rain');
      assert.strictEqual(world.weather, 'rain');
      
      assert.throws(() => {
        world.setWeather('invalid_weather');
      }, Error);
    });

    it('should provide correct client data', () => {
      world.addEntity(entity);
      const clientData = world.getClientData();
      
      assert.deepStrictEqual(clientData, {
        id: 'test_world',
        name: 'Test World',
        time: 0,
        dayTime: 0,
        weather: 'clear',
        difficulty: 'normal',
        spawnPoint: { x: 0, y: 64, z: 0 },
        entities: [entity.getClientData()]
      });
    });
  });
}); 