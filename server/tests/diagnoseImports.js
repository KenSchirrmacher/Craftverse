/**
 * Diagnostic script to identify import errors
 */

console.log('Starting diagnostic...');

try {
  console.log('Testing Ancient Seeds imports...');
  const AncientSeedItem = require('../items/ancientSeedItem');
  const AncientPlantBlock = require('../blocks/ancientPlantBlock');
  console.log('✅ Ancient Seeds imports successful');
} catch (error) {
  console.error('❌ Error importing Ancient Seeds modules:', error.message);
}

try {
  console.log('Testing Item/Block Registry imports...');
  const ItemRegistry = require('../items/itemRegistry');
  const BlockRegistry = require('../blocks/blockRegistry');
  console.log('✅ Registry imports successful');
} catch (error) {
  console.error('❌ Error importing Registry modules:', error.message);
}

try {
  console.log('Testing Copper Golem imports...');
  const CopperGolem = require('../mobs/copperGolem');
  console.log('✅ Copper Golem imports successful');
} catch (error) {
  console.error('❌ Error importing Copper Golem module:', error.message);
}

try {
  console.log('Testing Copper Oxidation Manager...');
  const CopperOxidationManager = require('../copper/oxidationManager');
  console.log('✅ Copper Oxidation Manager import successful');
} catch (error) {
  console.error('❌ Error importing Copper Oxidation Manager:', error.message);
}

try {
  console.log('Testing Trailblazer imports...');
  const TrailblazerVillager = require('../mobs/trailblazerVillager');
  console.log('✅ Trailblazer imports successful');
} catch (error) {
  console.error('❌ Error importing Trailblazer module:', error.message);
}

try {
  console.log('Testing Explorer Tools imports...');
  const ExplorerCompassItem = require('../items/explorerCompassItem');
  const BiomeMapItem = require('../items/biomeMapItem');
  console.log('✅ Explorer Tools imports successful');
} catch (error) {
  console.error('❌ Error importing Explorer Tools modules:', error.message);
}

try {
  console.log('Testing Decorated Pots imports...');
  const EnhancedPotItem = require('../items/enhancedPotItem');
  const EnhancedPotBaseItem = require('../items/enhancedPotBaseItem');
  console.log('✅ Decorated Pots imports successful');
} catch (error) {
  console.error('❌ Error importing Decorated Pots modules:', error.message);
}

try {
  console.log('Testing Tamed Animal imports...');
  const PetCommandSystem = require('../animals/petCommandSystem');
  console.log('✅ Tamed Animal imports successful');
} catch (error) {
  console.error('❌ Error importing Pet Command System:', error.message);
}

try {
  console.log('Testing Wolf Armor imports...');
  const WolfArmorItem = require('../items/wolfArmorItem');
  console.log('✅ Wolf Armor imports successful');
} catch (error) {
  console.error('❌ Error importing Wolf Armor module:', error.message);
}

try {
  console.log('Testing World Generator imports...');
  const WorldGenerator = require('../world/worldGenerator');
  console.log('✅ World Generator imports successful');
} catch (error) {
  console.error('❌ Error importing World Generator module:', error.message);
}

try {
  console.log('Testing Mob Manager imports...');
  const MobManager = require('../mobs/mobManager');
  console.log('✅ Mob Manager imports successful');
} catch (error) {
  console.error('❌ Error importing Mob Manager module:', error.message);
}

console.log('Diagnostic complete.'); 