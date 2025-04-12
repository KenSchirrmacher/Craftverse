/**
 * PlayerEffectsDisplay - UI component for showing active player status effects
 */
class PlayerEffectsDisplay {
  /**
   * Create a new PlayerEffectsDisplay
   * @param {Object} game - The game instance
   */
  constructor(game) {
    this.game = game;
    this.effects = [];
    this.container = null;
    this.activeEffectElements = new Map();
    
    // Initialize UI
    this.init();
  }
  
  /**
   * Initialize the UI element
   */
  init() {
    this.container = document.createElement('div');
    this.container.className = 'player-effects-display';
    
    // Apply styles
    Object.assign(this.container.style, {
      position: 'absolute',
      top: '10px',
      right: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      pointerEvents: 'none',
      zIndex: '100'
    });
    
    document.body.appendChild(this.container);
    
    // Listen for effect updates
    if (this.game && this.game.socket) {
      this.game.socket.on('player_effects_update', (data) => {
        if (data.entityId === this.game.player.id) {
          this.updateEffects(data.effects);
        }
      });
    }
  }
  
  /**
   * Update the displayed effects
   * @param {Array} effects - Array of active effects
   */
  updateEffects(effects) {
    this.effects = effects || [];
    
    // Track IDs we have seen to know which to remove
    const seenEffectIds = new Set();
    
    // Update or add effects
    this.effects.forEach(effect => {
      seenEffectIds.add(effect.id);
      
      if (this.activeEffectElements.has(effect.id)) {
        // Update existing effect
        this.updateEffectElement(effect);
      } else {
        // Create new effect element
        const element = this.createEffectElement(effect);
        this.container.appendChild(element);
        this.activeEffectElements.set(effect.id, element);
      }
    });
    
    // Remove effects that are no longer active
    for (const [effectId, element] of this.activeEffectElements.entries()) {
      if (!seenEffectIds.has(effectId)) {
        // Remove element
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
        this.activeEffectElements.delete(effectId);
      }
    }
  }
  
  /**
   * Create a visual element for an effect
   * @param {Object} effect - Effect data
   * @returns {HTMLElement} The created element
   */
  createEffectElement(effect) {
    const effectElement = document.createElement('div');
    effectElement.className = 'effect-item';
    effectElement.dataset.effectId = effect.id;
    
    // Apply base styles
    Object.assign(effectElement.style, {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: '4px',
      padding: '5px 8px',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      maxWidth: '200px',
      backdropFilter: 'blur(2px)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
    });
    
    // Create icon with color
    const icon = document.createElement('div');
    icon.className = 'effect-icon';
    
    Object.assign(icon.style, {
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      backgroundColor: effect.color || '#7CAFC6',
      marginRight: '8px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '10px'
    });
    
    // Add icon character
    icon.textContent = this.getEffectIcon(effect.type);
    
    // Create effect details container
    const details = document.createElement('div');
    details.className = 'effect-details';
    
    Object.assign(details.style, {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: '1'
    });
    
    // Create effect name
    const name = document.createElement('div');
    name.className = 'effect-name';
    name.textContent = this.formatEffectName(effect.type);
    
    Object.assign(name.style, {
      fontWeight: 'bold',
      marginBottom: '2px'
    });
    
    // Add level if greater than 1
    if (effect.level > 1) {
      const levelText = this.getRomanNumeral(effect.level);
      name.textContent += ` ${levelText}`;
    }
    
    // Create duration display
    const duration = document.createElement('div');
    duration.className = 'effect-duration';
    
    Object.assign(duration.style, {
      fontSize: '10px',
      opacity: '0.8'
    });
    
    // Set duration info
    this.updateDuration(duration, effect.remainingTime);
    
    // Set up duration update interval
    const startTime = Date.now();
    const initialDuration = effect.remainingTime;
    
    const updateInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, initialDuration - elapsed);
      
      if (remaining <= 0) {
        clearInterval(updateInterval);
        
        // Remove element if it's still in the DOM
        if (effectElement.parentNode) {
          effectElement.parentNode.removeChild(effectElement);
          this.activeEffectElements.delete(effect.id);
        }
      } else {
        this.updateDuration(duration, remaining);
      }
    }, 1000);
    
    // Store interval ID for cleanup
    effectElement.updateInterval = updateInterval;
    
    // Assemble the element
    details.appendChild(name);
    details.appendChild(duration);
    effectElement.appendChild(icon);
    effectElement.appendChild(details);
    
    return effectElement;
  }
  
  /**
   * Update an existing effect element
   * @param {Object} effect - Effect data
   */
  updateEffectElement(effect) {
    const element = this.activeEffectElements.get(effect.id);
    if (!element) return;
    
    // Update duration
    const durationElement = element.querySelector('.effect-duration');
    if (durationElement) {
      this.updateDuration(durationElement, effect.remainingTime);
    }
    
    // Update level if needed
    const nameElement = element.querySelector('.effect-name');
    if (nameElement) {
      nameElement.textContent = this.formatEffectName(effect.type);
      if (effect.level > 1) {
        nameElement.textContent += ` ${this.getRomanNumeral(effect.level)}`;
      }
    }
    
    // Update color
    const iconElement = element.querySelector('.effect-icon');
    if (iconElement) {
      iconElement.style.backgroundColor = effect.color || '#7CAFC6';
    }
    
    // Clear previous interval and set new one
    if (element.updateInterval) {
      clearInterval(element.updateInterval);
    }
    
    const startTime = Date.now();
    const initialDuration = effect.remainingTime;
    
    element.updateInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, initialDuration - elapsed);
      
      if (remaining <= 0) {
        clearInterval(element.updateInterval);
        
        // Remove element if it's still in the DOM
        if (element.parentNode) {
          element.parentNode.removeChild(element);
          this.activeEffectElements.delete(effect.id);
        }
      } else if (durationElement) {
        this.updateDuration(durationElement, remaining);
      }
    }, 1000);
  }
  
  /**
   * Update the duration display
   * @param {HTMLElement} element - Duration element
   * @param {number} duration - Duration in milliseconds
   */
  updateDuration(element, duration) {
    element.textContent = this.formatDuration(duration);
    
    // Change color based on time remaining
    if (duration < 5000) { // Less than 5 seconds
      element.style.color = '#FF5555';
    } else if (duration < 10000) { // Less than 10 seconds
      element.style.color = '#FFAA00';
    } else {
      element.style.color = 'white';
    }
  }
  
  /**
   * Format effect name for display
   * @param {string} type - Effect type
   * @returns {string} Formatted name
   */
  formatEffectName(type) {
    return type.toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  /**
   * Format duration for display
   * @param {number} ms - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  formatDuration(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  /**
   * Get icon character for effect type
   * @param {string} type - Effect type
   * @returns {string} Icon character
   */
  getEffectIcon(type) {
    const icons = {
      SPEED: '→',
      SLOWNESS: '←',
      HASTE: '↯',
      MINING_FATIGUE: '✖',
      STRENGTH: '↑',
      WEAKNESS: '↓',
      JUMP_BOOST: '↥',
      NAUSEA: '☼',
      REGENERATION: '❤',
      RESISTANCE: '⛊',
      FIRE_RESISTANCE: '🔥',
      WATER_BREATHING: '~',
      INVISIBILITY: '◌',
      BLINDNESS: '⬤',
      NIGHT_VISION: '⦿',
      HUNGER: '✺',
      POISON: '☠',
      WITHER: '☠',
      HEALTH_BOOST: '♥',
      ABSORPTION: '⬓',
      SATURATION: '☕',
      LEVITATION: '☁',
      SLOW_FALLING: '☂'
    };
    
    return icons[type] || '?';
  }
  
  /**
   * Convert level to Roman numeral
   * @param {number} num - Effect level
   * @returns {string} Roman numeral
   */
  getRomanNumeral(num) {
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return num > 0 && num <= romanNumerals.length ? romanNumerals[num - 1] : num.toString();
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Remove all intervals
    for (const element of this.activeEffectElements.values()) {
      if (element.updateInterval) {
        clearInterval(element.updateInterval);
      }
    }
    
    // Remove event listeners
    if (this.game && this.game.socket) {
      this.game.socket.off('player_effects_update');
    }
    
    // Remove container
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    // Clear maps
    this.activeEffectElements.clear();
    this.effects = [];
  }
}

export default PlayerEffectsDisplay; 