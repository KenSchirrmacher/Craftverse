/**
 * WindTurbineGenerator - Generates Wind Turbine structures for the 1.22 Update (Sorcery Update)
 * Handles generation of tower, rotor, and energy distribution components
 */

class WindTurbineGenerator {
  /**
   * Create a new Wind Turbine generator
   * @param {Object} world - World instance
   */
  constructor(world) {
    this.world = world;
    this.random = world ? world.random : Math.random;
    
    // Wind Turbine configuration
    this.config = {
      minHeight: 8,
      maxHeight: 20,
      rotorSizeMin: 5,
      rotorSizeMax: 9,
      baseSize: 5,  // Size of the foundation
      materials: {
        foundation: 'deepslate_bricks',
        tower: 'oxidized_copper',
        rotor: 'iron_block',
        blades: 'light_gray_wool',
        energy: 'redstone_block'
      },
      // Valid directions the rotor can face
      directions: ['north', 'south', 'east', 'west']
    };
  }
  
  /**
   * Set world reference
   * @param {Object} world - World instance
   */
  setWorld(world) {
    this.world = world;
    this.random = world.random || Math.random;
  }
  
  /**
   * Get a random integer between min and max (inclusive)
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random integer
   */
  getRandomInt(min, max) {
    // Use Math.random directly if this.random is not a function
    const randomFunc = typeof this.random === 'function' ? this.random : Math.random;
    return Math.floor(randomFunc() * (max - min + 1)) + min;
  }
  
  /**
   * Generate a Wind Turbine structure
   * @param {Object} position - Starting position
   * @param {Object} options - Generation options
   * @returns {Object} Generated structure info
   */
  generate(position, options = {}) {
    const startTime = Date.now();
    console.log(`Generating Wind Turbine structure at ${JSON.stringify(position)}...`);
    
    // Merge options with defaults
    const config = { ...this.config, ...options };
    
    // Determine turbine properties
    const height = options.height || this.getRandomInt(config.minHeight, config.maxHeight);
    const rotorSize = options.rotorSize || this.getRandomInt(config.rotorSizeMin, config.rotorSizeMax);
    const rotorFacing = options.rotorFacing || config.directions[this.getRandomInt(0, 3)];
    
    // Calculate energy output based on height (higher = more energy)
    const maxEnergyOutput = Math.min(15, Math.floor(height / 2));
    
    // Initialize structure data
    const structure = {
      position: { ...position },
      height: height,
      rotorSize: rotorSize,
      rotorFacing: rotorFacing,
      maxEnergyOutput: maxEnergyOutput,
      bounds: {
        min: {
          x: position.x - Math.max(Math.floor(rotorSize / 2), Math.floor(config.baseSize / 2)),
          y: position.y - 1, // Include foundation
          z: position.z - Math.max(Math.floor(rotorSize / 2), Math.floor(config.baseSize / 2))
        },
        max: {
          x: position.x + Math.max(Math.ceil(rotorSize / 2), Math.ceil(config.baseSize / 2)),
          y: position.y + height + Math.ceil(rotorSize / 2),
          z: position.z + Math.max(Math.ceil(rotorSize / 2), Math.ceil(config.baseSize / 2))
        }
      }
    };
    
    // Build the structure in the world
    if (this.world) {
      // Build foundation
      this.buildFoundation(position, config);
      
      // Build tower
      this.buildTower(position, height, config);
      
      // Build rotor and blades
      this.buildRotor(position, height, rotorSize, rotorFacing, config);
      
      // Build energy transmitter base
      this.buildEnergyTransmitter(position, config);
    }
    
    const endTime = Date.now();
    console.log(`Generated Wind Turbine with height ${height} and rotor size ${rotorSize} in ${endTime - startTime}ms`);
    
    return structure;
  }
  
  /**
   * Build the foundation of the wind turbine
   * @param {Object} position - Base position
   * @param {Object} config - Configuration options
   */
  buildFoundation(position, config) {
    const baseSize = config.baseSize;
    const halfBase = Math.floor(baseSize / 2);
    
    // Build foundation platform
    for (let x = -halfBase; x <= halfBase; x++) {
      for (let z = -halfBase; z <= halfBase; z++) {
        // Build foundation block
        this.world.setBlock({
          x: position.x + x,
          y: position.y - 1,
          z: position.z + z
        }, { type: config.materials.foundation });
        
        // Add pattern to the foundation
        if ((x === -halfBase || x === halfBase) || (z === -halfBase || z === halfBase)) {
          // Border blocks
          this.world.setBlock({
            x: position.x + x,
            y: position.y,
            z: position.z + z
          }, { type: config.materials.foundation });
        }
      }
    }
  }
  
  /**
   * Build the tower of the wind turbine
   * @param {Object} position - Base position
   * @param {number} height - Tower height
   * @param {Object} config - Configuration options
   */
  buildTower(position, height, config) {
    // Build central tower column
    for (let y = 0; y < height; y++) {
      this.world.setBlock({
        x: position.x,
        y: position.y + y,
        z: position.z
      }, { type: config.materials.tower });
      
      // Add details to tower every 4 blocks
      if (y > 0 && y % 4 === 0 && y < height - 1) {
        // Ring of blocks around the tower
        for (let x = -1; x <= 1; x++) {
          for (let z = -1; z <= 1; z++) {
            // Skip the center block (already placed)
            if (x === 0 && z === 0) continue;
            
            // Skip corner blocks for a nicer shape
            if (Math.abs(x) === 1 && Math.abs(z) === 1) continue;
            
            this.world.setBlock({
              x: position.x + x,
              y: position.y + y,
              z: position.z + z
            }, { type: config.materials.tower });
          }
        }
      }
    }
  }
  
  /**
   * Build the rotor and blades of the wind turbine
   * @param {Object} position - Base position
   * @param {number} height - Tower height
   * @param {number} rotorSize - Size of the rotor
   * @param {string} facing - Direction the rotor faces ('north', 'south', 'east', 'west')
   * @param {Object} config - Configuration options
   */
  buildRotor(position, height, rotorSize, facing, config) {
    // Center of the rotor
    const center = {
      x: position.x,
      y: position.y + height,
      z: position.z
    };
    
    // Rotor center (hub)
    this.world.setBlock({
      x: center.x,
      y: center.y,
      z: center.z
    }, { type: config.materials.rotor });
    
    // Add blocks around the hub
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          // Skip the center block (already placed)
          if (x === 0 && y === 0 && z === 0) continue;
          
          // Skip corner blocks for a nicer shape
          if (Math.abs(x) + Math.abs(y) + Math.abs(z) > 2) continue;
          
          this.world.setBlock({
            x: center.x + x,
            y: center.y + y,
            z: center.z + z
          }, { type: config.materials.rotor });
        }
      }
    }
    
    // Build blades
    const bladeLength = Math.floor(rotorSize / 2);
    
    // Helper function to determine blade offset based on facing direction
    const getBladeOffset = (length, dir) => {
      switch (dir) {
        case 'north': return { x: 0, y: 0, z: -length };
        case 'south': return { x: 0, y: 0, z: length };
        case 'east': return { x: length, y: 0, z: 0 };
        case 'west': return { x: -length, y: 0, z: 0 };
        default: return { x: 0, y: 0, z: 0 };
      }
    };
    
    // Determine perpendicular directions based on facing
    const perpendicular = {
      north: { x: 1, y: 0, z: 0 },
      south: { x: 1, y: 0, z: 0 },
      east: { x: 0, y: 0, z: 1 },
      west: { x: 0, y: 0, z: 1 }
    };
    
    // Build main blade along the facing direction
    const mainOffset = getBladeOffset(bladeLength, facing);
    for (let i = 1; i <= bladeLength; i++) {
      const distance = i / bladeLength; // Normalized distance from center
      const offset = getBladeOffset(i, facing);
      
      // Main blade block
      this.world.setBlock({
        x: center.x + offset.x,
        y: center.y + offset.y,
        z: center.z + offset.z
      }, { type: config.materials.blades });
      
      // Add width to the blade based on distance from center
      const width = Math.max(1, Math.floor((1 - distance) * 3));
      
      for (let w = 1; w <= width; w++) {
        // Add blade width in the positive perpendicular direction
        this.world.setBlock({
          x: center.x + offset.x + perpendicular[facing].x * w,
          y: center.y + offset.y + w % 2, // Slight vertical variation
          z: center.z + offset.z + perpendicular[facing].z * w
        }, { type: config.materials.blades });
        
        // Add blade width in the negative perpendicular direction
        this.world.setBlock({
          x: center.x + offset.x - perpendicular[facing].x * w,
          y: center.y + offset.y - w % 2, // Slight vertical variation
          z: center.z + offset.z - perpendicular[facing].z * w
        }, { type: config.materials.blades });
      }
    }
    
    // Build opposite blade
    const oppositeDirection = {
      north: 'south',
      south: 'north',
      east: 'west',
      west: 'east'
    };
    
    const oppositeOffset = getBladeOffset(bladeLength, oppositeDirection[facing]);
    for (let i = 1; i <= bladeLength; i++) {
      const distance = i / bladeLength; // Normalized distance from center
      const offset = getBladeOffset(i, oppositeDirection[facing]);
      
      // Main blade block
      this.world.setBlock({
        x: center.x + offset.x,
        y: center.y + offset.y,
        z: center.z + offset.z
      }, { type: config.materials.blades });
      
      // Add width to the blade based on distance from center
      const width = Math.max(1, Math.floor((1 - distance) * 3));
      
      for (let w = 1; w <= width; w++) {
        // Add blade width in the positive perpendicular direction
        this.world.setBlock({
          x: center.x + offset.x + perpendicular[facing].x * w,
          y: center.y + offset.y - w % 2, // Slight vertical variation
          z: center.z + offset.z + perpendicular[facing].z * w
        }, { type: config.materials.blades });
        
        // Add blade width in the negative perpendicular direction
        this.world.setBlock({
          x: center.x + offset.x - perpendicular[facing].x * w,
          y: center.y + offset.y + w % 2, // Slight vertical variation
          z: center.z + offset.z - perpendicular[facing].z * w
        }, { type: config.materials.blades });
      }
    }
    
    // Build vertical blades
    for (let i = 1; i <= bladeLength; i++) {
      const distance = i / bladeLength; // Normalized distance from center
      
      // Upward blade
      this.world.setBlock({
        x: center.x,
        y: center.y + i,
        z: center.z
      }, { type: config.materials.blades });
      
      // Downward blade
      this.world.setBlock({
        x: center.x,
        y: center.y - i,
        z: center.z
      }, { type: config.materials.blades });
      
      // Add width to the vertical blades based on distance from center
      const width = Math.max(1, Math.floor((1 - distance) * 2));
      
      for (let w = 1; w <= width; w++) {
        // Upward blade width
        this.world.setBlock({
          x: center.x + perpendicular[facing].x * w,
          y: center.y + i,
          z: center.z + perpendicular[facing].z * w
        }, { type: config.materials.blades });
        
        this.world.setBlock({
          x: center.x - perpendicular[facing].x * w,
          y: center.y + i,
          z: center.z - perpendicular[facing].z * w
        }, { type: config.materials.blades });
        
        // Downward blade width
        this.world.setBlock({
          x: center.x + perpendicular[facing].x * w,
          y: center.y - i,
          z: center.z + perpendicular[facing].z * w
        }, { type: config.materials.blades });
        
        this.world.setBlock({
          x: center.x - perpendicular[facing].x * w,
          y: center.y - i,
          z: center.z - perpendicular[facing].z * w
        }, { type: config.materials.blades });
      }
    }
  }
  
  /**
   * Build the energy transmitter at the base of the turbine
   * @param {Object} position - Base position
   * @param {Object} config - Configuration options
   */
  buildEnergyTransmitter(position, config) {
    // Create a small redstone-based energy transmitter at the base
    this.world.setBlock({
      x: position.x,
      y: position.y,
      z: position.z
    }, { type: 'wind_energy_transmitter' });
    
    // Place redstone blocks around the base for visual effect
    const redstonePositions = [
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: -1 }
    ];
    
    for (const offset of redstonePositions) {
      this.world.setBlock({
        x: position.x + offset.x,
        y: position.y + offset.y,
        z: position.z + offset.z
      }, { type: config.materials.energy });
    }
  }
}

module.exports = WindTurbineGenerator; 