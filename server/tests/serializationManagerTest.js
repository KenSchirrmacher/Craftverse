const { TestBase } = require('./testBase');
const serializationManager = require('../systems/serializationManager');

class SerializationManagerTest extends TestBase {
  constructor() {
    super('SerializationManagerTest');
  }

  runTests() {
    this.testBlockSerialization();
    this.testEntitySerialization();
    this.testCustomTypeSerialization();
    this.testErrorHandling();
  }

  testBlockSerialization() {
    const block = {
      id: 'test_block',
      type: 'tuff_bricks',
      position: { x: 1, y: 2, z: 3 },
      properties: { facing: 'north', powered: true },
      metadata: { customData: 'test' }
    };

    // Register block serializer
    serializationManager.registerSerializer('block', (obj) => obj.data);

    // Register block deserializer
    serializationManager.registerDeserializer('block', (data) => data.data);

    // Test serialization
    const serialized = serializationManager.serializeBlock(block);
    this.assert(serialized.id === block.id, 'Block ID should be preserved');
    this.assert(serialized.type === block.type, 'Block type should be preserved');
    this.assert(serialized.position.x === block.position.x, 'Block position X should be preserved');
    this.assert(serialized.properties.facing === block.properties.facing, 'Block properties should be preserved');
    this.assert(serialized.metadata.customData === block.metadata.customData, 'Block metadata should be preserved');

    // Test deserialization
    const deserialized = serializationManager.deserializeBlock(serialized);
    this.assert(deserialized.id === block.id, 'Deserialized block ID should match');
    this.assert(deserialized.type === block.type, 'Deserialized block type should match');
    this.assert(deserialized.position.x === block.position.x, 'Deserialized block position X should match');
    this.assert(deserialized.properties.facing === block.properties.facing, 'Deserialized block properties should match');
    this.assert(deserialized.metadata.customData === block.metadata.customData, 'Deserialized block metadata should match');
  }

  testEntitySerialization() {
    const entity = {
      id: 'test_entity',
      type: 'player',
      position: { x: 1, y: 2, z: 3 },
      rotation: { yaw: 45, pitch: 30 },
      velocity: { x: 0.1, y: 0, z: 0.1 },
      properties: { health: 20, armor: 10 },
      metadata: { customData: 'test' }
    };

    // Register entity serializer
    serializationManager.registerSerializer('entity', (obj) => obj.data);

    // Register entity deserializer
    serializationManager.registerDeserializer('entity', (data) => data.data);

    // Test serialization
    const serialized = serializationManager.serializeEntity(entity);
    this.assert(serialized.id === entity.id, 'Entity ID should be preserved');
    this.assert(serialized.type === entity.type, 'Entity type should be preserved');
    this.assert(serialized.position.x === entity.position.x, 'Entity position X should be preserved');
    this.assert(serialized.rotation.yaw === entity.rotation.yaw, 'Entity rotation should be preserved');
    this.assert(serialized.velocity.x === entity.velocity.x, 'Entity velocity should be preserved');
    this.assert(serialized.properties.health === entity.properties.health, 'Entity properties should be preserved');
    this.assert(serialized.metadata.customData === entity.metadata.customData, 'Entity metadata should be preserved');

    // Test deserialization
    const deserialized = serializationManager.deserializeEntity(serialized);
    this.assert(deserialized.id === entity.id, 'Deserialized entity ID should match');
    this.assert(deserialized.type === entity.type, 'Deserialized entity type should match');
    this.assert(deserialized.position.x === entity.position.x, 'Deserialized entity position X should match');
    this.assert(deserialized.rotation.yaw === entity.rotation.yaw, 'Deserialized entity rotation should match');
    this.assert(deserialized.velocity.x === entity.velocity.x, 'Deserialized entity velocity should match');
    this.assert(deserialized.properties.health === entity.properties.health, 'Deserialized entity properties should match');
    this.assert(deserialized.metadata.customData === entity.metadata.customData, 'Deserialized entity metadata should match');
  }

  testCustomTypeSerialization() {
    const customObj = {
      type: 'custom',
      data: {
        name: 'test',
        value: 42,
        nested: { key: 'value' }
      }
    };

    // Register custom serializer
    serializationManager.registerSerializer('custom', (obj) => obj.data);

    // Register custom deserializer
    serializationManager.registerDeserializer('custom', (data) => data.data);

    // Test serialization
    const serialized = serializationManager.serialize(customObj);
    this.assert(serialized.name === customObj.data.name, 'Custom object name should be preserved');
    this.assert(serialized.value === customObj.data.value, 'Custom object value should be preserved');
    this.assert(serialized.nested.key === customObj.data.nested.key, 'Custom object nested data should be preserved');

    // Test deserialization
    const deserialized = serializationManager.deserialize({ type: 'custom', data: serialized });
    this.assert(deserialized.name === customObj.data.name, 'Deserialized custom object name should match');
    this.assert(deserialized.value === customObj.data.value, 'Deserialized custom object value should match');
    this.assert(deserialized.nested.key === customObj.data.nested.key, 'Deserialized custom object nested data should match');
  }

  testErrorHandling() {
    // Test missing type
    try {
      serializationManager.serialize({ data: {} });
      this.fail('Should throw error for missing type');
    } catch (error) {
      this.assert(error.message === 'Object must have a type property', 'Should throw correct error for missing type');
    }

    // Test unregistered type
    try {
      serializationManager.serialize({ type: 'unknown', data: {} });
      this.fail('Should throw error for unregistered type');
    } catch (error) {
      this.assert(error.message === 'No serializer registered for type \'unknown\'', 'Should throw correct error for unregistered type');
    }

    // Test invalid data
    try {
      serializationManager.deserialize(null);
      this.fail('Should throw error for null data');
    } catch (error) {
      this.assert(error.message === 'Data must have a type property', 'Should throw correct error for null data');
    }
  }
}

module.exports = SerializationManagerTest; 