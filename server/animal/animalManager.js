/**
 * Manages tamed animals and their enhanced functionality
 * Part of the Minecraft 1.23 Update - Tamed Animal Improvements
 */
const AnimalTrainingManager = require('./animalTrainingManager');
const TamedAnimalCommand = require('./tamedAnimalCommand');
const TamedAnimal = require('./tamedAnimal');

class AnimalManager {
  constructor() {
    this.initialized = false;
    this.gameContext = null;
    this.mobManager = null;
    this.playerManager = null;
    this.messageManager = null;
    
    // Training manager handles training progression
    this.trainingManager = new AnimalTrainingManager();
    
    // Map of animal ids to their enhancement status
    this.enhancedAnimals = {};
    
    // List of animal types that can be enhanced
    this.enhanceableTypes = [
      'wolf',        // Already tameable in vanilla
      'cat',         // Already tameable in vanilla
      'parrot',      // Already tameable in vanilla
      'horse',       // Already tameable in vanilla
      'donkey',      // Already tameable in vanilla
      'mule',        // Already tameable in vanilla
      'llama',       // Already tameable in vanilla
      'fox',         // New tameable in 1.23
      'rabbit',      // New tameable in 1.23
      'goat'         // New tameable in 1.23
    ];
  }

  /**
   * Initialize the animal manager
   * @param {Object} gameContext - Game context containing required managers
   * @returns {boolean} - Success status
   */
  initialize(gameContext) {
    if (this.initialized) return true;
    
    this.gameContext = gameContext;
    
    if (!this.gameContext) {
      console.error('Cannot initialize AnimalManager: gameContext required');
      return false;
    }
    
    // Get required managers
    this.mobManager = this.gameContext.mobManager;
    this.playerManager = this.gameContext.playerManager;
    this.messageManager = this.gameContext.messageManager;
    
    if (!this.mobManager) {
      console.error('Cannot initialize AnimalManager: mobManager required');
      return false;
    }
    
    // Integrate with mob manager
    this.patchMobManager();
    
    // Set as global for access by other systems
    global.animalManager = this;
    
    this.initialized = true;
    return true;
  }

  /**
   * Patch the mob manager to support enhanced tamed animal functionality
   */
  patchMobManager() {
    const mobManager = this.mobManager;
    const animalManager = this;
    
    // Store original methods for chaining
    const originalSpawnMob = mobManager.spawnMob;
    const originalHandlePlayerInteraction = mobManager.handlePlayerInteraction;
    
    // Enhance the spawn mob method
    mobManager.spawnMob = function(mobType, position, options = {}) {
      // Call original method
      const mob = originalSpawnMob.call(this, mobType, position, options);
      
      // Enhance tameable animals
      if (mob && animalManager.isEnhanceable(mobType)) {
        return animalManager.enhanceAnimal(mob);
      }
      
      return mob;
    };
    
    // Enhance the player interaction method
    mobManager.handlePlayerInteraction = function(playerId, mobId, data) {
      const mob = this.mobs[mobId];
      
      // Handle enhanced animal commands
      if (mob && mob._tamedEnhanced && data.action === 'command') {
        return animalManager.handleAnimalCommand(playerId, mobId, data);
      }
      
      // Call original method for other interactions
      return originalHandlePlayerInteraction.call(this, playerId, mobId, data);
    };
    
    // Add method to check training level
    mobManager.getAnimalTrainingLevel = function(mobId) {
      return animalManager.getTrainingLevel(mobId);
    };
    
    // Add method to get available commands
    mobManager.getAvailableAnimalCommands = function(mobId) {
      return animalManager.getAvailableCommands(mobId);
    };
  }

  /**
   * Check if an animal type can be enhanced
   * @param {string} animalType - The type of animal
   * @returns {boolean} - Whether the animal can be enhanced
   */
  isEnhanceable(animalType) {
    return this.enhanceableTypes.includes(animalType);
  }

  /**
   * Enhance an animal with improved tamed functionality
   * @param {Object} animal - The animal to enhance
   * @returns {Object} - The enhanced animal
   */
  enhanceAnimal(animal) {
    if (!animal) return null;
    
    // Skip if already enhanced
    if (animal._tamedEnhanced) return animal;
    
    // Enhance the animal
    const enhancedAnimal = TamedAnimal.enhance(animal);
    
    // Register with manager
    this.enhancedAnimals[animal.id] = true;
    
    return enhancedAnimal;
  }

  /**
   * Handle a command given to a tamed animal
   * @param {string} playerId - The player giving the command
   * @param {string} animalId - The animal to command
   * @param {Object} data - Command data
   * @returns {Object} - Command result
   */
  handleAnimalCommand(playerId, animalId, data) {
    // Get the animal and player
    const animal = this.mobManager.mobs[animalId];
    const player = this.playerManager.players[playerId];
    
    if (!animal || !player) {
      return { success: false, reason: 'invalid_entities' };
    }
    
    // Check if animal is tamed and owned by player
    if (!animal.tamed || animal.owner !== playerId) {
      return { success: false, reason: 'not_owner' };
    }
    
    // Create and execute command
    const commandName = data.command;
    const options = data.options || {};
    
    const command = new TamedAnimalCommand(commandName, options);
    const result = command.execute(animal, player, this.trainingManager);
    
    // Record training experience if command succeeded
    if (result.success) {
      this.trainingManager.trainAnimal(animalId, playerId, commandName);
    }
    
    return result;
  }

  /**
   * Get the training level of an animal
   * @param {string} animalId - The animal's ID
   * @returns {number} - Training level (0-5)
   */
  getTrainingLevel(animalId) {
    return this.trainingManager.getTrainingLevel(animalId);
  }

  /**
   * Get available commands for an animal based on training level
   * @param {string} animalId - The animal's ID
   * @returns {Object} - Available commands and their descriptions
   */
  getAvailableCommands(animalId) {
    const trainingLevel = this.getTrainingLevel(animalId);
    const availableCommands = {};
    
    // Basic commands
    availableCommands.sit = {
      name: 'Sit',
      description: 'Make the animal sit and stay in place',
      level: 0
    };
    
    availableCommands.stand = {
      name: 'Stand',
      description: 'Make the animal stand up',
      level: 0
    };
    
    availableCommands.follow = {
      name: 'Follow',
      description: 'Make the animal follow you',
      level: 0
    };
    
    // Level 1 commands
    if (trainingLevel >= 1) {
      availableCommands.stay = {
        name: 'Stay',
        description: 'Make the animal stay at its current position',
        level: 1
      };
    }
    
    // Level 2 commands
    if (trainingLevel >= 2) {
      availableCommands.guard = {
        name: 'Guard',
        description: 'Make the animal guard an area from threats',
        level: 2
      };
    }
    
    // Level 3 commands
    if (trainingLevel >= 3) {
      availableCommands.fetch = {
        name: 'Fetch',
        description: 'Make the animal retrieve items',
        level: 3
      };
    }
    
    // Level 4 commands
    if (trainingLevel >= 4) {
      availableCommands.patrol = {
        name: 'Patrol',
        description: 'Make the animal patrol between points',
        level: 4
      };
      
      availableCommands.track = {
        name: 'Track',
        description: 'Make the animal track a specific type of mob',
        level: 4
      };
    }
    
    return availableCommands;
  }

  /**
   * Teach a new behavior to an animal
   * @param {string} playerId - The player teaching the behavior
   * @param {string} animalId - The animal to teach
   * @param {string} behavior - The behavior to teach
   * @returns {Object} - Teaching result
   */
  teachBehavior(playerId, animalId, behavior) {
    return this.trainingManager.teachBehavior(animalId, playerId, behavior);
  }

  /**
   * Get animal training progress
   * @param {string} animalId - The animal's ID
   * @returns {Object} - Training progress data
   */
  getTrainingProgress(animalId) {
    return this.trainingManager.getTrainingProgress(animalId);
  }

  /**
   * Create a visual training feedback effect
   * @param {string} animalId - The animal's ID
   * @param {string} effectType - Type of effect (success, failure)
   */
  createTrainingEffect(animalId, effectType) {
    const animal = this.mobManager.mobs[animalId];
    if (!animal) return;
    
    // Create particle effect at animal location
    if (this.gameContext.worldManager) {
      const effectData = {
        type: effectType === 'success' ? 'heart' : 'smoke',
        position: animal.position,
        count: effectType === 'success' ? 5 : 3,
        scale: 1.0
      };
      
      this.gameContext.worldManager.createParticleEffect(effectData);
    }
  }

  /**
   * Serialize data for storage
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      enhancedAnimals: this.enhancedAnimals,
      trainingData: this.trainingManager.serialize()
    };
  }

  /**
   * Deserialize stored data
   * @param {Object} data - Data to deserialize
   */
  deserialize(data) {
    if (!data) return;
    
    if (data.enhancedAnimals) {
      this.enhancedAnimals = data.enhancedAnimals;
    }
    
    if (data.trainingData) {
      this.trainingManager.deserialize(data.trainingData);
    }
  }

  /**
   * Update method called by game loop
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    // Any periodic updates needed for animal manager
  }
}

module.exports = AnimalManager; 