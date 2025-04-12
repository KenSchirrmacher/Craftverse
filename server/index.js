// Import the VillagerNPC for registration
const VillagerNPC = require('./mobs/villagerNPC');

// ... existing code ...

// In the initialization section, after initializing the mob manager:

// Register the mob manager with the structure generator for villager spawning
if (structureGenerator) {
  structureGenerator.setEntitySpawner((type, position, options) => {
    if (type === 'villager') {
      return mobManager.spawnMob('villager', position, options);
    }
    return null;
  });
}

// Listen for village generation events
worldGenerator.on('structureGenerated', (structure) => {
  if (structure.type === 'village') {
    console.log(`Village generated at ${structure.position.x}, ${structure.position.y}, ${structure.position.z}`);
    
    // Register the village with the mob manager
    mobManager.addVillage(structure);
  }
});

// ... rest of the file ... 