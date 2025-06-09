/**
 * Brewing System - Integrates the potion registry and brewing manager with the server
 */

const PotionRegistry = require('./potionRegistry');
const BrewingManager = require('./brewingManager');

class BrewingSystem {
  constructor(server) {
    this.server = server;
    
    // Initialize potion registry and brewing manager
    this.potionRegistry = new PotionRegistry();
    this.brewingManager = new BrewingManager(this.potionRegistry);
    
    // Setup server events
    this.setupEvents();
    
    // Setup server tick for brewing
    this.tickInterval = setInterval(() => this.onServerTick(), 50); // 50ms = 1 game tick
  }
  
  /**
   * Set up server events for brewing interactions
   */
  setupEvents() {
    const { server } = this;
    
    // Register brewing stand
    server.on('place_brewing_stand', (data) => {
      const { worldId, position, playerId } = data;
      const brewingStandId = this.brewingManager.registerBrewingStand(worldId, position);
      
      // Notify clients of new brewing stand
      server.io.emit('brewing_stand_placed', {
        id: brewingStandId,
        worldId,
        position,
        playerId
      });
    });
    
    // Remove brewing stand
    server.on('break_brewing_stand', (data) => {
      const { brewingStandId } = data;
      this.brewingManager.removeBrewingStand(brewingStandId);
      
      // Notify clients of removed brewing stand
      server.io.emit('brewing_stand_removed', {
        id: brewingStandId
      });
    });
    
    // Add item to brewing stand
    server.on('brewing_stand_add_item', (data) => {
      const { brewingStandId, slotIndex, item, playerId } = data;
      const success = this.brewingManager.addItemToSlot(brewingStandId, slotIndex, item);
      
      // Notify player of result
      server.io.to(playerId).emit('brewing_stand_update', {
        id: brewingStandId,
        success,
        action: 'add_item',
        slotIndex,
        item: success ? item : null
      });
      
      // If successful, notify all other clients in the area
      if (success) {
        const brewingStand = this.brewingManager.getBrewingStand(brewingStandId);
        if (brewingStand) {
          this.notifyPlayersInRange(brewingStand.worldId, brewingStand.position, {
            type: 'brewing_stand_update',
            id: brewingStandId,
            slots: brewingStand.slots,
            ingredient: brewingStand.ingredient,
            fuel: brewingStand.fuel
          }, playerId); // Exclude the player who made the change
        }
      }
    });
    
    // Remove item from brewing stand
    server.on('brewing_stand_remove_item', (data) => {
      const { brewingStandId, slotIndex, playerId } = data;
      const item = this.brewingManager.removeItemFromSlot(brewingStandId, slotIndex);
      
      // Notify player of result
      server.io.to(playerId).emit('brewing_stand_update', {
        id: brewingStandId,
        success: !!item,
        action: 'remove_item',
        slotIndex,
        item
      });
      
      // If successful, notify all other clients in the area
      if (item) {
        const brewingStand = this.brewingManager.getBrewingStand(brewingStandId);
        if (brewingStand) {
          this.notifyPlayersInRange(brewingStand.worldId, brewingStand.position, {
            type: 'brewing_stand_update',
            id: brewingStandId,
            slots: brewingStand.slots,
            ingredient: brewingStand.ingredient,
            fuel: brewingStand.fuel
          }, playerId); // Exclude the player who made the change
        }
      }
    });
    
    // Start brewing
    server.on('brewing_stand_start', (data) => {
      const { brewingStandId, playerId } = data;
      const success = this.brewingManager.startBrewing(brewingStandId);
      
      // Notify player of result
      server.io.to(playerId).emit('brewing_stand_update', {
        id: brewingStandId,
        success,
        action: 'start_brewing'
      });
      
      // If successful, notify all clients in the area
      if (success) {
        const brewingStand = this.brewingManager.getBrewingStand(brewingStandId);
        if (brewingStand) {
          this.notifyPlayersInRange(brewingStand.worldId, brewingStand.position, {
            type: 'brewing_stand_update',
            id: brewingStandId,
            brewing: true,
            progress: 0
          });
        }
      }
    });
    
    // Get potion info
    server.on('potion_info_request', (data) => {
      const { potionType, playerId } = data;
      const potionInfo = this.potionRegistry.getPotionDefinition(potionType);
      
      // Send potion info to player
      server.io.to(playerId).emit('potion_info_response', {
        potionType,
        info: potionInfo
      });
    });
    
    // Apply potion effect
    server.on('apply_potion_effect', (data) => {
      const { potionType, entityId, worldId, position, playerId, isSplash } = data;
      
      // Get potion definition
      const potionDef = this.potionRegistry.getPotionDefinition(potionType);
      if (!potionDef) return;
      
      if (isSplash) {
        // Apply splash potion effects to entities in range
        this.applyAreaPotionEffects(potionDef, worldId, position);
      } else {
        // Apply directly to target entity
        this.applyPotionToEntity(potionDef, entityId);
      }
      
      // Notify player of success
      if (playerId) {
        server.io.to(playerId).emit('potion_applied', {
          success: true,
          potionType
        });
      }
    });
  }
  
  /**
   * Process server ticks for brewing
   */
  onServerTick() {
    // Process brewing stands
    this.brewingManager.update();
    
    // Update clients about brewing progress every 10 ticks (500ms)
    if (this.server.ticks % 10 === 0) {
      this.updateBrewingStandClients();
    }
  }
  
  /**
   * Update clients with brewing stand progress
   */
  updateBrewingStandClients() {
    // Get all active brewing stands
    const activeStands = [];
    this.brewingManager.activeBrewingStands.forEach(stand => {
      if (stand.brewing) {
        activeStands.push({
          id: stand.id,
          worldId: stand.worldId,
          position: stand.position,
          progress: this.brewingManager.getBrewingProgress(stand.id)
        });
      }
    });
    
    // Notify clients about each active brewing stand
    activeStands.forEach(stand => {
      this.notifyPlayersInRange(stand.worldId, stand.position, {
        type: 'brewing_stand_progress',
        id: stand.id,
        progress: stand.progress
      });
    });
  }
  
  /**
   * Apply potion effects to an entity
   * @param {Object} potionDef - Potion definition
   * @param {string} entityId - Entity ID
   */
  applyPotionToEntity(potionDef, entityId) {
    if (!potionDef || !potionDef.effects || !entityId) return;
    
    // Get the entity
    const entity = this.server.entityManager.getEntity(entityId);
    if (!entity) return;
    
    // Apply each effect to the entity
    potionDef.effects.forEach(effect => {
      const { type, level, duration } = effect;
      
      // Add effect to entity
      this.server.entityManager.addStatusEffect(entityId, {
        type,
        level,
        duration,
        source: 'potion'
      });
    });
    
    // Notify clients of the effect application
    this.server.io.emit('entity_effects_changed', {
      entityId,
      effects: entity.statusEffects
    });
  }
  
  /**
   * Apply area-of-effect potion to entities in range
   * @param {Object} potionDef - Potion definition
   * @param {string} worldId - World ID
   * @param {Object} position - Position where potion was used
   */
  applyAreaPotionEffects(potionDef, worldId, position) {
    if (!potionDef || !potionDef.effects) return;
    
    // Get all entities in range (4 blocks for splash potions)
    const range = potionDef.isSplash ? 4 : (potionDef.isLingering ? 3 : 0);
    const entitiesInRange = this.server.entityManager.getEntitiesInRange(
      worldId, 
      position,
      range
    );
    
    // Apply effects to each entity with distance-based scaling
    entitiesInRange.forEach(entity => {
      // Calculate distance-based effect scale (closer = stronger)
      const distance = Math.sqrt(
        Math.pow(position.x - entity.position.x, 2) +
        Math.pow(position.y - entity.position.y, 2) +
        Math.pow(position.z - entity.position.z, 2)
      );
      
      // Scale from 1.0 (direct hit) to 0.25 (max range)
      const effectScale = Math.max(0.25, 1 - (distance / range));
      
      // Apply each effect with scaled duration and potency
      potionDef.effects.forEach(effect => {
        const scaledEffect = {
          type: effect.type,
          level: Math.max(1, Math.floor(effect.level * effectScale)),
          duration: Math.floor(effect.duration * effectScale),
          source: 'splash_potion'
        };
        
        // Add effect to entity
        this.server.entityManager.addStatusEffect(entity.id, scaledEffect);
      });
      
      // Notify clients of the effect application
      this.server.io.emit('entity_effects_changed', {
        entityId: entity.id,
        effects: entity.statusEffects
      });
    });
    
    // Emit particle effect at position
    this.server.io.emit('potion_splash', {
      worldId,
      position,
      color: potionDef.color,
      range
    });
  }
  
  /**
   * Notify players in range of an event
   * @param {string} worldId - World ID
   * @param {Object} position - Position
   * @param {Object} data - Event data
   * @param {string} excludePlayerId - Player ID to exclude from notification
   */
  notifyPlayersInRange(worldId, position, data, excludePlayerId = null) {
    // Get players in range (8 blocks)
    const playersInRange = this.server.playerManager.getPlayersInRange(
      worldId,
      position,
      8
    );
    
    // Send update to each player in range
    playersInRange.forEach(player => {
      if (excludePlayerId && player.id === excludePlayerId) return;
      this.server.io.to(player.id).emit(data.type, data);
    });
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    // Clear tick interval
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    
    // Save brewing stand data if needed
    const saveData = this.brewingManager.saveData();
    this.server.worldManager.setMetadata('brewing_stands', saveData);
  }
  
  /**
   * Initialize from save data
   */
  initFromSave() {
    // Load brewing stand data
    const saveData = this.server.worldManager.getMetadata('brewing_stands');
    if (saveData) {
      this.brewingManager.loadData(saveData);
    }
  }
}

module.exports = BrewingSystem; 