/**
 * UI component for displaying active potion effects
 */
class PotionEffectsUI {
  /**
   * Create a new PotionEffectsUI
   * @param {Game} game - Game instance
   */
  constructor(game) {
    this.game = game;
    this.effects = [];
    this.container = null;
    
    this.initUI();
  }
  
  /**
   * Initialize the UI elements
   */
  initUI() {
    // Create container for potion effects
    this.container = document.createElement('div');
    this.container.className = 'potion-effects-container';
    
    // Style the container
    Object.assign(this.container.style, {
      position: 'absolute',
      right: '10px',
      top: '50px',
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      zIndex: '100'
    });
    
    // Add to DOM
    document.body.appendChild(this.container);
  }
  
  /**
   * Update displayed effects
   * @param {Array} effects - Array of active effects
   */
  updateEffects(effects) {
    // Clear existing effects
    this.container.innerHTML = '';
    this.effects = effects || [];
    
    // Nothing to show if no effects
    if (!this.effects.length) return;
    
    // Add each effect
    this.effects.forEach(effect => {
      const effectElement = this.createEffectElement(effect);
      this.container.appendChild(effectElement);
    });
  }
  
  /**
   * Create UI element for a single effect
   * @param {Object} effect - Effect data
   * @returns {HTMLElement} The effect UI element
   */
  createEffectElement(effect) {
    const effectElement = document.createElement('div');
    effectElement.className = 'potion-effect';
    
    // Style the effect element
    Object.assign(effectElement.style, {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: '5px',
      padding: '5px',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      backdropFilter: 'blur(2px)',
      minWidth: '120px'
    });
    
    // Create icon
    const icon = document.createElement('div');
    icon.className = 'effect-icon';
    Object.assign(icon.style, {
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      backgroundColor: effect.color || '#7CAFC6',
      marginRight: '8px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '10px'
    });
    
    // Add icon image or identifier
    const iconChar = this.getEffectIconChar(effect.type);
    icon.textContent = iconChar;
    
    // Create info container
    const info = document.createElement('div');
    info.className = 'effect-info';
    
    // Create name element
    const name = document.createElement('div');
    name.className = 'effect-name';
    name.textContent = this.formatEffectName(effect.type);
    Object.assign(name.style, {
      fontWeight: 'bold',
      marginBottom: '2px'
    });
    
    // Create duration element
    const duration = document.createElement('div');
    duration.className = 'effect-duration';
    duration.textContent = this.formatDuration(effect.remainingTime);
    Object.assign(duration.style, {
      fontSize: '10px',
      opacity: '0.8'
    });
    
    // Add timer update
    const effectId = effect.id;
    const startTime = Date.now();
    const totalDuration = effect.remainingTime;
    
    const updateTimer = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, totalDuration - elapsed);
      
      if (remaining > 0) {
        duration.textContent = this.formatDuration(remaining);
        requestAnimationFrame(updateTimer);
      } else {
        // Remove effect when timer ends
        if (effectElement.parentNode) {
          effectElement.parentNode.removeChild(effectElement);
        }
      }
    };
    
    requestAnimationFrame(updateTimer);
    
    // Assemble the elements
    info.appendChild(name);
    info.appendChild(duration);
    effectElement.appendChild(icon);
    effectElement.appendChild(info);
    
    // Add level indicator if effect has a level
    if (effect.level && effect.level > 1) {
      const level = document.createElement('div');
      level.className = 'effect-level';
      level.textContent = this.getRomanNumeral(effect.level);
      Object.assign(level.style, {
        marginLeft: 'auto',
        fontWeight: 'bold',
        fontSize: '12px',
        paddingLeft: '5px'
      });
      effectElement.appendChild(level);
    }
    
    return effectElement;
  }
  
  /**
   * Format effect name to be more readable
   * @param {string} type - Effect type
   * @returns {string} Formatted name
   */
  formatEffectName(type) {
    // Convert SNAKE_CASE to Title Case
    return type
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  /**
   * Format duration in mm:ss format
   * @param {number} ms - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  /**
   * Get icon character for effect
   * @param {string} type - Effect type
   * @returns {string} Icon character
   */
  getEffectIconChar(type) {
    const iconMap = {
      SPEED: '►',
      SLOWNESS: '◄',
      HASTE: '↯',
      MINING_FATIGUE: '↓',
      STRENGTH: '↑',
      WEAKNESS: '↓',
      INSTANT_HEALTH: '♥',
      INSTANT_DAMAGE: '☠',
      JUMP_BOOST: '↑',
      NAUSEA: '◎',
      REGENERATION: '✚',
      RESISTANCE: '❖',
      FIRE_RESISTANCE: '🔥',
      WATER_BREATHING: '~',
      INVISIBILITY: '◌',
      BLINDNESS: '●',
      NIGHT_VISION: '◐',
      HUNGER: '✺',
      POISON: '☣',
      WITHER: '☠',
      HEALTH_BOOST: '♥',
      ABSORPTION: '⬓',
      SATURATION: '☕',
      GLOWING: '☀',
      LEVITATION: '↟',
      LUCK: '♣',
      BAD_LUCK: '♠',
      SLOW_FALLING: '☂',
      CONDUIT_POWER: '♒',
      DOLPHINS_GRACE: '≈',
      BAD_OMEN: '☇',
      HERO_OF_THE_VILLAGE: '♚'
    };
    
    return iconMap[type] || '?';
  }
  
  /**
   * Convert number to Roman numeral (for effect levels)
   * @param {number} num - Number to convert
   * @returns {string} Roman numeral
   */
  getRomanNumeral(num) {
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return romanNumerals[num - 1] || num.toString();
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.effects = [];
  }
}

export default PotionEffectsUI; 