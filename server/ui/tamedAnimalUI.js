/**
 * UI components for tamed animal interactions
 * Part of the Minecraft 1.23 Update - Tamed Animal Improvements
 */
class TamedAnimalUI {
  constructor(gameContext) {
    this.gameContext = gameContext;
    this.playerManager = gameContext.playerManager;
    this.messageManager = gameContext.messageManager;
    this.animalManager = gameContext.animalManager;
  }

  /**
   * Generate UI data for a tamed animal
   * @param {string} playerId - The player viewing the UI
   * @param {string} animalId - The animal to show UI for
   * @returns {Object} - UI data to send to client
   */
  generateAnimalUI(playerId, animalId) {
    const player = this.playerManager.getPlayer(playerId);
    const animal = global.mobManager.mobs[animalId];
    
    if (!player || !animal) {
      return { success: false, reason: 'entities_not_found' };
    }
    
    // Check if animal is tamed and owned by this player
    if (!animal.tamed || animal.owner !== playerId) {
      return { 
        success: false, 
        reason: animal.tamed ? 'not_owner' : 'not_tamed'
      };
    }
    
    // Get training progress
    const trainingProgress = this.animalManager.getTrainingProgress(animalId);
    
    // Get available commands
    const availableCommands = this.animalManager.getAvailableCommands(animalId);
    
    // Build UI data
    return {
      success: true,
      animalData: {
        id: animal.id,
        type: animal.type,
        name: animal.name || this.getDefaultAnimalName(animal),
        health: Math.floor(animal.health),
        maxHealth: animal.maxHealth,
        sitting: animal.sitting || false,
        armor: animal.hasArmor ? animal.getArmorInfo() : null,
        position: animal.position
      },
      trainingData: {
        level: trainingProgress.level,
        experience: trainingProgress.experience,
        nextLevelExp: trainingProgress.nextLevel,
        progress: trainingProgress.progress,
        maxLevel: trainingProgress.level >= 5
      },
      commandsData: {
        availableCommands: availableCommands,
        activeStates: {
          sitting: animal.sitting || false,
          following: animal.state === 'follow' && animal.targetEntity && animal.targetEntity.id === playerId,
          staying: animal.staying || false,
          guarding: animal.guarding || false,
          patrolling: animal.patrolling || false,
          tracking: animal.tracking || false,
          fetching: animal.fetching || false
        }
      }
    };
  }

  /**
   * Process a UI command for a tamed animal
   * @param {Object} data - Command data from client
   * @returns {Object} - Result to send back to client
   */
  processUICommand(data) {
    const { playerId, animalId, command, options } = data;
    
    if (!playerId || !animalId || !command) {
      return { success: false, reason: 'invalid_parameters' };
    }
    
    // Pass to animal manager
    return this.animalManager.handleAnimalCommand(playerId, animalId, {
      action: 'command',
      command: command,
      options: options || {}
    });
  }

  /**
   * Get the default display name for an animal type
   * @param {Object} animal - The animal object
   * @returns {string} - Display name
   */
  getDefaultAnimalName(animal) {
    const typeToName = {
      'wolf': 'Wolf',
      'cat': 'Cat',
      'parrot': 'Parrot',
      'horse': 'Horse',
      'donkey': 'Donkey',
      'mule': 'Mule',
      'llama': 'Llama',
      'fox': 'Fox',
      'rabbit': 'Rabbit',
      'goat': 'Goat'
    };
    
    return typeToName[animal.type] || 'Pet';
  }

  /**
   * Set a custom name for a tamed animal
   * @param {string} playerId - The player setting the name
   * @param {string} animalId - The animal to rename
   * @param {string} newName - The new name
   * @returns {Object} - Result of renaming
   */
  setAnimalName(playerId, animalId, newName) {
    const animal = global.mobManager.mobs[animalId];
    
    if (!animal) {
      return { success: false, reason: 'animal_not_found' };
    }
    
    // Check if animal is tamed and owned by this player
    if (!animal.tamed || animal.owner !== playerId) {
      return { success: false, reason: 'not_owner' };
    }
    
    // Sanitize name
    const sanitizedName = this.sanitizeName(newName);
    if (!sanitizedName) {
      return { success: false, reason: 'invalid_name' };
    }
    
    // Set the name
    animal.name = sanitizedName;
    
    return { 
      success: true, 
      animalId: animalId,
      newName: sanitizedName
    };
  }

  /**
   * Sanitize a pet name
   * @param {string} name - The name to sanitize
   * @returns {string} - Sanitized name
   */
  sanitizeName(name) {
    if (!name) return null;
    
    // Trim and limit length
    const trimmed = name.trim().slice(0, 32);
    
    // Basic validation
    if (trimmed.length < 1) return null;
    
    return trimmed;
  }

  /**
   * Generate training UI for a tamed animal
   * @param {string} playerId - The player viewing the UI
   * @param {string} animalId - The animal to train
   * @returns {Object} - Training UI data
   */
  generateTrainingUI(playerId, animalId) {
    const animal = global.mobManager.mobs[animalId];
    
    if (!animal) {
      return { success: false, reason: 'animal_not_found' };
    }
    
    // Check if animal is tamed and owned by this player
    if (!animal.tamed || animal.owner !== playerId) {
      return { success: false, reason: 'not_owner' };
    }
    
    // Get training progress
    const trainingProgress = this.animalManager.getTrainingProgress(animalId);
    
    // Get learnable behaviors
    const learnableBehaviors = this.getLearnableBehaviors(animalId);
    
    return {
      success: true,
      animalId: animalId,
      animalType: animal.type,
      name: animal.name || this.getDefaultAnimalName(animal),
      trainingLevel: trainingProgress.level,
      trainingExp: trainingProgress.experience,
      nextLevelExp: trainingProgress.nextLevel,
      progress: trainingProgress.progress,
      learnedBehaviors: trainingProgress.behaviors || [],
      learnableBehaviors: learnableBehaviors
    };
  }

  /**
   * Get behaviors that can be learned by an animal
   * @param {string} animalId - The animal's ID
   * @returns {Array} - Learnable behaviors
   */
  getLearnableBehaviors(animalId) {
    const trainingLevel = this.animalManager.getTrainingLevel(animalId);
    const learnedBehaviors = this.animalManager.trainingManager.getLearnedBehaviors(animalId);
    
    // All available behaviors
    const allBehaviors = {
      'sit': { level: 0, name: 'Sit', description: 'Make the animal sit and stay in place' },
      'stand': { level: 0, name: 'Stand', description: 'Make the animal stand up' },
      'follow': { level: 0, name: 'Follow', description: 'Make the animal follow you' },
      'stay': { level: 1, name: 'Stay', description: 'Make the animal stay at its current position' },
      'guard': { level: 2, name: 'Guard', description: 'Make the animal guard an area from threats' },
      'fetch': { level: 3, name: 'Fetch', description: 'Make the animal retrieve items' },
      'patrol': { level: 4, name: 'Patrol', description: 'Make the animal patrol between points' },
      'track': { level: 4, name: 'Track', description: 'Make the animal track a specific type of mob' }
    };
    
    // Filter to behaviors that are:
    // 1. Unlocked by current training level
    // 2. Not already learned
    const learnable = {};
    
    for (const [behaviorId, behaviorData] of Object.entries(allBehaviors)) {
      if (behaviorData.level <= trainingLevel && !learnedBehaviors.includes(behaviorId)) {
        learnable[behaviorId] = behaviorData;
      }
    }
    
    return learnable;
  }

  /**
   * Teach a behavior to an animal
   * @param {string} playerId - The player teaching
   * @param {string} animalId - The animal to teach
   * @param {string} behavior - The behavior to teach
   * @returns {Object} - Teaching result
   */
  teachBehavior(playerId, animalId, behavior) {
    return this.animalManager.teachBehavior(playerId, animalId, behavior);
  }
}

module.exports = TamedAnimalUI; 