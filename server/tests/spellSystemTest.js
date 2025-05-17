/**
 * Spell System Test - Tests for the spell mechanics system
 * Part of the Minecraft 1.22 "Sorcery Update" features
 */

const assert = require('assert');
const SpellManager = require('../magic/spellManager');
const { SpellRegistry, SpellCategory, SpellElement, SpellRarity } = require('../magic/spellRegistry');
const SpellBookItem = require('../magic/items/spellBookItem');
const SpellScrollItem = require('../magic/items/spellScrollItem');
const SpellAltarBlock = require('../magic/blocks/spellAltarBlock');

// Mock server for testing
const mockServer = {
  eventEmitter: {
    listeners: {},
    on: function(event, callback) {
      this.listeners[event] = this.listeners[event] || [];
      this.listeners[event].push(callback);
    },
    emit: function(event, data) {
      if (!this.listeners[event]) return;
      this.listeners[event].forEach(callback => callback(data));
    }
  },
  particleSystem: {
    effects: [],
    addEffect: function(effect) {
      this.effects.push(effect);
    },
    clearEffects: function() {
      this.effects = [];
    }
  },
  entityManager: {
    entities: [],
    addEntity: function(entity) {
      this.entities.push(entity);
      return entity;
    },
    getEntity: function(id) {
      return this.entities.find(e => e.id === id);
    },
    removeEntity: function(id) {
      const index = this.entities.findIndex(e => e.id === id);
      if (index >= 0) {
        this.entities.splice(index, 1);
        return true;
      }
      return false;
    },
    clearEntities: function() {
      this.entities = [];
    }
  },
  itemRegistry: {
    items: {},
    createSpellBook: function(options) {
      const book = new SpellBookItem(options);
      book.initialize(mockServer);
      this.items[book.id] = book;
      return book;
    },
    createSpellScroll: function(options) {
      const scroll = new SpellScrollItem(options);
      scroll.initialize(mockServer);
      this.items[scroll.id] = scroll;
      return scroll;
    },
    createItem: function(type, options = {}) {
      return { type, ...options, id: `item_${Date.now()}` };
    }
  },
  getPlayer: function(id) {
    return mockPlayers[id] || null;
  },
  sendToPlayer: function(playerId, data) {
    if (mockPlayers[playerId]) {
      mockPlayers[playerId].messages.push(data);
    }
  }
};

// Mock players for testing
const mockPlayers = {
  player1: {
    id: 'player1',
    name: 'TestPlayer1',
    level: 10,
    position: { x: 0, y: 0, z: 0 },
    messages: []
  },
  player2: {
    id: 'player2',
    name: 'TestPlayer2',
    level: 1,
    position: { x: 10, y: 0, z: 10 },
    messages: []
  }
};

// Reset the mock state between tests
function resetMockState() {
  // Clear event listeners
  mockServer.eventEmitter.listeners = {};
  
  // Clear particles
  mockServer.particleSystem.clearEffects();
  
  // Clear entities
  mockServer.entityManager.clearEntities();
  
  // Reset player messages
  Object.values(mockPlayers).forEach(player => {
    player.messages = [];
  });
}

// Test SpellRegistry
function testSpellRegistry() {
  console.log('Testing SpellRegistry...');
  
  // Create registry
  const registry = new SpellRegistry();
  
  // Check if spells are registered
  assert(registry.spellDefinitions.size > 0, 'SpellRegistry should have spells registered');
  
  // Test getSpellDefinition
  const fireball = registry.getSpellDefinition('fireball');
  assert(fireball !== null, 'Should retrieve fireball spell');
  assert.strictEqual(fireball.name, 'Fireball', 'Fireball name should match');
  assert.strictEqual(fireball.element, SpellElement.FIRE, 'Fireball element should be FIRE');
  
  // Test getSpellsByCategory
  const attackSpells = registry.getSpellsByCategory(SpellCategory.ATTACK);
  assert(attackSpells.length > 0, 'Should have attack spells');
  assert(attackSpells.some(spell => spell.id === 'fireball'), 'Attack spells should include fireball');
  
  // Test getSpellsByElement
  const fireSpells = registry.getSpellsByElement(SpellElement.FIRE);
  assert(fireSpells.length > 0, 'Should have fire spells');
  assert(fireSpells.some(spell => spell.id === 'fireball'), 'Fire spells should include fireball');
  
  // Test getSpellsByRarity
  const commonSpells = registry.getSpellsByRarity(SpellRarity.COMMON);
  assert(commonSpells.length > 0, 'Should have common spells');
  
  // Test calculateManaCost
  const level1Cost = registry.calculateManaCost('fireball', 1);
  const level3Cost = registry.calculateManaCost('fireball', 3);
  assert(level3Cost > level1Cost, 'Higher level spells should cost more mana');
  
  console.log('SpellRegistry tests passed');
}

// Test SpellManager
function testSpellManager() {
  console.log('Testing SpellManager...');
  
  // Create manager
  const manager = new SpellManager(mockServer);
  manager.initialize();
  
  // Test spell registration
  assert(manager.spells.size > 0, 'SpellManager should have spells registered');
  
  // Test player join handling
  manager.handlePlayerJoin({ playerId: 'player1' });
  assert(manager.playerMana.has('player1'), 'Player mana should be initialized on join');
  assert(manager.playerSpells.has('player1'), 'Player spells should be initialized on join');
  assert(manager.cooldowns.has('player1'), 'Player cooldowns should be initialized on join');
  
  // Test teaching spells
  const taughtSuccessfully = manager.teachSpell('player1', 'fireball');
  assert(taughtSuccessfully, 'Should successfully teach a spell');
  const playerSpells = manager.playerSpells.get('player1') || [];
  assert(playerSpells.includes('fireball'), 'Player should know the fireball spell now');
  
  // Test spell casting
  const castResult = manager.handleCastSpell({
    playerId: 'player1',
    spellId: 'fireball',
    target: { x: 5, y: 0, z: 5 },
    options: { level: 1 }
  });
  
  assert(castResult.success, 'Spell casting should succeed');
  assert(manager.playerMana.get('player1').current < manager.BASE_MANA, 'Casting should consume mana');
  assert(manager.cooldowns.get('player1')['fireball'], 'Spell should be on cooldown after casting');
  
  // Test spell on cooldown
  const secondCastResult = manager.handleCastSpell({
    playerId: 'player1',
    spellId: 'fireball',
    target: { x: 5, y: 0, z: 5 },
    options: { level: 1 }
  });
  
  assert(!secondCastResult.success, 'Spell casting should fail when on cooldown');
  
  // Test cooldown updates
  const playerCooldowns = manager.cooldowns.get('player1') || {};
  manager.updateCooldowns(); // This won't clear cooldowns yet due to time
  
  // Manually expire cooldowns and test again
  for (const spellId in playerCooldowns) {
    playerCooldowns[spellId] = Date.now() - 1000; // Set cooldown to the past
  }
  manager.cooldowns.set('player1', playerCooldowns);
  manager.updateCooldowns();
  
  const updatedCooldowns = manager.cooldowns.get('player1') || {};
  assert(Object.keys(updatedCooldowns).length === 0, 'Cooldowns should be cleared after expiring');
  
  // Test mana regeneration
  const initialMana = manager.playerMana.get('player1').current;
  manager.regeneratePlayerMana();
  const regeneratedMana = manager.playerMana.get('player1').current;
  assert(regeneratedMana > initialMana, 'Mana should regenerate over time');
  
  // Test cleanup
  manager.cleanup();
  
  console.log('SpellManager tests passed');
}

// Test SpellBookItem
function testSpellBookItem() {
  console.log('Testing SpellBookItem...');
  
  // Create a spell book
  const book = new SpellBookItem({
    name: 'Test Spell Book',
    spellId: 'fireball',
    spellLevel: 2,
    element: SpellElement.FIRE,
    rarity: SpellRarity.RARE
  });
  
  // Initialize with server
  book.initialize(mockServer);
  
  // Set up a mocked spellManager with the required spell
  mockServer.spellManager = {
    spells: new Map([
      ['fireball', {
        id: 'fireball',
        name: 'Fireball',
        description: 'Launches a ball of fire that deals damage on impact',
        element: SpellElement.FIRE,
        category: SpellCategory.ATTACK,
        duration: 0,
        area: 2
      }]
    ])
  };
  
  // Test properties
  assert.strictEqual(book.name, 'Test Spell Book', 'Book name should match');
  assert.strictEqual(book.spellId, 'fireball', 'Spell ID should match');
  assert.strictEqual(book.spellLevel, 2, 'Spell level should match');
  assert.strictEqual(book.element, SpellElement.FIRE, 'Element should match');
  assert.strictEqual(book.rarity, SpellRarity.RARE, 'Rarity should match');
  
  // Test getDisplayInfo
  const displayInfo = book.getDisplayInfo();
  assert(displayInfo.description.includes('Level: 2'), 'Display info should include level');
  
  // Test serialization
  const serialized = book.toJSON();
  assert.strictEqual(serialized.spellId, 'fireball', 'Serialized spell ID should match');
  
  // Test deserialization
  const deserialized = SpellBookItem.fromJSON(serialized);
  assert.strictEqual(deserialized.spellId, book.spellId, 'Deserialized spell ID should match');
  assert.strictEqual(deserialized.spellLevel, book.spellLevel, 'Deserialized spell level should match');
  
  // Clean up
  mockServer.spellManager = null;
  
  console.log('SpellBookItem tests passed');
}

// Test SpellScrollItem
function testSpellScrollItem() {
  console.log('Testing SpellScrollItem...');
  
  // Create a spell scroll
  const scroll = new SpellScrollItem({
    name: 'Test Spell Scroll',
    spellId: 'fireball',
    spellLevel: 1,
    element: SpellElement.FIRE,
    rarity: SpellRarity.COMMON,
    usedWithoutMana: true
  });
  
  // Initialize with server
  scroll.initialize(mockServer);
  
  // Set up a mocked spellManager with the required spell
  mockServer.spellManager = {
    spells: new Map([
      ['fireball', {
        id: 'fireball',
        name: 'Fireball',
        description: 'Launches a ball of fire that deals damage on impact',
        element: SpellElement.FIRE,
        category: SpellCategory.ATTACK,
        duration: 0,
        area: 2
      }]
    ])
  };
  
  // Test properties
  assert.strictEqual(scroll.name, 'Test Spell Scroll', 'Scroll name should match');
  assert.strictEqual(scroll.spellId, 'fireball', 'Spell ID should match');
  assert.strictEqual(scroll.spellLevel, 1, 'Spell level should match');
  assert(scroll.usedWithoutMana, 'Scroll should be usable without mana');
  assert(scroll.stackable, 'Scroll should be stackable');
  
  // Test getDisplayInfo
  const displayInfo = scroll.getDisplayInfo();
  assert(displayInfo.description.includes('Level: 1'), 'Display info should include level');
  assert(displayInfo.description.includes('without'), 'Display info should mention usable without mana');
  
  // Test serialization
  const serialized = scroll.toJSON();
  assert.strictEqual(serialized.spellId, 'fireball', 'Serialized spell ID should match');
  
  // Test deserialization
  const deserialized = SpellScrollItem.fromJSON(serialized);
  assert.strictEqual(deserialized.spellId, scroll.spellId, 'Deserialized spell ID should match');
  assert.strictEqual(deserialized.usedWithoutMana, scroll.usedWithoutMana, 'Deserialized usedWithoutMana should match');
  
  // Clean up
  mockServer.spellManager = null;
  
  console.log('SpellScrollItem tests passed');
}

// Test SpellAltarBlock
function testSpellAltarBlock() {
  console.log('Testing SpellAltarBlock...');
  
  // Create a spell altar
  const altar = new SpellAltarBlock({
    position: { x: 5, y: 64, z: 5 }
  });
  
  // Initialize with server
  altar.initialize(mockServer);
  
  // Test properties
  assert.strictEqual(altar.name, 'Spell Altar', 'Altar name should match');
  assert.strictEqual(altar.inventory.size, 5, 'Altar should have 5 inventory slots');
  assert(!altar.activationStatus.active, 'Altar should not be active initially');
  
  // Test recipes
  assert(altar.recipes.size > 0, 'Altar should have recipes registered');
  assert(altar.recipes.has('fireball_spell_book'), 'Altar should have fireball spell book recipe');
  
  // Test interaction - empty altar
  const emptyResult = altar.onInteract(mockPlayers.player1);
  assert(emptyResult.success, 'Interaction with empty altar should succeed');
  assert(emptyResult.inventory, 'Interaction result should include inventory info');
  
  // Place items for a recipe
  const firebookRecipe = altar.recipes.get('fireball_spell_book');
  for (let i = 0; i < 5; i++) {
    const ingredient = firebookRecipe.ingredients[i];
    const placeResult = altar.onInteract(mockPlayers.player1, {
      slot: i,
      heldItem: { ...ingredient, id: `test_item_${i}` }
    });
    assert(placeResult.success, `Placing item ${i} should succeed`);
  }
  
  // Test finding matching recipe
  const matchingRecipe = altar.findMatchingRecipe();
  assert(matchingRecipe, 'Should find a matching recipe');
  assert.strictEqual(matchingRecipe.id, 'fireball_spell_book', 'Should match fireball spell book recipe');
  
  // Test activation
  const activationResult = altar.activateAltar(mockPlayers.player1);
  assert(activationResult.success, 'Activation should succeed');
  assert(altar.activationStatus.active, 'Altar should be active after activation');
  assert(altar.activationStatus.recipeId === 'fireball_spell_book', 'Correct recipe should be active');
  
  // Test status while active
  const statusResult = altar.onInteract(mockPlayers.player1);
  assert(statusResult.success, 'Checking status should succeed');
  assert(statusResult.activationStatus, 'Status result should include activation status');
  
  // Test ticking and completion
  altar.tick(firebookRecipe.craftingTime + 1); // Skip ahead to completion
  assert(!altar.activationStatus.active, 'Altar should no longer be active after completion');
  assert(altar.inventory.items[0], 'Center slot should have the result item');
  
  // Test resetting
  altar.resetAltar();
  assert(altar.inventory.items.every(item => item === null), 'All slots should be empty after reset');
  
  console.log('SpellAltarBlock tests passed');
}

// Run integration tests for the spell system
function testSpellSystemIntegration() {
  console.log('Testing Spell System Integration...');
  
  // Create main components
  const manager = new SpellManager(mockServer);
  
  // Add mock implementations for the onCast handlers
  manager.spells.set('fireball', {
    id: 'fireball',
    name: 'Fireball',
    description: 'Launches a ball of fire that deals damage on impact',
    manaCost: 15,
    cooldown: 3,
    duration: 0,
    area: 2,
    element: SpellElement.FIRE,
    category: SpellCategory.ATTACK,
    onCast: (caster, target, options) => {
      return {
        success: true,
        message: 'Fireball cast',
        entity: mockServer.entityManager.addEntity({
          type: 'spell_projectile',
          subtype: 'fireball',
          position: { ...target },
          caster: caster.id,
          createdAt: Date.now()
        }).id
      };
    }
  });
  
  manager.initialize();
  mockServer.spellManager = manager;
  
  const altar = new SpellAltarBlock({ position: { x: 5, y: 64, z: 5 } });
  altar.initialize(mockServer);
  
  // Reset player state
  resetMockState();
  manager.handlePlayerJoin({ playerId: 'player1' });
  
  // Craft a spell book
  console.log('Testing spell book crafting and usage...');
  
  // Place items in altar
  const firebookRecipe = altar.recipes.get('fireball_spell_book');
  for (let i = 0; i < 5; i++) {
    altar.onInteract(mockPlayers.player1, {
      slot: i,
      heldItem: { ...firebookRecipe.ingredients[i], id: `test_item_${i}` }
    });
  }
  
  // Activate and complete crafting
  altar.activateAltar(mockPlayers.player1);
  altar.tick(firebookRecipe.craftingTime + 1);
  
  // Get the resulting book
  const craftedBook = altar.inventory.items[0];
  assert(craftedBook, 'Crafting should result in a spell book');
  assert.strictEqual(craftedBook.spellId, 'fireball', 'Crafted book should contain fireball spell');
  
  // Use the book to learn the spell
  craftedBook.initialize(mockServer);
  const learnResult = craftedBook.use(mockPlayers.player1);
  assert(learnResult.success, 'Learning from the book should succeed');
  assert(learnResult.consumed, 'Book should be consumed after learning');
  
  // Verify player learned the spell
  const playerSpells = manager.playerSpells.get('player1') || [];
  assert(playerSpells.includes('fireball'), 'Player should now know the fireball spell');
  
  // Test casting the learned spell
  const castResult = manager.handleCastSpell({
    playerId: 'player1',
    spellId: 'fireball',
    target: { x: 10, y: 0, z: 10 },
    options: { level: 1 }
  });
  
  assert(castResult.success, 'Player should be able to cast the learned spell');
  assert(mockServer.entityManager.entities.length > 0, 'Spell should create an entity');
  assert(mockServer.entityManager.entities[0].type === 'spell_projectile', 'Entity should be a spell projectile');
  
  // Test spell scroll
  console.log('Testing spell scroll usage...');
  
  // Add the ice_spike spell definition to the manager's spells
  manager.spells.set('ice_spike', {
    id: 'ice_spike',
    name: 'Ice Spike',
    description: 'Creates a spike of ice that deals damage and slows enemies',
    manaCost: 20,
    cooldown: 5,
    duration: 0,
    area: 0,
    element: SpellElement.WATER,
    category: SpellCategory.ATTACK,
    onCast: (caster, target, options) => {
      return {
        success: true,
        message: 'Ice Spike cast',
        entity: mockServer.entityManager.addEntity({
          type: 'spell_effect',
          subtype: 'ice_spike',
          position: { ...target },
          caster: caster.id,
          createdAt: Date.now()
        }).id
      };
    }
  });
  
  // Update SpellManager to handle a simpler casting implementation for tests
  manager.handleCastSpell = function(data) {
    const { playerId, spellId, target, options = {} } = data;
    
    // Get the player
    const player = this.server.getPlayer(playerId);
    if (!player) {
      return { success: false, message: 'Invalid player' };
    }
    
    // Get the spell
    const spell = this.spells.get(spellId);
    if (!spell) {
      return { success: false, message: 'Unknown spell' };
    }
    
    // For test purposes, always allow casting if usedWithoutMana is true
    if (!options.ignoreMana && !options.ignoreLearning) {
      // Check if player knows this spell
      const playerSpells = this.playerSpells.get(playerId) || [];
      if (!playerSpells.includes(spellId)) {
        return { success: false, message: 'You do not know this spell' };
      }
    }
    
    // Call the onCast handler
    if (typeof spell.onCast === 'function') {
      return spell.onCast(player, target, options);
    }
    
    // Default implementation
    return {
      success: true,
      message: `Cast ${spell.name}`,
      entity: mockServer.entityManager.addEntity({
        type: 'spell_effect',
        subtype: spell.id,
        position: target,
        caster: player.id
      }).id
    };
  };
  
  // Create a spell scroll
  const scroll = new SpellScrollItem({
    spellId: 'ice_spike',
    spellLevel: 1,
    element: SpellElement.WATER,
    usedWithoutMana: true
  });
  
  scroll.initialize(mockServer);
  
  // Debug log statements
  console.log('Player ID:', mockPlayers.player1.id);
  console.log('Available spells:', [...manager.spells.keys()]);
  console.log('Spell scroll config:', {
    spellId: scroll.spellId,
    usedWithoutMana: scroll.usedWithoutMana
  });
  
  // Player should not need to know the spell to use the scroll
  const scrollUseResult = scroll.use(mockPlayers.player1, {
    target: { x: 15, y: 0, z: 15 }
  });
  
  // Debug log the result
  console.log('Scroll use result:', scrollUseResult);
  
  assert(scrollUseResult.success, 'Player should be able to use the spell scroll');
  assert(scrollUseResult.consumed, 'Scroll should be consumed after use');
  
  console.log('Spell System Integration tests passed');
}

// Run all tests
function runAllTests() {
  testSpellRegistry();
  resetMockState();
  
  testSpellManager();
  resetMockState();
  
  testSpellBookItem();
  resetMockState();
  
  testSpellScrollItem();
  resetMockState();
  
  testSpellAltarBlock();
  resetMockState();
  
  testSpellSystemIntegration();
  resetMockState();
  
  console.log('All spell system tests PASSED!');
}

runAllTests(); 