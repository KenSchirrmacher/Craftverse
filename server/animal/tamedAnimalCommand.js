/**
 * Represents a command that can be given to a tamed animal
 * Part of the Minecraft 1.23 Update - Tamed Animal Improvements
 */
class TamedAnimalCommand {
  /**
   * Create a new animal command
   * @param {string} commandName - The name of the command
   * @param {Object} options - Additional command options
   */
  constructor(commandName, options = {}) {
    this.name = commandName;
    this.options = options;
    
    // Define command implementations
    this.commandHandlers = {
      // Basic commands
      'sit': this.handleSit,
      'stand': this.handleStand,
      'follow': this.handleFollow,
      
      // Advanced commands requiring training
      'stay': this.handleStay,
      'guard': this.handleGuard,
      'fetch': this.handleFetch,
      'patrol': this.handlePatrol,
      'track': this.handleTrack
    };
  }

  /**
   * Execute this command on an animal
   * @param {Object} animal - The animal to command
   * @param {Object} player - The player giving the command
   * @param {AnimalTrainingManager} trainingManager - The training manager
   * @returns {Object} - Command execution result
   */
  execute(animal, player, trainingManager = null) {
    // Verify animal can be commanded
    if (!animal || !animal.tamed) {
      return { success: false, reason: 'not_tameable' };
    }
    
    // Verify ownership
    if (animal.owner !== player.id) {
      return { success: false, reason: 'not_owner' };
    }
    
    // Check if command is valid
    if (!this.commandHandlers[this.name]) {
      return { success: false, reason: 'unknown_command' };
    }
    
    // Check if animal has required training level for this command
    if (trainingManager) {
      if (!trainingManager.canPerformBehavior(animal.id, this.name)) {
        return { 
          success: false, 
          reason: 'insufficient_training', 
          commandName: this.name 
        };
      }
    }
    
    // Execute the command handler
    return this.commandHandlers[this.name].call(this, animal, player, trainingManager);
  }

  /**
   * Make the animal sit
   * @param {Object} animal - The animal to command
   * @returns {Object} - Command execution result
   */
  handleSit(animal) {
    // Cannot sit if already sitting
    if (animal.sitting) {
      return { success: false, reason: 'already_sitting' };
    }
    
    animal.sitting = true;
    animal.state = 'idle';
    animal.targetEntity = null;
    
    return { 
      success: true, 
      action: 'sit', 
      animalId: animal.id 
    };
  }

  /**
   * Make the animal stand
   * @param {Object} animal - The animal to command
   * @returns {Object} - Command execution result
   */
  handleStand(animal) {
    // Cannot stand if already standing
    if (!animal.sitting) {
      return { success: false, reason: 'already_standing' };
    }
    
    animal.sitting = false;
    animal.state = 'idle';
    
    return { 
      success: true, 
      action: 'stand', 
      animalId: animal.id 
    };
  }

  /**
   * Make the animal follow the player
   * @param {Object} animal - The animal to command
   * @param {Object} player - The player to follow
   * @returns {Object} - Command execution result
   */
  handleFollow(animal, player) {
    // If sitting, make stand first
    if (animal.sitting) {
      animal.sitting = false;
    }
    
    animal.state = 'follow';
    animal.targetEntity = player;
    
    return { 
      success: true, 
      action: 'follow', 
      animalId: animal.id, 
      playerId: player.id 
    };
  }

  /**
   * Make the animal stay in place
   * @param {Object} animal - The animal to command
   * @param {Object} player - The player giving the command
   * @param {AnimalTrainingManager} trainingManager - The training manager
   * @returns {Object} - Command execution result
   */
  handleStay(animal, player, trainingManager) {
    if (animal.sitting) {
      return { success: false, reason: 'already_sitting' };
    }
    
    // Set the animal to stay mode
    animal.staying = true;
    animal.stayPosition = { ...animal.position };
    animal.state = 'idle';
    animal.sitting = false;
    
    // Add a special property to remember the stay position
    animal.stayMode = {
      active: true,
      position: { ...animal.position },
      radius: 3, // Stay within 3 blocks of this position
      return: true
    };
    
    // Add experience for using the command
    if (trainingManager) {
      trainingManager.trainAnimal(animal.id, player.id, 'stay');
    }
    
    return { 
      success: true, 
      action: 'stay', 
      animalId: animal.id,
      position: animal.stayPosition 
    };
  }

  /**
   * Make the animal guard an area
   * @param {Object} animal - The animal to command
   * @param {Object} player - The player giving the command
   * @param {AnimalTrainingManager} trainingManager - The training manager
   * @returns {Object} - Command execution result
   */
  handleGuard(animal, player, trainingManager) {
    // Set the animal to guard mode
    animal.guarding = true;
    animal.guardPosition = { ...animal.position };
    animal.guardRadius = this.options.radius || 8;
    animal.state = 'idle';
    animal.sitting = false;
    
    // Add a special property to handle guard behavior
    animal.guardMode = {
      active: true,
      position: { ...animal.position },
      radius: animal.guardRadius,
      target: this.options.target || 'hostile', // 'hostile', 'all', or specific mob type
      returnToPosition: true
    };
    
    // Add experience for using the command
    if (trainingManager) {
      trainingManager.trainAnimal(animal.id, player.id, 'guard');
    }
    
    return { 
      success: true, 
      action: 'guard', 
      animalId: animal.id,
      position: animal.guardPosition,
      radius: animal.guardRadius
    };
  }

  /**
   * Make the animal fetch an item
   * @param {Object} animal - The animal to command
   * @param {Object} player - The player giving the command
   * @param {AnimalTrainingManager} trainingManager - The training manager
   * @returns {Object} - Command execution result
   */
  handleFetch(animal, player, trainingManager) {
    // If no target specified, look for nearest item
    const targetItem = this.options.target || null;
    
    // Set animal to fetch mode
    animal.fetching = true;
    animal.fetchTarget = targetItem;
    animal.state = 'follow'; // Will be redirected to item in the AI update
    animal.sitting = false;
    
    // Add a special property to handle fetch behavior
    animal.fetchMode = {
      active: true,
      targetItem: targetItem,
      returnTo: player.id,
      searchRadius: 15
    };
    
    // Add experience for using the command
    if (trainingManager) {
      trainingManager.trainAnimal(animal.id, player.id, 'fetch');
    }
    
    return { 
      success: true, 
      action: 'fetch', 
      animalId: animal.id,
      targetItem: targetItem
    };
  }

  /**
   * Make the animal patrol between points
   * @param {Object} animal - The animal to command
   * @param {Object} player - The player giving the command
   * @param {AnimalTrainingManager} trainingManager - The training manager
   * @returns {Object} - Command execution result
   */
  handlePatrol(animal, player, trainingManager) {
    // Get patrol points or use current position as first point
    let patrolPoints = this.options.points || [];
    
    // If no points specified or adding a new point
    if (patrolPoints.length === 0 || this.options.addPoint) {
      patrolPoints.push({ ...animal.position });
    }
    
    // Set animal to patrol mode
    animal.patrolling = true;
    animal.patrolPoints = patrolPoints;
    animal.currentPatrolPoint = 0;
    animal.state = 'wander'; // Will be redirected to patrol in the AI update
    animal.sitting = false;
    
    // Add a special property to handle patrol behavior
    animal.patrolMode = {
      active: true,
      points: patrolPoints,
      currentPoint: 0,
      direction: 1, // 1 for forward, -1 for reverse
      pauseAtPoints: this.options.pauseAtPoints || false,
      pauseDuration: this.options.pauseDuration || 5000 // 5 seconds
    };
    
    // Add experience for using the command
    if (trainingManager) {
      trainingManager.trainAnimal(animal.id, player.id, 'patrol');
    }
    
    return { 
      success: true, 
      action: 'patrol', 
      animalId: animal.id,
      points: patrolPoints.length,
      addedPoint: this.options.addPoint || false
    };
  }

  /**
   * Make the animal track a specific target
   * @param {Object} animal - The animal to command
   * @param {Object} player - The player giving the command
   * @param {AnimalTrainingManager} trainingManager - The training manager
   * @returns {Object} - Command execution result
   */
  handleTrack(animal, player, trainingManager) {
    const trackTarget = this.options.target || 'hostile';
    
    // Set animal to track mode
    animal.tracking = true;
    animal.trackTarget = trackTarget;
    animal.state = 'wander'; // Will be redirected to tracking in the AI update
    animal.sitting = false;
    
    // Add a special property to handle track behavior
    animal.trackMode = {
      active: true,
      target: trackTarget, // 'hostile', 'passive', or specific mob type
      searchRadius: this.options.radius || 30,
      alert: this.options.alert || true, // Alert the player when found
      trackCooldown: 0
    };
    
    // Add experience for using the command
    if (trainingManager) {
      trainingManager.trainAnimal(animal.id, player.id, 'track');
    }
    
    return { 
      success: true, 
      action: 'track', 
      animalId: animal.id,
      target: trackTarget
    };
  }
}

module.exports = TamedAnimalCommand; 