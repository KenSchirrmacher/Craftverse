/**
 * Wind Charge Item - Projectile item from Minecraft 1.21 Tricky Trials Update
 * Can be used to launch a wind charge, which moves blocks and damages entities
 * Enhanced with trajectory prediction for Minecraft 1.24 Update (Trail Tales)
 */
const Item = require('./item');
const { v4: uuidv4 } = require('uuid');
const WindTrajectoryPredictor = require('../utils/windTrajectoryPredictor');

class WindChargeItem extends Item {
  /**
   * Create a Wind Charge item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: 'wind_charge',
      name: 'Wind Charge',
      type: 'wind_charge',
      subtype: 'throwable',
      category: 'combat',
      stackable: true,
      maxStackSize: 16,
      texture: 'wind_charge',
      description: 'A powerful projectile that can push blocks and entities',
      ...options
    });
    
    // Wind charge specific properties
    this.damage = options.damage || 5;
    this.moveDistance = options.moveDistance || 1;
    this.explosionRadius = options.explosionRadius || 1.5;
    this.cooldown = 20; // 1 second cooldown (20 ticks)
    
    // Charging mechanics
    this.maxChargeTime = 60; // 3 seconds at 20 ticks/second
    this.chargeLevels = [
      { name: 'weak', threshold: 0, damageMultiplier: 1.0, radiusMultiplier: 1.0, powerMultiplier: 1.0 },
      { name: 'medium', threshold: 20, damageMultiplier: 1.5, radiusMultiplier: 1.3, powerMultiplier: 1.5 },
      { name: 'strong', threshold: 40, damageMultiplier: 2.0, radiusMultiplier: 1.6, powerMultiplier: 2.0 }
    ];
    
    // Trajectory prediction
    this.trajectoryPredictor = new WindTrajectoryPredictor({
      chargeLevels: [
        { name: 'weak', predictionSteps: 30, accuracyFactor: 0.8 },
        { name: 'medium', predictionSteps: 60, accuracyFactor: 0.9 },
        { name: 'strong', predictionSteps: 100, accuracyFactor: 1.0 }
      ]
    });
    
    // Configuration for trajectory updates
    this.trajectoryUpdateInterval = 5; // Update every 5 ticks
  }
  
  /**
   * Calculate the predicted trajectory for the wind charge
   * @param {Object} player - The player using the item
   * @param {number} chargeLevel - Current charge level
   * @returns {Object} Trajectory rendering data
   */
  calculateTrajectory(player, chargeLevel) {
    // Get charge level modifiers
    const chargeModifiers = this.chargeLevels[chargeLevel];
    
    // Calculate initial velocity based on charge level
    const velocity = 1.5 * chargeModifiers.powerMultiplier;
    
    // Get player's look direction
    const direction = player.getLookDirection ? player.getLookDirection() : {
      x: -Math.sin(player.rotation.y) * Math.cos(player.rotation.x),
      y: -Math.sin(player.rotation.x),
      z: Math.cos(player.rotation.y) * Math.cos(player.rotation.x)
    };
    
    // Calculate start position (player's eye position)
    const startPosition = {
      x: player.position.x,
      y: player.position.y + 1.6, // Eye height
      z: player.position.z
    };
    
    // Get world for obstacle detection
    const world = player.world || null;
    
    // Predict trajectory
    const trajectoryPoints = this.trajectoryPredictor.predictTrajectory(
      startPosition, direction, velocity, world, chargeLevel
    );
    
    // Get render data for client
    return this.trajectoryPredictor.getTrajectoryRenderData(trajectoryPoints, chargeLevel);
  }
  
  /**
   * Start charging the wind charge
   * @param {Object} player - The player using the item
   * @param {Object} context - Use context
   * @returns {Object|boolean} Charging start info or false if unsuccessful
   */
  useStart(player, context) {
    // Check cooldown
    const lastUseTime = player.cooldowns?.wind_charge || 0;
    const currentTime = Date.now();
    
    if (currentTime - lastUseTime < this.cooldown * 50) {
      return false;
    }
    
    // Start charging - create a new charging context for the player
    if (!player.charging) {
      player.charging = {};
    }
    
    player.charging.wind_charge = {
      startTime: currentTime,
      chargeLevel: 0,
      lastParticleTime: currentTime,
      lastTrajectoryUpdateTime: currentTime
    };
    
    // Calculate initial trajectory prediction
    const initialTrajectory = this.calculateTrajectory(player, 0);
    
    return {
      type: 'wind_charge_charging',
      playerId: player.id,
      startTime: currentTime,
      trajectoryData: initialTrajectory
    };
  }
  
  /**
   * Update the charging state
   * @param {Object} player - The player using the item
   * @param {Object} context - Use context
   * @param {number} delta - Time since last update
   * @returns {Object|null} Charging update info or null
   */
  useUpdate(player, context, delta) {
    if (!player.charging || !player.charging.wind_charge) {
      return null;
    }
    
    const currentTime = Date.now();
    const chargeDuration = currentTime - player.charging.wind_charge.startTime;
    
    // Calculate current charge level
    let newChargeLevel = 0;
    for (let i = this.chargeLevels.length - 1; i >= 0; i--) {
      if (chargeDuration >= this.chargeLevels[i].threshold * 50) { // Convert ticks to ms
        newChargeLevel = i;
        break;
      }
    }
    
    // If charge level changed, update it and recalculate trajectory
    if (newChargeLevel !== player.charging.wind_charge.chargeLevel) {
      player.charging.wind_charge.chargeLevel = newChargeLevel;
      
      // Calculate trajectory for new charge level
      const trajectoryData = this.calculateTrajectory(player, newChargeLevel);
      
      // Create visual/audio feedback for charge level change
      return {
        type: 'wind_charge_charge_level',
        playerId: player.id,
        chargeLevel: newChargeLevel,
        chargeName: this.chargeLevels[newChargeLevel].name,
        trajectoryData: trajectoryData
      };
    }
    
    // Update trajectory periodically (based on player movement or time interval)
    const shouldUpdateTrajectory = 
      currentTime - player.charging.wind_charge.lastTrajectoryUpdateTime > this.trajectoryUpdateInterval * 50;
    
    if (shouldUpdateTrajectory) {
      player.charging.wind_charge.lastTrajectoryUpdateTime = currentTime;
      
      // Recalculate trajectory
      const trajectoryData = this.calculateTrajectory(player, newChargeLevel);
      
      return {
        type: 'wind_charge_trajectory_update',
        playerId: player.id,
        chargeLevel: newChargeLevel,
        trajectoryData: trajectoryData
      };
    }
    
    // Generate particles for visual feedback (every 200ms)
    if (currentTime - player.charging.wind_charge.lastParticleTime > 200) {
      player.charging.wind_charge.lastParticleTime = currentTime;
      
      // More particles for higher charge levels
      const particleCount = 1 + newChargeLevel * 2;
      
      return {
        type: 'wind_charge_charging_particles',
        playerId: player.id,
        chargeLevel: newChargeLevel,
        particleCount: particleCount
      };
    }
    
    return null;
  }
  
  /**
   * Use the wind charge (on release)
   * @param {Object} player - The player using the item
   * @param {Object} context - Use context
   * @returns {Object|boolean} Wind charge entity data or false if unsuccessful
   */
  use(player, context) {
    // Check if there's an active charging context
    let chargeLevel = 0;
    let chargeDuration = 0;
    
    if (player.charging && player.charging.wind_charge) {
      const currentTime = Date.now();
      chargeDuration = currentTime - player.charging.wind_charge.startTime;
      
      // Find the highest reached charge level
      for (let i = this.chargeLevels.length - 1; i >= 0; i--) {
        if (chargeDuration >= this.chargeLevels[i].threshold * 50) { // Convert ticks to ms
          chargeLevel = i;
          break;
        }
      }
      
      // Clean up charging context
      delete player.charging.wind_charge;
    } else {
      // If not charging, check cooldown for immediate use
      const lastUseTime = player.cooldowns?.wind_charge || 0;
      const currentTime = Date.now();
      
      if (currentTime - lastUseTime < this.cooldown * 50) {
        return false;
      }
    }
    
    // Set cooldown
    if (player.cooldowns) {
      player.cooldowns.wind_charge = Date.now();
    }
    
    // Get charge level modifiers
    const chargeModifiers = this.chargeLevels[chargeLevel];
    
    // Calculate direction based on player look direction
    const direction = player.getLookDirection ? player.getLookDirection() : {
      x: -Math.sin(player.rotation.y) * Math.cos(player.rotation.x),
      y: -Math.sin(player.rotation.x),
      z: Math.cos(player.rotation.y) * Math.cos(player.rotation.x)
    };
    
    // Create wind charge entity
    const windChargeData = {
      id: uuidv4(),
      type: 'wind_charge_entity',
      position: {
        x: player.position.x,
        y: player.position.y + 1.6, // Eye height
        z: player.position.z
      },
      direction: direction,
      shooter: player.id,
      damage: this.damage * chargeModifiers.damageMultiplier,
      velocity: 1.5 * chargeModifiers.powerMultiplier,
      gravity: 0.03,
      radius: this.explosionRadius * chargeModifiers.radiusMultiplier,
      moveDistance: this.moveDistance * chargeModifiers.powerMultiplier,
      chargeLevel: chargeLevel,
      chargeName: chargeModifiers.name
    };
    
    // Cancel trajectory display
    const trajectoryCancel = {
      type: 'wind_charge_trajectory_cancel',
      playerId: player.id
    };
    
    // In Creative mode, don't consume the item
    if (player.gameMode !== 'creative') {
      // If the item has a count, reduce it
      if (context.itemStack && context.itemStack.count) {
        context.itemStack.count--;
      }
    }
    
    // Send trajectory cancel event if possible
    if (player.sendEvent) {
      player.sendEvent(trajectoryCancel);
    }
    
    return windChargeData;
  }
  
  /**
   * Get tooltip text for the wind charge
   * @returns {string[]} Tooltip lines
   */
  getTooltip() {
    const tooltip = super.getTooltip();
    tooltip.push(`Damage: ${this.damage}`);
    tooltip.push('Pushes entities and blocks');
    tooltip.push('Hold use to charge (up to 3 levels)');
    tooltip.push('Shows predicted trajectory while charging');
    return tooltip;
  }
  
  /**
   * Convert item to JSON representation
   * @returns {Object} JSON data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      damage: this.damage,
      moveDistance: this.moveDistance,
      explosionRadius: this.explosionRadius
    };
  }
  
  /**
   * Create a wind charge item from JSON data
   * @param {Object} data - JSON data
   * @returns {WindChargeItem} Wind charge item
   */
  static fromJSON(data) {
    return new WindChargeItem({
      damage: data.damage,
      moveDistance: data.moveDistance,
      explosionRadius: data.explosionRadius
    });
  }
}

module.exports = WindChargeItem; 