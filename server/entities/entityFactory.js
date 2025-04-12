const ThrownPotion = require('./thrownPotion');
const AreaEffectCloud = require('./areaEffectCloud');

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
    
    // ... other entity types ...
    
    default:
      console.warn(`Unknown entity type: ${type}`);
      return new Entity(entityId, { type: 'unknown', ...options });
  }
} 