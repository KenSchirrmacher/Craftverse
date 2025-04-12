const Biome = require('./baseBiome');

/**
 * Biome Types - Defines biome categories, classifications, and type-based properties
 */

/**
 * Biome temperature categories
 * Used for classifying biomes by temperature range
 */
const BiomeTemperature = {
  FROZEN: 'frozen',     // Snow, ice biomes (temperature < 0.15)
  COLD: 'cold',         // Cold biomes (temperature 0.15-0.3)
  TEMPERATE: 'temperate', // Medium temperature (0.3-0.6) 
  WARM: 'warm',         // Warm biomes (0.6-0.8)
  HOT: 'hot'            // Hot biomes (temperature > 0.8)
};

/**
 * Biome humidity categories
 * Used for classifying biomes by precipitation/humidity
 */
const BiomeHumidity = {
  ARID: 'arid',         // Very dry (precipitation < 0.1)
  DRY: 'dry',           // Somewhat dry (precipitation 0.1-0.3)
  NEUTRAL: 'neutral',   // Medium humidity (precipitation 0.3-0.6)
  HUMID: 'humid',       // Somewhat wet (precipitation 0.6-0.8)
  WET: 'wet'            // Very wet (precipitation > 0.8)
};

/**
 * Biome terrain categories 
 * Basic terrain types for biomes
 */
const BiomeTerrain = {
  OCEAN: 'ocean',       // Deep water areas
  RIVER: 'river',       // Narrow water channels
  BEACH: 'beach',       // Shorelines
  PLAINS: 'plains',     // Flat grasslands
  FOREST: 'forest',     // Tree-covered areas
  HILLS: 'hills',       // Medium elevation
  MOUNTAINS: 'mountains', // High elevation
  DESERT: 'desert',     // Sandy arid areas
  TAIGA: 'taiga',       // Cold coniferous forests
  SWAMP: 'swamp',       // Wetlands
  SAVANNA: 'savanna',   // Dry grasslands with scattered trees
  JUNGLE: 'jungle',     // Dense tropical forests
  BADLANDS: 'badlands', // Dry, eroded terrain
  UNDERGROUND: 'underground' // Underground biomes
};

/**
 * Get the temperature category for a temperature value
 * @param {number} temperature - Temperature value (typically -1.0 to 1.0)
 * @returns {string} - Temperature category name
 */
function getTemperatureCategory(temperature) {
  if (temperature < 0.15) return BiomeTemperature.FROZEN;
  if (temperature < 0.3) return BiomeTemperature.COLD;
  if (temperature < 0.6) return BiomeTemperature.TEMPERATE;
  if (temperature < 0.8) return BiomeTemperature.WARM;
  return BiomeTemperature.HOT;
}

/**
 * Get the humidity category for a precipitation value
 * @param {number} precipitation - Precipitation value (typically 0.0 to 1.0)
 * @returns {string} - Humidity category name
 */
function getHumidityCategory(precipitation) {
  if (precipitation < 0.1) return BiomeHumidity.ARID;
  if (precipitation < 0.3) return BiomeHumidity.DRY;
  if (precipitation < 0.6) return BiomeHumidity.NEUTRAL;
  if (precipitation < 0.8) return BiomeHumidity.HUMID;
  return BiomeHumidity.WET;
}

/**
 * Get the expected terrain type based on climate parameters
 * @param {Object} climate - Climate parameters
 * @returns {string} - Terrain category
 */
function getExpectedTerrainType(climate) {
  const { temperature, precipitation, continentalness, erosion } = climate;
  
  // Determine if it's ocean or land first based on continentalness
  if (continentalness < 0.3) {
    return BiomeTerrain.OCEAN;
  }
  
  // Check for mountains based on erosion and continentalness
  if (erosion < 0.3 && continentalness > 0.7) {
    return BiomeTerrain.MOUNTAINS;
  }
  
  // Check for hills
  if (erosion < 0.5 && continentalness > 0.5) {
    return BiomeTerrain.HILLS;
  }
  
  // Check for river
  if (erosion > 0.8 && continentalness > 0.3 && continentalness < 0.6) {
    return BiomeTerrain.RIVER;
  }
  
  // Check for beach along coastlines
  if (continentalness >= 0.3 && continentalness < 0.35) {
    return BiomeTerrain.BEACH;
  }
  
  // Temperature and precipitation based biomes
  const temperatureCategory = getTemperatureCategory(temperature);
  const humidityCategory = getHumidityCategory(precipitation);
  
  // Hot biomes
  if (temperatureCategory === BiomeTemperature.HOT) {
    if (humidityCategory === BiomeHumidity.ARID || humidityCategory === BiomeHumidity.DRY) {
      return BiomeTerrain.DESERT;
    }
    if (humidityCategory === BiomeHumidity.WET || humidityCategory === BiomeHumidity.HUMID) {
      return BiomeTerrain.JUNGLE;
    }
    return BiomeTerrain.SAVANNA;
  }
  
  // Cold biomes
  if (temperatureCategory === BiomeTemperature.COLD || temperatureCategory === BiomeTemperature.FROZEN) {
    if (humidityCategory === BiomeHumidity.HUMID || humidityCategory === BiomeHumidity.WET) {
      return BiomeTerrain.TAIGA;
    }
    return BiomeTerrain.PLAINS;
  }
  
  // Temperate/warm biomes
  if (humidityCategory === BiomeHumidity.WET) {
    if (erosion > 0.7) {
      return BiomeTerrain.SWAMP;
    }
    return BiomeTerrain.FOREST;
  }
  
  if (humidityCategory === BiomeHumidity.HUMID) {
    return BiomeTerrain.FOREST;
  }
  
  // Default to plains
  return BiomeTerrain.PLAINS;
}

/**
 * Get appropriate tree types for a biome based on climate
 * @param {Object} climate - Climate parameters
 * @returns {Array} - Array of suitable tree types
 */
function getTreeTypes(climate) {
  const temperatureCategory = getTemperatureCategory(climate.temperature);
  const humidityCategory = getHumidityCategory(climate.precipitation);
  
  // Different tree types based on climate
  switch (temperatureCategory) {
    case BiomeTemperature.FROZEN:
    case BiomeTemperature.COLD:
      return ['spruce', 'pine'];
      
    case BiomeTemperature.TEMPERATE:
      if (humidityCategory === BiomeHumidity.WET || humidityCategory === BiomeHumidity.HUMID) {
        return ['oak', 'birch', 'dark_oak'];
      }
      return ['oak', 'birch'];
      
    case BiomeTemperature.WARM:
      if (humidityCategory === BiomeHumidity.WET) {
        return ['jungle', 'oak'];
      }
      if (humidityCategory === BiomeHumidity.ARID || humidityCategory === BiomeHumidity.DRY) {
        return ['acacia'];
      }
      return ['oak', 'birch'];
      
    case BiomeTemperature.HOT:
      if (humidityCategory === BiomeHumidity.ARID || humidityCategory === BiomeHumidity.DRY) {
        return ['cactus'];
      }
      if (humidityCategory === BiomeHumidity.WET) {
        return ['jungle', 'jungle_large'];
      }
      return ['acacia'];
      
    default:
      return ['oak'];
  }
}

/**
 * Get the expected tree density for a biome based on climate
 * @param {Object} climate - Climate parameters
 * @returns {number} - Tree density value (0-1)
 */
function getTreeDensity(climate) {
  const temperatureCategory = getTemperatureCategory(climate.temperature);
  const humidityCategory = getHumidityCategory(climate.precipitation);
  
  // Base density from precipitation
  let density = climate.precipitation * 0.8;
  
  // Modify based on temperature
  switch (temperatureCategory) {
    case BiomeTemperature.FROZEN:
      density *= 0.5; // Fewer trees in frozen biomes
      break;
    case BiomeTemperature.HOT:
      if (humidityCategory === BiomeHumidity.ARID || humidityCategory === BiomeHumidity.DRY) {
        density *= 0.1; // Very few trees in hot, dry biomes
      } else if (humidityCategory === BiomeHumidity.WET) {
        density *= 1.2; // Many trees in hot, wet biomes (jungle)
      }
      break;
    case BiomeTemperature.TEMPERATE:
      if (humidityCategory === BiomeHumidity.HUMID || humidityCategory === BiomeHumidity.WET) {
        density *= 1.1; // More trees in temperate, wet biomes (forest)
      }
      break;
  }
  
  // Ensure density is within range
  return Math.max(0, Math.min(1, density));
}

/**
 * Get the expected grass density for a biome based on climate
 * @param {Object} climate - Climate parameters
 * @returns {number} - Grass density value (0-1)
 */
function getGrassDensity(climate) {
  const temperatureCategory = getTemperatureCategory(climate.temperature);
  const humidityCategory = getHumidityCategory(climate.precipitation);
  
  // Base density from precipitation
  let density = climate.precipitation * 0.9;
  
  // Modify based on temperature
  switch (temperatureCategory) {
    case BiomeTemperature.FROZEN:
      density *= 0.4; // Less grass in frozen biomes
      break;
    case BiomeTemperature.HOT:
      if (humidityCategory === BiomeHumidity.ARID || humidityCategory === BiomeHumidity.DRY) {
        density *= 0.2; // Very little grass in hot, dry biomes
      }
      break;
    case BiomeTemperature.TEMPERATE:
    case BiomeTemperature.WARM:
      if (humidityCategory === BiomeHumidity.NEUTRAL || 
          humidityCategory === BiomeHumidity.HUMID) {
        density *= 1.2; // More grass in temperate, moderate humidity biomes
      }
      break;
  }
  
  // Ensure density is within range
  return Math.max(0, Math.min(1, density));
}

// Plains biome - flat grassland with occasional trees
const plains = new Biome({
  id: 'plains',
  name: 'Plains',
  color: '#91BD59', // Light green
  temperatureRange: [0.2, 0.8],  // Moderate temperature
  precipitationRange: [0.3, 0.7], // Moderate rainfall
  continentalnessRange: [0.1, 0.8], // Inland areas
  erosionRange: [0.2, 0.8],
  weirdnessRange: [-0.5, 0.5], // Normal terrain
  weight: 1.0, // Common biome
  baseHeight: 68,
  heightVariation: 3, // Very flat
  topBlock: { id: 'grass_block', metadata: 0 },
  fillerBlock: { id: 'dirt', metadata: 0 },
  underwaterBlock: { id: 'gravel', metadata: 0 },
  stoneBlock: { id: 'stone', metadata: 0 },
  treeDensity: 0.02, // Sparse trees
  grassDensity: 0.8, // Lots of grass
  flowerDensity: 0.1,
  features: [
    { type: 'tree', id: 'oak', chance: 0.015, minHeight: 4, maxHeight: 6 },
    { type: 'grass', chance: 0.7 },
    { type: 'flower', id: 'dandelion', chance: 0.05 },
    { type: 'flower', id: 'poppy', chance: 0.05 },
    { type: 'boulder', chance: 0.001 }
  ],
  structures: [
    { type: 'village', chance: 0.0005 }
  ],
  spawnRates: {
    passive: 1.0, // High passive mob spawns
    neutral: 0.3,
    hostile: 1.0
  }
});

// Forest biome - higher elevation, lots of trees
const forest = new Biome({
  id: 'forest',
  name: 'Forest',
  color: '#59A03E', // Darker green
  temperatureRange: [0.3, 0.7],
  precipitationRange: [0.5, 1.0], // Higher rainfall
  continentalnessRange: [0.3, 0.9],
  erosionRange: [0.3, 0.7],
  weirdnessRange: [-0.4, 0.4],
  weight: 0.8,
  baseHeight: 70,
  heightVariation: 8, // More varied terrain
  topBlock: { id: 'grass_block', metadata: 0 },
  fillerBlock: { id: 'dirt', metadata: 0 },
  stoneBlock: { id: 'stone', metadata: 0 },
  treeDensity: 0.6, // Very dense trees
  grassDensity: 0.4,
  flowerDensity: 0.2,
  features: [
    { type: 'tree', id: 'oak', chance: 0.4, minHeight: 5, maxHeight: 8 },
    { type: 'tree', id: 'birch', chance: 0.2, minHeight: 5, maxHeight: 7 },
    { type: 'grass', chance: 0.3 },
    { type: 'flower', id: 'lily_of_the_valley', chance: 0.05 },
    { type: 'mushroom', id: 'red_mushroom', chance: 0.02 },
    { type: 'mushroom', id: 'brown_mushroom', chance: 0.03 },
    { type: 'fallen_log', chance: 0.01 }
  ],
  structures: [
    { type: 'cabin', chance: 0.0002 }
  ],
  spawnRates: {
    passive: 0.8,
    neutral: 0.5,
    hostile: 0.9
  },
  fogColor: '#AAFFAA',
  fogDensity: 0.02,
  ambientSounds: ['forest_ambient', 'birds_chirping']
});

// Desert biome - hot and dry with sand
const desert = new Biome({
  id: 'desert',
  name: 'Desert',
  color: '#D9D49D', // Sand color
  temperatureRange: [0.7, 1.0], // Hot
  precipitationRange: [0.0, 0.2], // Very dry
  continentalnessRange: [0.4, 1.0],
  erosionRange: [0.3, 0.9],
  weirdnessRange: [-0.3, 0.7], // Can be weird (dunes)
  weight: 0.6,
  baseHeight: 67,
  heightVariation: 5,
  topBlock: { id: 'sand', metadata: 0 },
  fillerBlock: { id: 'sand', metadata: 0 },
  stoneBlock: { id: 'sandstone', metadata: 0 },
  treeDensity: 0.001, // Almost no trees
  grassDensity: 0.0,
  flowerDensity: 0.0,
  features: [
    { type: 'cactus', chance: 0.02, minHeight: 2, maxHeight: 5 },
    { type: 'dead_bush', chance: 0.05 },
    { type: 'boulder', id: 'sandstone', chance: 0.003 }
  ],
  structures: [
    { type: 'desert_well', chance: 0.0003 },
    { type: 'desert_pyramid', chance: 0.00007 },
    { type: 'village', chance: 0.0001 }
  ],
  spawnRates: {
    passive: 0.1,
    neutral: 0.2,
    hostile: 1.2 // Higher hostile mob spawn
  },
  rainChance: 0.0, // Never rains
  fogColor: '#FFD700', // Golden/sandy fog
  fogDensity: 0.01,
  ambientSounds: ['desert_wind']
});

// Mountains biome - high elevation with snow caps
const mountains = new Biome({
  id: 'mountains',
  name: 'Mountains',
  color: '#606060', // Grey
  temperatureRange: [-1.0, 0.3], // Cold
  precipitationRange: [0.4, 1.0], // Wet (snow)
  continentalnessRange: [0.7, 1.0], // Very continental
  erosionRange: [0.0, 0.4], // Low erosion
  weirdnessRange: [0.2, 1.0], // More weird is more jagged
  weight: 0.5,
  baseHeight: 90, // Much higher base
  heightVariation: 40, // Extreme variation
  topBlock: { id: 'stone', metadata: 0 },
  fillerBlock: { id: 'stone', metadata: 0 },
  stoneBlock: { id: 'stone', metadata: 0 },
  treeDensity: 0.05,
  grassDensity: 0.2,
  flowerDensity: 0.1,
  features: [
    { type: 'tree', id: 'spruce', chance: 0.05, minHeight: 6, maxHeight: 12 },
    { type: 'boulder', id: 'stone', chance: 0.05 },
    { type: 'ore_vein', id: 'coal', chance: 0.02 },
    { type: 'ore_vein', id: 'iron', chance: 0.01 },
    { type: 'snow_layer', chance: 0.7, minHeight: 110 } // Snow above y=110
  ],
  structures: [
    { type: 'mountain_peak', chance: 0.001 }
  ],
  spawnRates: {
    passive: 0.3,
    neutral: 0.7,
    hostile: 0.8
  },
  snowChance: 0.8, // High chance of snow
  fogColor: '#E0E0FF', // Light blue/white fog
  fogDensity: 0.04,
  ambientSounds: ['wind_howling', 'rockfall']
});

// Ocean biome - deep water
const ocean = new Biome({
  id: 'ocean',
  name: 'Ocean',
  color: '#0000AA', // Deep blue
  temperatureRange: [-0.5, 0.7], // Various temperatures
  precipitationRange: [0.5, 1.0], // Always wet (it's water)
  continentalnessRange: [0.0, 0.2], // Low continentalness
  erosionRange: [0.0, 1.0], // All erosion levels
  weirdnessRange: [-1.0, 1.0], // All weirdness levels
  weight: 0.7,
  baseHeight: 40, // Deep underwater
  heightVariation: 10,
  topBlock: { id: 'gravel', metadata: 0 },
  fillerBlock: { id: 'dirt', metadata: 0 },
  underwaterBlock: { id: 'sand', metadata: 0 },
  stoneBlock: { id: 'stone', metadata: 0 },
  treeDensity: 0.0, // No trees underwater
  grassDensity: 0.0,
  flowerDensity: 0.0,
  features: [
    { type: 'seagrass', chance: 0.2 },
    { type: 'kelp', chance: 0.1, minHeight: 4, maxHeight: 12 },
    { type: 'coral', chance: 0.05 },
    { type: 'shipwreck', chance: 0.0005 }
  ],
  structures: [
    { type: 'ocean_monument', chance: 0.0001 },
    { type: 'ocean_ruin', chance: 0.0005 }
  ],
  spawnRates: {
    passive: 0.5, // Fish
    neutral: 0.2,
    hostile: 0.3
  },
  fogColor: '#000080', // Navy blue underwater fog
  fogDensity: 0.1, // Dense fog underwater
  ambientSounds: ['ocean_waves', 'underwater_ambient']
});

// Taiga biome - snowy forest
const taiga = new Biome({
  id: 'taiga',
  name: 'Taiga',
  color: '#596651', // Dark blue-green
  temperatureRange: [-0.5, 0.2], // Cold
  precipitationRange: [0.4, 0.9], // Wet
  continentalnessRange: [0.4, 0.8],
  erosionRange: [0.2, 0.6],
  weirdnessRange: [-0.5, 0.5],
  weight: 0.6,
  baseHeight: 72,
  heightVariation: 12,
  topBlock: { id: 'grass_block', metadata: 0 },
  fillerBlock: { id: 'dirt', metadata: 0 },
  stoneBlock: { id: 'stone', metadata: 0 },
  treeDensity: 0.4,
  grassDensity: 0.3,
  flowerDensity: 0.05,
  features: [
    { type: 'tree', id: 'spruce', chance: 0.35, minHeight: 8, maxHeight: 15 },
    { type: 'tree', id: 'pine', chance: 0.15, minHeight: 10, maxHeight: 20 },
    { type: 'grass', chance: 0.2 },
    { type: 'berry_bush', chance: 0.05 },
    { type: 'snow_layer', chance: 0.5 },
    { type: 'boulder', id: 'mossy_cobblestone', chance: 0.005 }
  ],
  structures: [
    { type: 'igloo', chance: 0.0003 }
  ],
  spawnRates: {
    passive: 0.6,
    neutral: 0.5,
    hostile: 0.9
  },
  snowChance: 0.6,
  fogColor: '#C0D8FF', // Light blue fog
  fogDensity: 0.03,
  ambientSounds: ['wind_through_pines', 'wolf_howl']
});

// Savanna biome - dry grassland with acacia trees
const savanna = new Biome({
  id: 'savanna',
  name: 'Savanna',
  color: '#BFB755', // Yellowish grass
  temperatureRange: [0.6, 1.0], // Hot
  precipitationRange: [0.1, 0.5], // Semi-dry
  continentalnessRange: [0.3, 0.7],
  erosionRange: [0.3, 0.8],
  weirdnessRange: [-0.4, 0.4],
  weight: 0.5,
  baseHeight: 68,
  heightVariation: 5,
  topBlock: { id: 'grass_block', metadata: 0 },
  fillerBlock: { id: 'dirt', metadata: 0 },
  stoneBlock: { id: 'stone', metadata: 0 },
  treeDensity: 0.05, // Sparse trees
  grassDensity: 0.9, // Lots of tall grass
  flowerDensity: 0.03,
  features: [
    { type: 'tree', id: 'acacia', chance: 0.05, minHeight: 5, maxHeight: 7 },
    { type: 'tall_grass', chance: 0.8 },
    { type: 'boulder', id: 'stone', chance: 0.002 }
  ],
  structures: [
    { type: 'village', chance: 0.0003 }
  ],
  spawnRates: {
    passive: 0.8, // Lots of passive mobs (like zebras, giraffes)
    neutral: 0.4,
    hostile: 0.7
  },
  rainChance: 0.1, // Rare rain
  fogColor: '#F0E68C', // Khaki colored fog
  fogDensity: 0.01,
  ambientSounds: ['savanna_wind', 'distant_animals']
});

// Export all biomes for easy access
module.exports = {
  plains,
  forest,
  desert,
  mountains,
  ocean,
  taiga,
  savanna,
  BiomeTemperature,
  BiomeHumidity,
  BiomeTerrain,
  getTemperatureCategory,
  getHumidityCategory,
  getExpectedTerrainType,
  getTreeTypes,
  getTreeDensity,
  getGrassDensity
}; 