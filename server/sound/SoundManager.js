/**
 * SoundManager - Manages sound effects in the world
 */

class SoundManager {
  constructor(world) {
    this.world = world;
    this.sounds = new Map();
    this.nextSoundId = 1;
  }

  /**
   * Play a sound effect
   * @param {string} type - The type of sound effect
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} options - Additional options for the sound effect
   * @returns {string} The sound effect ID
   */
  playSound(type, x, y, z, options = {}) {
    const id = `sound_${this.nextSoundId++}`;
    const sound = {
      id,
      type,
      position: { x, y, z },
      volume: options.volume || 1.0,
      pitch: options.pitch || 1.0,
      attenuation: options.attenuation || 16.0,
      category: options.category || 'master',
      data: options.data || {}
    };
    this.sounds.set(id, sound);
    return id;
  }

  /**
   * Stop a sound effect
   * @param {string} soundId - The ID of the sound effect to stop
   * @returns {boolean} Whether the sound effect was stopped
   */
  stopSound(soundId) {
    return this.sounds.delete(soundId);
  }

  /**
   * Get a sound effect by ID
   * @param {string} soundId - The ID of the sound effect to get
   * @returns {Object|null} The sound effect, or null if not found
   */
  getSound(soundId) {
    return this.sounds.get(soundId) || null;
  }

  /**
   * Get all sound effects
   * @returns {Array} Array of all sound effects
   */
  getAllSounds() {
    return Array.from(this.sounds.values());
  }

  /**
   * Get sound effects within a region
   * @param {number} x1 - Start X coordinate
   * @param {number} y1 - Start Y coordinate
   * @param {number} z1 - Start Z coordinate
   * @param {number} x2 - End X coordinate
   * @param {number} y2 - End Y coordinate
   * @param {number} z2 - End Z coordinate
   * @returns {Array} Array of sound effects in the region
   */
  getSoundsInRegion(x1, y1, z1, x2, y2, z2) {
    return this.getAllSounds().filter(sound => {
      const pos = sound.position;
      return pos.x >= x1 && pos.x <= x2 &&
             pos.y >= y1 && pos.y <= y2 &&
             pos.z >= z1 && pos.z <= z2;
    });
  }

  /**
   * Update all sound effects
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // In a real implementation, this would handle sound effect updates
    // For testing purposes, we'll just clear expired sounds
    for (const [id, sound] of this.sounds.entries()) {
      if (sound.data.duration && sound.data.age >= sound.data.duration) {
        this.sounds.delete(id);
      } else if (sound.data.age !== undefined) {
        sound.data.age += deltaTime;
      }
    }
  }

  /**
   * Clear all sound effects
   */
  clear() {
    this.sounds.clear();
  }
}

module.exports = { SoundManager }; 