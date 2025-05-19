const assert = require('assert');
const { Entity } = require('../entities/entity');

describe('Entity', () => {
  let entity;

  beforeEach(() => {
    entity = new Entity('test-entity');
  });

  describe('Position and Movement', () => {
    it('should handle position updates', () => {
      entity.setPosition(10, 20, 30);
      const position = entity.getPosition();
      assert.strictEqual(position.x, 10);
      assert.strictEqual(position.y, 20);
      assert.strictEqual(position.z, 30);
    });

    it('should handle velocity updates', () => {
      entity.setVelocity(1, 2, 3);
      const velocity = entity.getVelocity();
      assert.strictEqual(velocity.x, 1);
      assert.strictEqual(velocity.y, 2);
      assert.strictEqual(velocity.z, 3);
    });

    it('should handle rotation updates', () => {
      entity.setRotation(45, 90);
      const rotation = entity.getRotation();
      assert.strictEqual(rotation.yaw, 45);
      assert.strictEqual(rotation.pitch, 90);
    });
  });

  describe('State Management', () => {
    it('should track ground state', () => {
      assert.strictEqual(entity.isOnGround(), false);
      entity.setOnGround(true);
      assert.strictEqual(entity.isOnGround(), true);
    });

    it('should track death state', () => {
      assert.strictEqual(entity.isDead(), false);
      entity.kill();
      assert.strictEqual(entity.isDead(), true);
    });

    it('should track age', () => {
      assert.strictEqual(entity.getTicksExisted(), 0);
      entity.tick();
      assert.strictEqual(entity.getTicksExisted(), 1);
    });
  });

  describe('Bounding Box', () => {
    it('should have default bounding box', () => {
      const box = entity.getBoundingBox();
      assert.strictEqual(box.minX, -0.3);
      assert.strictEqual(box.minY, 0);
      assert.strictEqual(box.minZ, -0.3);
      assert.strictEqual(box.maxX, 0.3);
      assert.strictEqual(box.maxY, 1.8);
      assert.strictEqual(box.maxZ, 0.3);
    });

    it('should allow custom bounding box', () => {
      entity.setBoundingBox(-1, -1, -1, 1, 1, 1);
      const box = entity.getBoundingBox();
      assert.strictEqual(box.minX, -1);
      assert.strictEqual(box.minY, -1);
      assert.strictEqual(box.minZ, -1);
      assert.strictEqual(box.maxX, 1);
      assert.strictEqual(box.maxY, 1);
      assert.strictEqual(box.maxZ, 1);
    });
  });

  describe('Collision Detection', () => {
    it('should detect collisions between entities', () => {
      const entity1 = new Entity('entity1');
      const entity2 = new Entity('entity2');

      entity1.setPosition(0, 0, 0);
      entity2.setPosition(0.5, 0, 0);

      assert.strictEqual(entity1.collidesWith(entity2), true);
    });

    it('should not detect collisions between distant entities', () => {
      const entity1 = new Entity('entity1');
      const entity2 = new Entity('entity2');

      entity1.setPosition(0, 0, 0);
      entity2.setPosition(10, 0, 0);

      assert.strictEqual(entity1.collidesWith(entity2), false);
    });
  });

  describe('Distance Calculation', () => {
    it('should calculate distance between entities', () => {
      const entity1 = new Entity('entity1');
      const entity2 = new Entity('entity2');

      entity1.setPosition(0, 0, 0);
      entity2.setPosition(3, 4, 0);

      assert.strictEqual(entity1.isWithinDistance(entity2, 5), true);
      assert.strictEqual(entity1.isWithinDistance(entity2, 4), false);
    });
  });
}); 