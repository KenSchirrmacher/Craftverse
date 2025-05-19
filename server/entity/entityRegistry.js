/**
 * EntityRegistry - Manages entity types and their registration
 */

class EntityRegistry {
  constructor() {
    this.entities = new Map();
  }

  /**
   * Register an entity type
   * @param {string} id - The entity type ID
   * @param {Function} entityClass - The entity class constructor
   */
  register(id, entityClass) {
    if (this.entities.has(id)) {
      throw new Error(`Entity type ${id} is already registered`);
    }
    this.entities.set(id, entityClass);
  }

  /**
   * Get an entity class by ID
   * @param {string} id - The entity type ID
   * @returns {Function} The entity class constructor
   */
  get(id) {
    const entityClass = this.entities.get(id);
    if (!entityClass) {
      throw new Error(`Entity type ${id} is not registered`);
    }
    return entityClass;
  }

  /**
   * Check if an entity type is registered
   * @param {string} id - The entity type ID
   * @returns {boolean} Whether the entity type is registered
   */
  has(id) {
    return this.entities.has(id);
  }

  /**
   * Create a new entity instance
   * @param {string} id - The entity type ID
   * @param {World} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @returns {Entity} The new entity instance
   */
  create(id, world, x, y, z) {
    const entityClass = this.get(id);
    return new entityClass(world, x, y, z);
  }

  /**
   * Get all registered entity types
   * @returns {Array} Array of entity type IDs
   */
  getAllTypes() {
    return Array.from(this.entities.keys());
  }
}

module.exports = { EntityRegistry }; 