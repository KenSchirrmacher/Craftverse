/**
 * Chiseled Bookshelf Test Suite
 * Tests the implementation of the Chiseled Bookshelf block and item
 * Part of the Trails & Tales Update
 */

const assert = require('assert');
const ChiseledBookshelfBlock = require('../blocks/chiseledBookshelfBlock');
const ChiseledBookshelfItem = require('../items/chiseledBookshelfItem');

// Mock classes for testing
class MockWorld {
  constructor() {
    this.blocks = {};
    this.sounds = [];
    this.redstoneSignals = {};
  }
  
  setBlock(x, y, z, block) {
    const key = `${x},${y},${z}`;
    this.blocks[key] = block;
    return true;
  }
  
  getBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks[key] || null;
  }
  
  playSound(position, sound, volume, pitch) {
    this.sounds.push({ position, sound, volume, pitch });
    return true;
  }
  
  updateRedstoneSignal(position, strength) {
    const key = `${position.x},${position.y},${position.z}`;
    this.redstoneSignals[key] = strength;
  }
}

class MockPlayer {
  constructor(id = 'player1') {
    this.id = id;
    this.inventory = [];
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { yaw: 0, pitch: 0 };
    this.world = new MockWorld();
    this.sneaking = false;
  }
  
  giveItem(item) {
    if (item) {
      this.inventory.push(item);
      return true;
    }
    return false;
  }
}

/**
 * Main test function
 */
function runChiseledBookshelfTests() {
  console.log('Running Chiseled Bookshelf Tests...');
  
  testChiseledBookshelfBlock();
  testChiseledBookshelfItem();
  testBookStorage();
  testRedstoneSignal();
  testSerialization();
  
  console.log('All Chiseled Bookshelf Tests Passed!');
}

/**
 * Test basic properties of the ChiseledBookshelfBlock
 */
function testChiseledBookshelfBlock() {
  console.log('Testing Chiseled Bookshelf Block properties...');
  
  const bookshelf = new ChiseledBookshelfBlock();
  
  // Test basic properties
  assert.strictEqual(bookshelf.type, 'chiseled_bookshelf', 'Block type should be chiseled_bookshelf');
  assert.strictEqual(bookshelf.displayName, 'Chiseled Bookshelf', 'Display name should be Chiseled Bookshelf');
  assert.strictEqual(bookshelf.toolType, 'axe', 'Tool type should be axe');
  assert.strictEqual(bookshelf.hardness, 1.5, 'Hardness should be 1.5');
  
  // Test inventory setup
  assert.strictEqual(bookshelf.inventory.slots, 6, 'Bookshelf should have 6 slots');
  assert.strictEqual(bookshelf.inventory.items.length, 6, 'Bookshelf should have 6 item slots');
  assert.strictEqual(bookshelf.filledSlots.length, 6, 'Bookshelf should track 6 filled slots');
  
  // Test all slots are initially empty
  for (let i = 0; i < 6; i++) {
    assert.strictEqual(bookshelf.inventory.items[i], null, `Slot ${i} should be empty`);
    assert.strictEqual(bookshelf.filledSlots[i], false, `Filled slot ${i} should be false`);
  }
  
  console.log('Chiseled Bookshelf Block properties tests passed!');
}

/**
 * Test the ChiseledBookshelfItem
 */
function testChiseledBookshelfItem() {
  console.log('Testing Chiseled Bookshelf Item...');
  
  const bookshelfItem = new ChiseledBookshelfItem();
  
  // Test basic properties
  assert.strictEqual(bookshelfItem.type, 'chiseled_bookshelf', 'Item type should be chiseled_bookshelf');
  assert.strictEqual(bookshelfItem.displayName, 'Chiseled Bookshelf', 'Display name should be Chiseled Bookshelf');
  assert.strictEqual(bookshelfItem.stackable, true, 'Item should be stackable');
  assert.strictEqual(bookshelfItem.placeable, true, 'Item should be placeable');
  
  // Test item placement
  const world = new MockWorld();
  const player = new MockPlayer();
  player.rotation.yaw = 45; // Looking east
  
  const position = { x: 5, y: 5, z: 5 };
  const result = bookshelfItem.place(world, position, player);
  
  assert.strictEqual(result, true, 'Placement should succeed');
  
  // Check that the block was placed with correct rotation
  const placedBlock = world.getBlock(5, 5, 5);
  assert.strictEqual(placedBlock.type, 'chiseled_bookshelf', 'Placed block should be a chiseled bookshelf');
  assert.strictEqual(placedBlock.rotationY, 270, 'Block should be rotated to face east');
  
  console.log('Chiseled Bookshelf Item tests passed!');
}

/**
 * Test book storage functionality
 */
function testBookStorage() {
  console.log('Testing book storage functionality...');
  
  const bookshelf = new ChiseledBookshelfBlock();
  const player = new MockPlayer();
  
  // Test invalid book type
  const nonBookItem = { type: 'stone', count: 1 };
  assert.strictEqual(bookshelf.isValidBookItem(nonBookItem), false, 'Stone should not be a valid book type');
  
  // Test valid book types
  const validBookTypes = ['book', 'enchanted_book', 'written_book', 'writable_book'];
  for (const bookType of validBookTypes) {
    const bookItem = { type: bookType, count: 1 };
    assert.strictEqual(bookshelf.isValidBookItem(bookItem), true, `${bookType} should be a valid book type`);
  }
  
  // Test storing a book
  const book = { type: 'book', count: 1 };
  const hitData = { position: { x: 0.95, y: 0.75, z: 0.95 } }; // Hit top-right slot
  
  const storeResult = bookshelf.interact(player, book, hitData);
  assert.strictEqual(storeResult.success, true, 'Book storage should succeed');
  assert.strictEqual(storeResult.itemInHand, null, 'Item in hand should be consumed');
  assert.strictEqual(bookshelf.filledSlots[0], true, 'Slot 0 should be filled');
  assert.deepStrictEqual(bookshelf.inventory.items[0], { type: 'book', count: 1 }, 'Slot 0 should contain the book');
  
  // Test retrieving a book
  const retrieveResult = bookshelf.interact(player, null, hitData);
  assert.strictEqual(retrieveResult, true, 'Book retrieval should succeed');
  assert.strictEqual(bookshelf.filledSlots[0], false, 'Slot 0 should be empty again');
  assert.strictEqual(bookshelf.inventory.items[0], null, 'Slot 0 should not contain any item');
  assert.strictEqual(player.inventory.length, 1, 'Player should have 1 item in inventory');
  assert.strictEqual(player.inventory[0].type, 'book', 'Player should have the book in inventory');
  
  // Test storing multiple books
  const hitPositions = [
    { position: { x: 0.95, y: 0.75, z: 0.95 } }, // Top-right
    { position: { x: 0.5, y: 0.75, z: 0.95 } },  // Top-middle
    { position: { x: 0.1, y: 0.75, z: 0.95 } },  // Top-left
    { position: { x: 0.95, y: 0.25, z: 0.95 } }, // Bottom-right
    { position: { x: 0.5, y: 0.25, z: 0.95 } },  // Bottom-middle
    { position: { x: 0.1, y: 0.25, z: 0.95 } }   // Bottom-left
  ];
  
  // Store books in all slots
  for (let i = 0; i < 6; i++) {
    const book = { type: 'book', count: 1 };
    bookshelf.interact(player, book, hitPositions[i]);
  }
  
  // Verify all slots are filled
  for (let i = 0; i < 6; i++) {
    assert.strictEqual(bookshelf.filledSlots[i], true, `Slot ${i} should be filled`);
    assert.notStrictEqual(bookshelf.inventory.items[i], null, `Slot ${i} should contain an item`);
  }
  
  // Test that dropping the block drops all books
  const drops = bookshelf.getDrops();
  assert.strictEqual(drops.length, 7, 'Should drop bookshelf and 6 books');
  assert.strictEqual(drops.filter(item => item.type === 'book').length, 6, 'Should drop 6 books');
  
  console.log('Book storage functionality tests passed!');
}

/**
 * Test redstone signal output
 */
function testRedstoneSignal() {
  console.log('Testing redstone signal output...');
  
  const bookshelf = new ChiseledBookshelfBlock();
  bookshelf.world = new MockWorld();
  bookshelf.position = { x: 5, y: 5, z: 5 };
  
  // Test signal strength with no books
  assert.strictEqual(bookshelf.getRedstoneSignal(), 0, 'Empty bookshelf should have 0 signal strength');
  
  // Fill slots one by one and check signal strength
  for (let i = 0; i < 6; i++) {
    bookshelf.filledSlots[i] = true;
    bookshelf.emitRedstoneSignal();
    
    const expectedSignal = i + 1;
    assert.strictEqual(bookshelf.getRedstoneSignal(), expectedSignal, 
      `Bookshelf with ${i + 1} books should have signal strength ${expectedSignal}`);
    
    const worldSignal = bookshelf.world.redstoneSignals['5,5,5'];
    assert.strictEqual(worldSignal, expectedSignal, 
      `World should receive signal strength ${expectedSignal}`);
  }
  
  console.log('Redstone signal output tests passed!');
}

/**
 * Test serialization and deserialization
 */
function testSerialization() {
  console.log('Testing serialization and deserialization...');
  
  const bookshelf = new ChiseledBookshelfBlock({
    rotationY: 90,
    inventory: {
      slots: 6,
      items: [
        { type: 'book', count: 1 },
        null,
        { type: 'enchanted_book', count: 1 },
        null,
        { type: 'written_book', count: 1 },
        null
      ]
    },
    filledSlots: [true, false, true, false, true, false]
  });
  
  // Serialize the bookshelf
  const serialized = bookshelf.serialize();
  
  // Deserialize to a new instance
  const deserialized = ChiseledBookshelfBlock.deserialize(serialized);
  
  // Verify properties
  assert.strictEqual(deserialized.type, 'chiseled_bookshelf', 'Type should be preserved');
  assert.strictEqual(deserialized.rotationY, 90, 'Rotation should be preserved');
  assert.strictEqual(deserialized.inventory.slots, 6, 'Inventory slots should be preserved');
  
  // Verify filled slots
  for (let i = 0; i < 6; i++) {
    assert.strictEqual(deserialized.filledSlots[i], bookshelf.filledSlots[i], 
      `Filled slot ${i} should be preserved`);
  }
  
  // Verify book contents
  assert.strictEqual(deserialized.inventory.items[0].type, 'book', 'Book type should be preserved');
  assert.strictEqual(deserialized.inventory.items[2].type, 'enchanted_book', 'Enchanted book type should be preserved');
  assert.strictEqual(deserialized.inventory.items[4].type, 'written_book', 'Written book type should be preserved');
  
  console.log('Serialization tests passed!');
}

// Export the test runner
module.exports = runChiseledBookshelfTests;

// Run tests if this file is executed directly
if (require.main === module) {
  runChiseledBookshelfTests();
} 