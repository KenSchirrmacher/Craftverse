/**
 * Bamboo Recipes - Crafting recipes for bamboo blocks and items
 * Part of the 1.20 Update
 */

/**
 * Register all bamboo-related crafting recipes
 * @param {CraftingManager} craftingManager - The crafting manager instance
 */
function registerBambooRecipes(craftingManager) {
  // Bamboo Block (9 bamboo -> 1 bamboo block)
  craftingManager.registerShapedRecipe({
    id: 'bamboo_block_recipe',
    type: 'shaped',
    pattern: [
      ['bamboo', 'bamboo', 'bamboo'],
      ['bamboo', 'bamboo', 'bamboo'],
      ['bamboo', 'bamboo', 'bamboo']
    ],
    ingredients: {
      'bamboo': { type: 'bamboo' }
    },
    result: { item: 'bamboo_block', count: 1 },
    category: 'BUILDING_BLOCKS'
  });
  
  // Bamboo Planks (1 bamboo block -> 4 bamboo planks)
  craftingManager.registerShapedRecipe({
    id: 'bamboo_planks_recipe',
    type: 'shaped',
    pattern: [
      ['bamboo_block']
    ],
    ingredients: {
      'bamboo_block': { type: 'bamboo_block' }
    },
    result: { item: 'bamboo_planks', count: 4 },
    category: 'BUILDING_BLOCKS'
  });
  
  // Bamboo Mosaic (4 bamboo slabs -> 4 bamboo mosaic)
  craftingManager.registerShapedRecipe({
    id: 'bamboo_mosaic_recipe',
    type: 'shaped',
    pattern: [
      ['bamboo_slab', 'bamboo_slab'],
      ['bamboo_slab', 'bamboo_slab']
    ],
    ingredients: {
      'bamboo_slab': { type: 'bamboo_slab' }
    },
    result: { item: 'bamboo_mosaic', count: 4 },
    category: 'BUILDING_BLOCKS'
  });
  
  // Bamboo Slab (3 bamboo planks -> 6 bamboo slabs)
  craftingManager.registerShapedRecipe({
    id: 'bamboo_slab_recipe',
    type: 'shaped',
    pattern: [
      ['bamboo_planks', 'bamboo_planks', 'bamboo_planks']
    ],
    ingredients: {
      'bamboo_planks': { type: 'bamboo_planks' }
    },
    result: { item: 'bamboo_slab', count: 6 },
    category: 'BUILDING_BLOCKS'
  });
  
  // Bamboo Mosaic Slab (3 bamboo mosaic -> 6 bamboo mosaic slabs)
  craftingManager.registerShapedRecipe({
    id: 'bamboo_mosaic_slab_recipe',
    type: 'shaped',
    pattern: [
      ['bamboo_mosaic', 'bamboo_mosaic', 'bamboo_mosaic']
    ],
    ingredients: {
      'bamboo_mosaic': { type: 'bamboo_mosaic' }
    },
    result: { item: 'bamboo_mosaic_slab', count: 6 },
    category: 'BUILDING_BLOCKS'
  });
  
  // Bamboo Stairs (6 bamboo planks -> 4 bamboo stairs)
  craftingManager.registerShapedRecipe({
    id: 'bamboo_stairs_recipe',
    type: 'shaped',
    pattern: [
      ['bamboo_planks', null, null],
      ['bamboo_planks', 'bamboo_planks', null],
      ['bamboo_planks', 'bamboo_planks', 'bamboo_planks']
    ],
    ingredients: {
      'bamboo_planks': { type: 'bamboo_planks' }
    },
    result: { item: 'bamboo_stairs', count: 4 },
    category: 'BUILDING_BLOCKS'
  });
  
  // Bamboo Mosaic Stairs (6 bamboo mosaic -> 4 bamboo mosaic stairs)
  craftingManager.registerShapedRecipe({
    id: 'bamboo_mosaic_stairs_recipe',
    type: 'shaped',
    pattern: [
      ['bamboo_mosaic', null, null],
      ['bamboo_mosaic', 'bamboo_mosaic', null],
      ['bamboo_mosaic', 'bamboo_mosaic', 'bamboo_mosaic']
    ],
    ingredients: {
      'bamboo_mosaic': { type: 'bamboo_mosaic' }
    },
    result: { item: 'bamboo_mosaic_stairs', count: 4 },
    category: 'BUILDING_BLOCKS'
  });
  
  // Bamboo Door (6 bamboo planks -> 3 bamboo doors)
  craftingManager.registerShapedRecipe({
    id: 'bamboo_door_recipe',
    type: 'shaped',
    pattern: [
      ['bamboo_planks', 'bamboo_planks'],
      ['bamboo_planks', 'bamboo_planks'],
      ['bamboo_planks', 'bamboo_planks']
    ],
    ingredients: {
      'bamboo_planks': { type: 'bamboo_planks' }
    },
    result: { item: 'bamboo_door', count: 3 },
    category: 'REDSTONE'
  });
  
  // Bamboo Trapdoor (6 bamboo planks -> 2 bamboo trapdoors)
  craftingManager.registerShapedRecipe({
    id: 'bamboo_trapdoor_recipe',
    type: 'shaped',
    pattern: [
      ['bamboo_planks', 'bamboo_planks', 'bamboo_planks'],
      ['bamboo_planks', 'bamboo_planks', 'bamboo_planks']
    ],
    ingredients: {
      'bamboo_planks': { type: 'bamboo_planks' }
    },
    result: { item: 'bamboo_trapdoor', count: 2 },
    category: 'REDSTONE'
  });
  
  // Bamboo Fence (4 bamboo planks + 2 sticks -> 3 bamboo fences)
  craftingManager.registerShapedRecipe({
    id: 'bamboo_fence_recipe',
    type: 'shaped',
    pattern: [
      ['bamboo_planks', 'stick', 'bamboo_planks'],
      ['bamboo_planks', 'stick', 'bamboo_planks']
    ],
    ingredients: {
      'bamboo_planks': { type: 'bamboo_planks' },
      'stick': { type: 'stick' }
    },
    result: { item: 'bamboo_fence', count: 3 },
    category: 'DECORATIONS'
  });
  
  // Bamboo Fence Gate (2 sticks + 4 bamboo planks -> 1 bamboo fence gate)
  craftingManager.registerShapedRecipe({
    id: 'bamboo_fence_gate_recipe',
    type: 'shaped',
    pattern: [
      ['stick', 'bamboo_planks', 'stick'],
      ['stick', 'bamboo_planks', 'stick']
    ],
    ingredients: {
      'bamboo_planks': { type: 'bamboo_planks' },
      'stick': { type: 'stick' }
    },
    result: { item: 'bamboo_fence_gate', count: 1 },
    category: 'REDSTONE'
  });
  
  // Bamboo Sign (6 bamboo planks + 1 stick -> 3 bamboo signs)
  craftingManager.registerShapedRecipe({
    id: 'bamboo_sign_recipe',
    type: 'shaped',
    pattern: [
      ['bamboo_planks', 'bamboo_planks', 'bamboo_planks'],
      ['bamboo_planks', 'bamboo_planks', 'bamboo_planks'],
      [null, 'stick', null]
    ],
    ingredients: {
      'bamboo_planks': { type: 'bamboo_planks' },
      'stick': { type: 'stick' }
    },
    result: { item: 'bamboo_sign', count: 3 },
    category: 'DECORATIONS'
  });
  
  // Bamboo Button (1 bamboo planks -> 1 bamboo button)
  craftingManager.registerShapedRecipe({
    id: 'bamboo_button_recipe',
    type: 'shaped',
    pattern: [
      ['bamboo_planks']
    ],
    ingredients: {
      'bamboo_planks': { type: 'bamboo_planks' }
    },
    result: { item: 'bamboo_button', count: 1 },
    category: 'REDSTONE'
  });
  
  // Bamboo Pressure Plate (2 bamboo planks -> 1 bamboo pressure plate)
  craftingManager.registerShapedRecipe({
    id: 'bamboo_pressure_plate_recipe',
    type: 'shaped',
    pattern: [
      ['bamboo_planks', 'bamboo_planks']
    ],
    ingredients: {
      'bamboo_planks': { type: 'bamboo_planks' }
    },
    result: { item: 'bamboo_pressure_plate', count: 1 },
    category: 'REDSTONE'
  });
  
  // Bamboo Raft (5 bamboo planks -> 1 bamboo raft)
  craftingManager.registerShapedRecipe({
    id: 'bamboo_raft_recipe',
    type: 'shaped',
    pattern: [
      ['bamboo_planks', null, 'bamboo_planks'],
      ['bamboo_planks', 'bamboo_planks', 'bamboo_planks']
    ],
    ingredients: {
      'bamboo_planks': { type: 'bamboo_planks' }
    },
    result: { item: 'bamboo_raft', count: 1 },
    category: 'TRANSPORTATION'
  });
  
  // Bamboo Chest Raft (1 bamboo raft + 1 chest -> 1 bamboo chest raft)
  craftingManager.registerShapelessRecipe({
    id: 'bamboo_chest_raft_recipe',
    type: 'shapeless',
    ingredients: [
      { id: 'bamboo_raft', count: 1 },
      { id: 'chest', count: 1 }
    ],
    result: { item: 'bamboo_chest_raft', count: 1 },
    category: 'TRANSPORTATION'
  });
}

module.exports = { registerBambooRecipes }; 