/**
 * Entity Factory - Creates entity instances based on type
 */

const Entity = require('./entity');
const ThrownPotion = require('./thrownPotion');
const AreaEffectCloud = require('./areaEffectCloud');
const Boat = require('./boat');
const Firefly = require('./firefly');
const EndCrystal = require('./endCrystal');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique ID for an entity
 * @returns {string} Unique ID
 */
function generateId() {
  return uuidv4();
}

/**
 * Create an entity based on type and options
 * @param {string} type - Entity type
 * @param {string} id - Optional entity ID
 * @param {Object} options - Entity options
 * @returns {Entity} - Created entity
 */
function createEntity(type, id = null, options = {}) {
  // Generate ID if not provided
  const entityId = id || generateId();
  
  // Create entity based on type
  switch (type.toLowerCase()) {
    // ... existing entity types ...
    
    case 'thrown_potion':
      return new ThrownPotion(entityId, options);
      
    case 'area_effect_cloud':
      return new AreaEffectCloud(entityId, options);
    
    case 'boat':
      return new Boat(options.world, { id: entityId, ...options });
      
    case 'firefly':
      return new Firefly(options.world, { id: entityId, ...options });
      
    case 'end_crystal':
      return new EndCrystal(options.world, { id: entityId, ...options });
    
    // ... other entity types ...
    
    default:
      console.warn(`Unknown entity type: ${type}`);
      return new Entity(entityId, { type: 'unknown', ...options });
  }
}

module.exports = createEntity; 