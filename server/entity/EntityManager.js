/**
 * EntityManager - Manages all entities in the world
 */

class EntityManager {
  constructor(world) {
    this.world = world;
    this.entities = new Map();
    this.nextEntityId = 1;
  }

  /**
   * Add an entity to the world
   * @param {Entity} entity - The entity to add
   * @returns {string} The entity's ID
   */
  addEntity(entity) {
    const id = `entity_${this.nextEntityId++}`;
    entity.id = id;
    this.entities.set(id, entity);
    return id;
  }

  /**
   * Remove an entity from the world
   * @param {string} entityId - The ID of the entity to remove
   * @returns {boolean} Whether the entity was removed
   */
  removeEntity(entityId) {
    return this.entities.delete(entityId);
  }

  /**
   * Get an entity by ID
   * @param {string} entityId - The ID of the entity to get
   * @returns {Entity|null} The entity, or null if not found
   */
  getEntity(entityId) {
    return this.entities.get(entityId) || null;
  }

  /**
   * Get all entities in the world
   * @returns {Array} Array of all entities
   */
  getAllEntities() {
    return Array.from(this.entities.values());
  }

  /**
   * Get entities within a region
   * @param {number} x1 - Start X coordinate
   * @param {number} y1 - Start Y coordinate
   * @param {number} z1 - Start Z coordinate
   * @param {number} x2 - End X coordinate
   * @param {number} y2 - End Y coordinate
   * @param {number} z2 - End Z coordinate
   * @returns {Array} Array of entities in the region
   */
  getEntitiesInRegion(x1, y1, z1, x2, y2, z2) {
    return this.getAllEntities().filter(entity => {
      const pos = entity.getPosition();
      return pos.x >= x1 && pos.x <= x2 &&
             pos.y >= y1 && pos.y <= y2 &&
             pos.z >= z1 && pos.z <= z2;
    });
  }

  /**
   * Update all entities
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    for (const entity of this.entities.values()) {
      entity.update(deltaTime);
    }
  }

  /**
   * Save all entities
   */
  save() {
    // In a real implementation, this would save entities to disk
    // For testing purposes, we'll just return true
    return true;
  }

  /**
   * Load all entities
   */
  load() {
    // In a real implementation, this would load entities from disk
    // For testing purposes, we'll just return true
    return true;
  }
}

module.exports = { EntityManager }; 