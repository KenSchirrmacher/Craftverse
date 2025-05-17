/**
 * Spell Manager - Handles spell registration, casting, and effects
 * Part of the Minecraft 1.22 "Sorcery Update" features
 */

const { v4: uuidv4 } = require('uuid');
const { SpellRegistry } = require('./spellRegistry');

class SpellManager {
  constructor(server) {
    this.server = server;
    this.spells = new Map(); // Map of all registered spells
    this.activeSpells = new Map(); // Map of currently active spells
    this.playerSpells = new Map(); // Map of player ID to known spells
    this.playerMana = new Map(); // Map of player ID to mana values
    this.cooldowns = new Map(); // Map of player ID to spell cooldowns
    
    // Constants
    this.BASE_MANA = 100; // Base mana pool for all players
    this.MANA_REGEN_RATE = 1; // Mana points regenerated per second
    this.MAX_SPELL_LEVEL = 5; // Maximum level for upgradable spells
    
    // Create spell registry
    this.registry = new SpellRegistry();
    this.initializeSpells();
    
    // Bind event handlers
    this.handlePlayerJoin = this.handlePlayerJoin.bind(this);
    this.handlePlayerLeave = this.handlePlayerLeave.bind(this);
    this.handleCastSpell = this.handleCastSpell.bind(this);
    this.updateActiveSpells = this.updateActiveSpells.bind(this);
    this.updateCooldowns = this.updateCooldowns.bind(this);
    this.regeneratePlayerMana = this.regeneratePlayerMana.bind(this);
  }
  
  /**
   * Initialize the spell system
   */
  initialize() {
    if (!this.server) return;
    
    // Register events
    if (this.server.eventEmitter) {
      this.server.eventEmitter.on('playerJoin', this.handlePlayerJoin);
      this.server.eventEmitter.on('playerLeave', this.handlePlayerLeave);
      this.server.eventEmitter.on('castSpell', this.handleCastSpell);
    }
    
    // Set up interval for updating active spells
    this.activeSpellsInterval = setInterval(this.updateActiveSpells, 100);
    
    // Set up interval for updating cooldowns
    this.cooldownsInterval = setInterval(this.updateCooldowns, 1000);
    
    // Set up interval for mana regeneration
    this.manaRegenInterval = setInterval(this.regeneratePlayerMana, 1000);
    
    console.log('[SpellManager] Initialized spell system');
  }
  
  /**
   * Clean up resources when shutting down
   */
  cleanup() {
    // Clear intervals
    clearInterval(this.activeSpellsInterval);
    clearInterval(this.cooldownsInterval);
    clearInterval(this.manaRegenInterval);
    
    // Unregister events
    if (this.server?.eventEmitter) {
      // Use removeListener if off is not available (for compatibility)
      const removeMethod = this.server.eventEmitter.off || this.server.eventEmitter.removeListener;
      if (removeMethod) {
        removeMethod.call(this.server.eventEmitter, 'playerJoin', this.handlePlayerJoin);
        removeMethod.call(this.server.eventEmitter, 'playerLeave', this.handlePlayerLeave);
        removeMethod.call(this.server.eventEmitter, 'castSpell', this.handleCastSpell);
      }
    }
    
    console.log('[SpellManager] Cleaned up spell system');
  }
  
  /**
   * Initialize spells from registry
   */
  initializeSpells() {
    if (!this.registry) return;
    
    // Register all spells from registry
    const spellDefinitions = this.registry.getAllSpellDefinitions();
    
    for (const [spellId, definition] of spellDefinitions) {
      this.registerSpell(spellId, definition);
    }
  }
  
  /**
   * Register a spell with the system
   * @param {string} spellId - Unique ID for the spell
   * @param {Object} definition - Spell definition object
   */
  registerSpell(spellId, definition) {
    if (this.spells.has(spellId)) {
      console.warn(`[SpellManager] Spell '${spellId}' already registered`);
      return false;
    }
    
    this.spells.set(spellId, definition);
    console.log(`[SpellManager] Registered spell: ${spellId}`);
    return true;
  }
  
  /**
   * Handle player join event
   * @param {Object} data - Event data
   */
  handlePlayerJoin(data) {
    const { playerId } = data;
    
    // Initialize player mana
    this.playerMana.set(playerId, {
      current: this.BASE_MANA,
      max: this.BASE_MANA
    });
    
    // Initialize player spells
    if (!this.playerSpells.has(playerId)) {
      this.playerSpells.set(playerId, []);
    }
    
    // Initialize player cooldowns
    if (!this.cooldowns.has(playerId)) {
      this.cooldowns.set(playerId, {});
    }
  }
  
  /**
   * Handle player leave event
   * @param {Object} data - Event data
   */
  handlePlayerLeave(data) {
    const { playerId } = data;
    
    // Save player data if needed
    
    // Remove active references
    this.playerMana.delete(playerId);
    this.cooldowns.delete(playerId);
    
    // Don't delete playerSpells as they need to be persisted
  }
  
  /**
   * Handle spell casting request
   * @param {Object} data - Cast data
   * @returns {Object} - Result of casting
   */
  handleCastSpell(data) {
    const { playerId, spellId, target, options = {} } = data;
    
    // Get the player
    const player = this.server.getPlayer(playerId);
    if (!player) {
      return { success: false, message: 'Invalid player' };
    }
    
    // Get the spell
    const spell = this.spells.get(spellId);
    if (!spell) {
      return { success: false, message: 'Unknown spell' };
    }
    
    // Check if player knows this spell unless ignoreLearning is true
    if (!options.ignoreLearning) {
      const playerSpells = this.playerSpells.get(playerId) || [];
      if (!playerSpells.includes(spellId)) {
        return { success: false, message: 'You do not know this spell' };
      }
    }
    
    // Check cooldown unless ignoreCooldown is true
    if (!options.ignoreCooldown) {
      const playerCooldowns = this.cooldowns.get(playerId) || {};
      const cooldownTime = playerCooldowns[spellId];
      
      if (cooldownTime && cooldownTime > Date.now()) {
        const remainingCooldown = Math.ceil((cooldownTime - Date.now()) / 1000);
        return { 
          success: false, 
          message: `${spell.name} is on cooldown for ${remainingCooldown} seconds` 
        };
      }
    }
    
    // Get spell level
    const level = Math.min(options.level || 1, this.MAX_SPELL_LEVEL);
    
    // Calculate mana cost
    const manaCost = this.registry.calculateManaCost(spellId, level);
    
    // Check mana unless ignoreMana is true
    if (!options.ignoreMana) {
      const playerMana = this.playerMana.get(playerId);
      if (!playerMana || playerMana.current < manaCost) {
        return { success: false, message: 'Not enough mana' };
      }
    }
    
    // Cast the spell
    const castResult = this.castSpell(player, spell, target, {
      ...options,
      level
    });
    
    if (castResult.success) {
      // Consume mana if not ignored
      if (!options.ignoreMana) {
        const playerMana = this.playerMana.get(playerId);
        playerMana.current = Math.max(0, playerMana.current - manaCost);
        this.playerMana.set(playerId, playerMana);
      }
      
      // Set cooldown if not ignored
      if (!options.ignoreCooldown) {
        const cooldownMs = spell.cooldown * 1000;
        const playerCooldowns = this.cooldowns.get(playerId) || {};
        playerCooldowns[spellId] = Date.now() + cooldownMs;
        this.cooldowns.set(playerId, playerCooldowns);
      }
      
      // Track active spell if it has duration
      if (spell.duration && castResult.entity) {
        this.activeSpells.set(castResult.entity, {
          spellId,
          level,
          casterId: playerId,
          startTime: Date.now(),
          duration: spell.duration * 1000,
          entity: castResult.entity
        });
      }
      
      // Send notification to player
      this.server.sendToPlayer(playerId, {
        type: 'spellCast',
        spellId,
        success: true,
        message: castResult.message || `You cast ${spell.name}`,
        manaCost: !options.ignoreMana ? manaCost : 0,
        manaRemaining: !options.ignoreMana ? this.playerMana.get(playerId).current : null,
        cooldown: !options.ignoreCooldown ? spell.cooldown : 0
      });
    }
    
    return castResult;
  }
  
  /**
   * Actually cast a spell
   * @param {Object} player - Player casting the spell
   * @param {Object} spell - Spell definition
   * @param {Object} target - Target location or entity
   * @param {Object} options - Cast options
   * @returns {Object} - Cast result
   */
  castSpell(player, spell, target, options = {}) {
    // If the spell has an onCast function, call it
    if (typeof spell.onCast === 'function') {
      return spell.onCast(player, target, options);
    }
    
    // Default cast implementation for spells without onCast
    return this.defaultCastImplementation(player, spell, target, options);
  }
  
  /**
   * Default implementation for spells without custom onCast
   * @param {Object} player - Player casting the spell
   * @param {Object} spell - Spell definition
   * @param {Object} target - Target location or entity
   * @param {Object} options - Cast options
   * @returns {Object} - Cast result
   */
  defaultCastImplementation(player, spell, target, options = {}) {
    // Create entity based on spell category
    let entity = null;
    
    switch (spell.category) {
      case 'attack':
        // Create a projectile entity for attack spells
        entity = this.server.entityManager.addEntity({
          type: 'spell_projectile',
          subtype: spell.id,
          position: { ...player.position },
          velocity: this.calculateVelocityToTarget(player.position, target, 0.5),
          damage: 5 * options.level,
          caster: player.id,
          level: options.level,
          element: spell.element,
          createdAt: Date.now()
        });
        break;
        
      case 'area':
        // Create an area effect entity
        entity = this.server.entityManager.addEntity({
          type: 'spell_area',
          subtype: spell.id,
          position: { ...target },
          radius: spell.area * options.level,
          damage: 3 * options.level,
          caster: player.id,
          level: options.level,
          element: spell.element,
          createdAt: Date.now()
        });
        break;
        
      case 'utility':
      case 'buff':
      case 'debuff':
        // Create an effect entity
        entity = this.server.entityManager.addEntity({
          type: 'spell_effect',
          subtype: spell.id,
          position: { ...target },
          caster: player.id,
          level: options.level,
          element: spell.element,
          createdAt: Date.now()
        });
        break;
        
      default:
        // Generic spell entity
        entity = this.server.entityManager.addEntity({
          type: 'spell_effect',
          subtype: spell.id,
          position: { ...target },
          caster: player.id,
          level: options.level,
          element: spell.element,
          createdAt: Date.now()
        });
    }
    
    // Add particle effects
    if (this.server.particleSystem) {
      this.server.particleSystem.addEffect({
        type: spell.element,
        position: { ...player.position },
        count: 10 * options.level,
        spread: 1.0,
        duration: 500
      });
      
      if (target) {
        this.server.particleSystem.addEffect({
          type: spell.element,
          position: { ...target },
          count: 15 * options.level,
          spread: 1.5,
          duration: 1000
        });
      }
    }
    
    return {
      success: true,
      message: `Cast ${spell.name}`,
      entity: entity.id
    };
  }
  
  /**
   * Calculate velocity vector from start to target
   * @param {Object} start - Start position
   * @param {Object} target - Target position
   * @param {number} speed - Projectile speed
   * @returns {Object} - Velocity vector
   */
  calculateVelocityToTarget(start, target, speed) {
    // Calculate direction vector
    const dx = target.x - start.x;
    const dy = target.y - start.y;
    const dz = target.z - start.z;
    
    // Normalize direction vector
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const normalizedDx = dx / distance;
    const normalizedDy = dy / distance;
    const normalizedDz = dz / distance;
    
    // Scale by speed
    return {
      x: normalizedDx * speed,
      y: normalizedDy * speed,
      z: normalizedDz * speed
    };
  }
  
  /**
   * Update active spells
   */
  updateActiveSpells() {
    const now = Date.now();
    
    // Check each active spell
    for (const [entityId, activeSpell] of this.activeSpells.entries()) {
      const elapsed = now - activeSpell.startTime;
      
      // Check if spell has ended
      if (elapsed >= activeSpell.duration) {
        // Remove the spell entity
        this.server.entityManager.removeEntity(entityId);
        
        // Remove from active spells
        this.activeSpells.delete(entityId);
        
        // Notify player that spell ended
        const spell = this.spells.get(activeSpell.spellId);
        if (spell && activeSpell.casterId) {
          this.server.sendToPlayer(activeSpell.casterId, {
            type: 'spellEnded',
            spellId: activeSpell.spellId,
            message: `Your ${spell.name} has ended`
          });
        }
      }
    }
  }
  
  /**
   * Update spell cooldowns
   */
  updateCooldowns() {
    const now = Date.now();
    
    // Check each player's cooldowns
    for (const [playerId, cooldowns] of this.cooldowns.entries()) {
      let updated = false;
      
      // Remove expired cooldowns
      for (const spellId in cooldowns) {
        if (cooldowns[spellId] <= now) {
          delete cooldowns[spellId];
          updated = true;
          
          // Notify player that cooldown has ended
          const spell = this.spells.get(spellId);
          if (spell) {
            this.server.sendToPlayer(playerId, {
              type: 'cooldownEnded',
              spellId,
              message: `${spell.name} is ready to cast again`
            });
          }
        }
      }
      
      // Update player cooldowns if they changed
      if (updated) {
        this.cooldowns.set(playerId, cooldowns);
      }
    }
  }
  
  /**
   * Regenerate player mana
   */
  regeneratePlayerMana() {
    // Calculate regeneration amount based on time passed
    const regenAmount = this.MANA_REGEN_RATE;
    
    // Update each player's mana
    for (const [playerId, mana] of this.playerMana.entries()) {
      // Skip if already at max
      if (mana.current >= mana.max) continue;
      
      // Regenerate mana
      mana.current = Math.min(mana.max, mana.current + regenAmount);
      this.playerMana.set(playerId, mana);
      
      // Notify player of mana regeneration
      if (mana.current === mana.max) {
        this.server.sendToPlayer(playerId, {
          type: 'manaFull',
          current: mana.current,
          max: mana.max,
          message: 'Your mana is full'
        });
      }
    }
  }
  
  /**
   * Increase player's maximum mana
   * @param {string} playerId - Player ID
   * @param {number} amount - Amount to increase by
   * @returns {boolean} - Success
   */
  increaseMaxMana(playerId, amount) {
    const mana = this.playerMana.get(playerId);
    if (!mana) return false;
    
    mana.max += amount;
    mana.current += amount; // Also increase current by the same amount
    this.playerMana.set(playerId, mana);
    
    return true;
  }
  
  /**
   * Teach a spell to a player
   * @param {string} playerId - Player ID
   * @param {string} spellId - Spell ID
   * @returns {boolean} - Success
   */
  teachSpell(playerId, spellId) {
    // Check if spell exists
    if (!this.spells.has(spellId)) {
      return false;
    }
    
    // Get player spells
    const playerSpells = this.playerSpells.get(playerId) || [];
    
    // Check if player already knows the spell
    if (playerSpells.includes(spellId)) {
      return true; // Already known, so technically successful
    }
    
    // Add spell to player's known spells
    playerSpells.push(spellId);
    this.playerSpells.set(playerId, playerSpells);
    
    // Notify player
    const spell = this.spells.get(spellId);
    this.server.sendToPlayer(playerId, {
      type: 'learnedSpell',
      spellId,
      message: `You learned the ${spell.name} spell`
    });
    
    return true;
  }
  
  /**
   * Get all spells known by a player
   * @param {string} playerId - Player ID
   * @returns {Array} - Array of spell IDs
   */
  getPlayerSpells(playerId) {
    return this.playerSpells.get(playerId) || [];
  }
  
  /**
   * Get a player's mana information
   * @param {string} playerId - Player ID
   * @returns {Object|null} - Mana information or null
   */
  getPlayerMana(playerId) {
    return this.playerMana.get(playerId) || null;
  }
  
  /**
   * Get a player's spell cooldowns
   * @param {string} playerId - Player ID
   * @returns {Object} - Cooldown information
   */
  getPlayerCooldowns(playerId) {
    const cooldowns = this.cooldowns.get(playerId) || {};
    const now = Date.now();
    
    // Convert absolute timestamps to remaining seconds
    const result = {};
    for (const spellId in cooldowns) {
      result[spellId] = Math.max(0, Math.ceil((cooldowns[spellId] - now) / 1000));
    }
    
    return result;
  }
}

module.exports = SpellManager; 