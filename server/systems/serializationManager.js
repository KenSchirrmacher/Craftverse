/**
 * Serialization Manager
 * Handles serialization and deserialization of game objects
 */

const Block = require('../blocks/baseBlock');
const { blockRegistry } = require('../blocks/blockRegistry');

class SerializationManager {
  constructor() {
    this.serializers = new Map();
    this.deserializers = new Map();
  }

  /**
   * Register a serializer for a specific type
   * @param {string} type - Object type
   * @param {Function} serializer - Serialization function
   */
  registerSerializer(type, serializer) {
    if (this.serializers.has(type)) {
      console.warn(`Serializer for type '${type}' already registered, overwriting`);
    }
    this.serializers.set(type, serializer);
  }

  /**
   * Register a deserializer for a specific type
   * @param {string} type - Object type
   * @param {Function} deserializer - Deserialization function
   */
  registerDeserializer(type, deserializer) {
    if (this.deserializers.has(type)) {
      console.warn(`Deserializer for type '${type}' already registered, overwriting`);
    }
    this.deserializers.set(type, deserializer);
  }

  /**
   * Serialize an object
   * @param {Object} obj - Object to serialize
   * @returns {Object} - Serialized data
   */
  serialize(obj) {
    if (!obj || !obj.type) {
      throw new Error('Object must have a type property');
    }

    const serializer = this.serializers.get(obj.type);
    if (!serializer) {
      throw new Error(`No serializer registered for type '${obj.type}'`);
    }

    return serializer(obj);
  }

  /**
   * Deserialize data into an object
   * @param {Object} data - Serialized data
   * @returns {Object} - Deserialized object
   */
  deserialize(data) {
    if (!data || !data.type) {
      throw new Error('Data must have a type property');
    }

    const deserializer = this.deserializers.get(data.type);
    if (!deserializer) {
      throw new Error(`No deserializer registered for type '${data.type}'`);
    }

    return deserializer(data);
  }

  /**
   * Serialize a block
   * @param {Object} block - Block to serialize
   * @returns {Object} - Serialized block data
   */
  serializeBlock(block) {
    return this.serialize({
      type: 'block',
      data: {
        id: block.id,
        type: block.type,
        position: block.position,
        properties: block.properties,
        metadata: block.metadata
      }
    });
  }

  /**
   * Deserialize block data
   * @param {Object} data - Serialized block data
   * @returns {Object} - Deserialized block
   */
  deserializeBlock(data) {
    // Unwrap if double-wrapped
    let blockData = data;
    if (blockData && blockData.type === 'block' && blockData.data && blockData.data.type === 'block') {
      blockData = blockData.data.data;
    }
    return this.deserialize({
      type: 'block',
      data: blockData
    });
  }

  /**
   * Serialize an entity
   * @param {Object} entity - Entity to serialize
   * @returns {Object} - Serialized entity data
   */
  serializeEntity(entity) {
    return this.serialize({
      type: 'entity',
      data: {
        id: entity.id,
        type: entity.type,
        position: entity.position,
        rotation: entity.rotation,
        velocity: entity.velocity,
        properties: entity.properties,
        metadata: entity.metadata
      }
    });
  }

  /**
   * Deserialize entity data
   * @param {Object} data - Serialized entity data
   * @returns {Object} - Deserialized entity
   */
  deserializeEntity(data) {
    return this.deserialize({
      type: 'entity',
      data: data
    });
  }

  /**
   * Clear all registered serializers and deserializers
   */
  clear() {
    this.serializers.clear();
    this.deserializers.clear();
  }
}

// Create singleton instance
const serializationManager = new SerializationManager();

// Register block serializer and deserializer
serializationManager.registerSerializer('block', (block) => {
  return {
    type: block.type || block.id,
    id: block.id,
    position: block.position,
    properties: block.properties,
    metadata: block.metadata || {},
    version: block.version || 'v1'
  };
});

serializationManager.registerDeserializer('block', (data) => {
  let inner = data.data || data;
  // Unwrap nested 'block' types
  while (inner && inner.type === 'block' && inner.data) {
    inner = inner.data;
  }
  const key = inner.type || inner.id;
  const blockClass = blockRegistry.getBlockClass
    ? blockRegistry.getBlockClass(key)
    : null;
  console.log('[DEBUG] Deserializing block:', key, '->', blockClass && blockClass.name);
  if (blockClass && typeof blockClass.deserialize === 'function') {
    return blockClass.deserialize(inner);
  }
  if (blockClass) {
    return new blockClass(inner);
  }
  return new Block(inner);
});

module.exports = serializationManager; 