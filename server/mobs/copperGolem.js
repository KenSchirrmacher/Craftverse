/**
 * Copper Golem - A constructable golem that interacts with redstone and oxidizes over time
 * Part of the Minecraft 1.23 Update implementation
 */

const MobBase = require('./mobBase');
const EventEmitter = require('events');

/**
 * Oxidation states for the Copper Golem
 * Each state has different properties and behaviors
 */
const OxidationState = {
  UNOXIDIZED: 0,
  EXPOSED: 1,
  WEATHERED: 2,
  OXIDIZED: 3,
  // Waxed variants prevent further oxidation
  WAXED_UNOXIDIZED: 4,
  WAXED_EXPOSED: 5,
  WAXED_WEATHERED: 6,
  WAXED_OXIDIZED: 7
};

/**
 * Copper Golem Implementation
 * - Interacts with copper buttons
 * - Oxidizes over time (4 states)
 * - Can be waxed to prevent oxidation
 * - Becomes a statue when fully oxidized
 */
class CopperGolem extends MobBase {
  /**
   * Create a new Copper Golem
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Properly handle ID to ensure it respects the provided ID
    options.id = options.id || `copper_golem_${Date.now()}`;
    
    // Set default options
    const defaults = {
      type: 'copper_golem',
      name: 'Copper Golem',
      maxHealth: 30,
      health: options.health || 30,
      width: 0.6,
      height: 0.9,
      speed: 0.25, // Slower than players
      drops: ['copper_ingot', 'copper_block'],
      aggressive: false,
      attackDamage: 0, // Doesn't attack directly
      ...options
    };
    
    super(defaults);
    
    // Ensure ID is preserved 
    this.id = options.id;
    
    // Oxidation properties
    this.oxidationState = options.oxidationState || OxidationState.UNOXIDIZED;
    this.isWaxed = this.oxidationState >= OxidationState.WAXED_UNOXIDIZED;
    this.oxidationTimer = options.oxidationTimer || 0;
    this.oxidationRate = options.oxidationRate || 1200; // Ticks per oxidation level (1 minute at 20 TPS)
    
    // Redstone interaction properties
    this.buttonCooldown = 0;
    this.buttonCooldownMax = 20; // 1 second cooldown at 20 TPS
    this.targetButton = null;
    this.lastPressedButtonId = null;
    
    // Movement properties (affected by oxidation)
    this.movementSpeedModifier = this.getSpeedModifierForState();
    this.movementChance = this.getMovementChanceForState();
    
    // AI properties
    this.stationary = this.oxidationState === OxidationState.OXIDIZED;
    this.canPressButtons = this.oxidationState < OxidationState.OXIDIZED;
    this.buttonSearchRadius = 8; // Blocks
    this.buttonDetectionCooldown = 0;
    
    // Construction properties (for building the golem)
    this.isConstructed = options.isConstructed !== undefined ? options.isConstructed : true;
    
    // Initialize velocity if not provided
    if (!this.velocity) {
      this.velocity = { x: 0, y: 0, z: 0 };
    }
    
    // Event emitter for events
    this.events = new EventEmitter();
  }
  
  /**
   * Emit an event with data
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    if (this.events) {
      this.events.emit(event, data);
    }
  }
  
  /**
   * Update the Copper Golem's state
   * @param {World} world - The game world
   * @param {number} delta - Time since last update in ms
   */
  update(world, delta) {
    if (!this.isConstructed) return;
    
    super.update(world, delta);
    
    // Don't process AI if oxidized
    if (this.stationary) return;
    
    // Handle oxidation
    this.updateOxidation(world, delta);
    
    // Update cooldowns
    if (this.buttonCooldown > 0) {
      this.buttonCooldown--;
    }
    
    if (this.buttonDetectionCooldown > 0) {
      this.buttonDetectionCooldown--;
    }
    
    // Redstone interaction behavior
    this.updateRedstoneInteraction(world);
    
    // Random movement with speed based on oxidation state
    this.updateMovement(world, delta);
  }
  
  /**
   * Handle oxidation state changes over time
   * @param {World} world - The game world
   * @param {number} delta - Time since last update in ms
   */
  updateOxidation(world, delta) {
    // Waxed golems don't oxidize further
    if (this.isWaxed) return;
    
    // Only oxidize up to OXIDIZED state
    if (this.oxidationState >= OxidationState.OXIDIZED) return;
    
    // Increment oxidation timer
    this.oxidationTimer += delta;
    
    // Check if ready to oxidize to next state
    if (this.oxidationTimer >= this.oxidationRate) {
      this.oxidationTimer = 0;
      this.oxidationState++;
      
      // Update properties based on new oxidation state
      this.updatePropertiesForOxidationState();
      
      // Emit event for client updates
      this.emit('oxidation_change', { 
        entityId: this.id, 
        oxidationState: this.oxidationState,
        isWaxed: this.isWaxed
      });
    }
  }
  
  /**
   * Update properties based on current oxidation state
   */
  updatePropertiesForOxidationState() {
    this.movementSpeedModifier = this.getSpeedModifierForState();
    this.movementChance = this.getMovementChanceForState();
    
    // Handle becoming fully oxidized
    if (this.oxidationState === OxidationState.OXIDIZED) {
      this.stationary = true;
      this.canPressButtons = false;
      this.velocity = { x: 0, y: 0, z: 0 };
    }
  }
  
  /**
   * Get movement speed modifier based on oxidation state
   * @returns {number} - Speed multiplier between 0 and 1
   */
  getSpeedModifierForState() {
    const baseState = this.isWaxed ? this.oxidationState - 4 : this.oxidationState;
    
    switch (baseState) {
      case OxidationState.UNOXIDIZED: return 1.0;
      case OxidationState.EXPOSED: return 0.8;
      case OxidationState.WEATHERED: return 0.5;
      case OxidationState.OXIDIZED: return 0;
      default: return 1.0;
    }
  }
  
  /**
   * Get movement chance based on oxidation state
   * Higher oxidation means less frequent movement
   * @returns {number} - Chance of movement (0-1)
   */
  getMovementChanceForState() {
    const baseState = this.isWaxed ? this.oxidationState - 4 : this.oxidationState;
    
    switch (baseState) {
      case OxidationState.UNOXIDIZED: return 0.9;
      case OxidationState.EXPOSED: return 0.6;
      case OxidationState.WEATHERED: return 0.3;
      case OxidationState.OXIDIZED: return 0;
      default: return 0.9;
    }
  }
  
  /**
   * Update redstone interaction behavior
   * @param {World} world - The game world
   */
  updateRedstoneInteraction(world) {
    // Only interact with buttons if not on cooldown and able to press buttons
    if (this.buttonCooldown > 0 || !this.canPressButtons) return;
    
    // Look for buttons periodically
    if (this.buttonDetectionCooldown <= 0) {
      this.buttonDetectionCooldown = 20; // Check every second
      this.findNearbyButtons(world);
    }
    
    // Try to move toward and press target button
    if (this.targetButton) {
      const distanceToButton = this.getDistanceTo(this.targetButton.position);
      
      if (distanceToButton < 1.5) { // Close enough to press the button
        this.pressButton(world, this.targetButton);
        this.targetButton = null;
        this.buttonCooldown = this.buttonCooldownMax;
      } else {
        // Move toward button
        const direction = this.getDirectionTo(this.targetButton.position);
        this.moveInDirection(direction, this.movementSpeedModifier);
      }
    }
  }
  
  /**
   * Find copper buttons in the vicinity
   * @param {World} world - The game world
   */
  findNearbyButtons(world) {
    if (!world) return;
    
    const buttons = world.findCopperButtons(
      this.position.x, 
      this.position.y, 
      this.position.z, 
      this.buttonSearchRadius
    );
    
    if (buttons.length === 0) {
      this.targetButton = null;
      return;
    }
    
    // Prioritize buttons that haven't been pressed recently
    buttons.sort((a, b) => {
      // Avoid pressing the same button twice in a row if possible
      if (a.id === this.lastPressedButtonId) return 1;
      if (b.id === this.lastPressedButtonId) return -1;
      
      // Otherwise find the closest button
      const distToA = this.getDistanceTo(a.position);
      const distToB = this.getDistanceTo(b.position);
      return distToA - distToB;
    });
    
    // Select a button (with randomization based on oxidation state)
    if (Math.random() < this.movementChance) {
      this.targetButton = buttons[0];
    }
  }
  
  /**
   * Press a copper button
   * @param {World} world - The game world
   * @param {Object} button - The button to press
   */
  pressButton(world, button) {
    if (!world || !button) return;
    
    // Record this button as the last pressed
    this.lastPressedButtonId = button.id;
    
    // Tell the world to activate this button
    world.activateButton(button.id, this.id);
    
    // Emit event for animation and sound
    this.emit('press_button', {
      entityId: this.id,
      buttonId: button.id,
      position: button.position
    });
  }
  
  /**
   * Update movement behavior with oxidation effects
   * @param {World} world - The game world
   * @param {number} delta - Time since last update in ms
   */
  updateMovement(world, delta) {
    // Don't move if targeting a button or fully oxidized
    if (this.targetButton || this.stationary) return;
    
    // Random movement with decreasing frequency based on oxidation
    if (Math.random() < (0.05 * this.movementChance)) {
      const angle = Math.random() * Math.PI * 2; // Random direction
      const dx = Math.cos(angle) * this.movementSpeedModifier;
      const dz = Math.sin(angle) * this.movementSpeedModifier;
      
      this.velocity.x = dx * this.speed;
      this.velocity.z = dz * this.speed;
    }
  }
  
  /**
   * Apply wax to the golem to prevent further oxidation
   * @returns {boolean} - Whether waxing was successful
   */
  applyWax() {
    // Cannot wax an already waxed golem
    if (this.isWaxed) return false;
    
    // Convert to waxed variant of current state
    this.oxidationState += 4; // Convert to waxed variant
    this.isWaxed = true;
    
    // Emit event for client updates
    this.emit('wax_applied', {
      entityId: this.id,
      oxidationState: this.oxidationState
    });
    
    return true;
  }
  
  /**
   * Scrape wax off the golem to allow oxidation again
   * @param {string} tool - The tool used for scraping
   * @returns {boolean} - Whether scraping was successful
   */
  scrapeWax(tool) {
    // Can only scrape waxed golems
    if (!this.isWaxed) return false;
    
    // Require an axe for scraping
    if (tool !== 'axe') return false;
    
    // Convert to unwaxed variant of current state
    const baseState = this.oxidationState - 4;
    this.oxidationState = baseState;
    this.isWaxed = false;
    
    // Emit event for client updates
    this.emit('wax_scraped', {
      entityId: this.id,
      oxidationState: this.oxidationState
    });
    
    return true;
  }
  
  /**
   * Scrape oxidation off the golem to restore to a less oxidized state
   * @param {string} tool - The tool used for scraping
   * @returns {boolean} - Whether scraping was successful
   */
  scrapeOxidation(tool) {
    // Require an axe for scraping
    if (tool !== 'axe') return false;
    
    const baseState = this.isWaxed ? this.oxidationState - 4 : this.oxidationState;
    
    // Can't scrape unoxidized golem
    if (baseState <= OxidationState.UNOXIDIZED) return false;
    
    // Reduce oxidation by one level
    if (this.isWaxed) {
      this.oxidationState = (baseState - 1) + 4; // Waxed variant
    } else {
      this.oxidationState = baseState - 1;
    }
    
    // Update properties based on new oxidation state
    this.updatePropertiesForOxidationState();
    
    // Reset oxidation timer
    this.oxidationTimer = 0;
    
    // Emit event for client updates
    this.emit('oxidation_scraped', {
      entityId: this.id,
      oxidationState: this.oxidationState,
      isWaxed: this.isWaxed
    });
    
    return true;
  }
  
  /**
   * Check if the golem is fully oxidized (statue)
   * @returns {boolean} - Whether the golem is a statue
   */
  isStatue() {
    const baseState = this.isWaxed ? this.oxidationState - 4 : this.oxidationState;
    return baseState === OxidationState.OXIDIZED;
  }
  
  /**
   * Create a copper golem from blocks
   * @param {World} world - The game world
   * @param {Object} position - Position to create the golem
   * @param {boolean} alreadyConstructed - Whether the golem is pre-constructed
   * @returns {CopperGolem} - The created golem, or null if creation failed
   */
  static createFromBlocks(world, position, alreadyConstructed = false) {
    if (!world) return null;
    
    // Check block structure if not already validated
    if (!alreadyConstructed) {
      const isValid = CopperGolem.validateStructure(world, position);
      if (!isValid) return null;
    }
    
    // Create the golem
    const golem = new CopperGolem({
      position: { ...position, y: position.y + 0.05 }, // Slight offset to avoid sinking
      isConstructed: true
    });
    
    // Remove the blocks used to create the golem
    if (!alreadyConstructed) {
      CopperGolem.removeStructureBlocks(world, position);
    }
    
    // Add golem to the world
    world.addEntity(golem);
    
    return golem;
  }
  
  /**
   * Validate that the block structure can form a copper golem
   * @param {World} world - The game world
   * @param {Object} position - Base position of the structure
   * @returns {boolean} - Whether the structure is valid
   */
  static validateStructure(world, position) {
    if (!world) return false;
    
    // Check for a T-shaped structure of copper blocks
    // Bottom block (base)
    if (world.getBlockAt(position.x, position.y, position.z)?.type !== 'copper_block') {
      return false;
    }
    
    // Middle block (body)
    if (world.getBlockAt(position.x, position.y + 1, position.z)?.type !== 'copper_block') {
      return false;
    }
    
    // Top block (head)
    if (world.getBlockAt(position.x, position.y + 2, position.z)?.type !== 'carved_pumpkin') {
      return false;
    }
    
    // Arms (horizontal blocks from the middle)
    if (world.getBlockAt(position.x + 1, position.y + 1, position.z)?.type !== 'copper_block' &&
        world.getBlockAt(position.x - 1, position.y + 1, position.z)?.type !== 'copper_block') {
      return false;
    }
    
    return true;
  }
  
  /**
   * Remove the blocks used to create the golem
   * @param {World} world - The game world
   * @param {Object} position - Base position of the structure
   */
  static removeStructureBlocks(world, position) {
    if (!world) return;
    
    // Remove structure blocks
    world.setBlockAt(position.x, position.y, position.z, { type: 'air' });
    world.setBlockAt(position.x, position.y + 1, position.z, { type: 'air' });
    world.setBlockAt(position.x, position.y + 2, position.z, { type: 'air' });
    
    // Check and remove arms (only if they exist)
    if (world.getBlockAt(position.x + 1, position.y + 1, position.z)?.type === 'copper_block') {
      world.setBlockAt(position.x + 1, position.y + 1, position.z, { type: 'air' });
    }
    
    if (world.getBlockAt(position.x - 1, position.y + 1, position.z)?.type === 'copper_block') {
      world.setBlockAt(position.x - 1, position.y + 1, position.z, { type: 'air' });
    }
  }
  
  /**
   * Get direction to a target position
   * @param {Object} targetPosition - Position to move toward
   * @returns {Object} - Direction vector
   */
  getDirectionTo(targetPosition) {
    const dx = targetPosition.x - this.position.x;
    const dy = targetPosition.y - this.position.y;
    const dz = targetPosition.z - this.position.z;
    
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance === 0) return { x: 0, y: 0, z: 0 };
    
    return {
      x: dx / distance,
      y: dy / distance,
      z: dz / distance
    };
  }
  
  /**
   * Get distance to a target position
   * @param {Object} targetPosition - Position to check distance to
   * @returns {number} - Distance
   */
  getDistanceTo(targetPosition) {
    const dx = targetPosition.x - this.position.x;
    const dy = targetPosition.y - this.position.y;
    const dz = targetPosition.z - this.position.z;
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * Move in a specified direction
   * @param {Object} direction - Direction vector
   * @param {number} speedModifier - Speed modification factor
   */
  moveInDirection(direction, speedModifier) {
    this.velocity.x = direction.x * this.speed * speedModifier;
    this.velocity.z = direction.z * this.speed * speedModifier;
  }
  
  /**
   * Serialize the copper golem for storage
   * @returns {Object} - Serialized representation
   */
  serialize() {
    const baseData = super.serialize();
    
    return {
      ...baseData,
      oxidationState: this.oxidationState,
      isWaxed: this.isWaxed,
      oxidationTimer: this.oxidationTimer,
      oxidationRate: this.oxidationRate,
      stationary: this.stationary,
      canPressButtons: this.canPressButtons,
      lastPressedButtonId: this.lastPressedButtonId,
      isConstructed: this.isConstructed
    };
  }
  
  /**
   * Create a copper golem from serialized data
   * @param {Object} data - Serialized copper golem data
   * @returns {CopperGolem} - Deserialized copper golem
   */
  static deserialize(data) {
    if (!data) return null;
    
    // Ensure ID is preserved exactly from serialized data
    const id = data.id;
    
    const golem = new CopperGolem({
      id: id, // Use the exact ID from serialized data
      position: data.position,
      velocity: data.velocity,
      health: data.health,
      oxidationState: data.oxidationState,
      isWaxed: data.isWaxed,
      oxidationTimer: data.oxidationTimer,
      oxidationRate: data.oxidationRate,
      stationary: data.stationary,
      canPressButtons: data.canPressButtons,
      lastPressedButtonId: data.lastPressedButtonId,
      isConstructed: data.isConstructed !== undefined ? data.isConstructed : true
    });
    
    // Override ID explicitly to ensure it's preserved
    golem.id = id;
    
    return golem;
  }
}

module.exports = CopperGolem;
module.exports.OxidationState = OxidationState; 