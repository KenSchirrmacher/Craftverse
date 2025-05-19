const assert = require('assert');
const { Inventory } = require('../inventory/inventory');

describe('Inventory', () => {
  let inventory;

  beforeEach(() => {
    inventory = new Inventory(36); // Standard player inventory size
  });

  describe('Basic Operations', () => {
    it('should initialize with correct size', () => {
      assert.strictEqual(inventory.getSize(), 36);
    });

    it('should start empty', () => {
      assert.strictEqual(inventory.isEmpty(), true);
    });

    it('should not be full initially', () => {
      assert.strictEqual(inventory.isFull(), false);
    });
  });

  describe('Item Management', () => {
    const testItem = { id: 'test_item', count: 1, maxStackSize: 64 };

    it('should add item to empty slot', () => {
      assert.strictEqual(inventory.addItem(testItem), true);
      assert.deepStrictEqual(inventory.getItem(0), testItem);
    });

    it('should stack items up to maxStackSize', () => {
      const item1 = { ...testItem, count: 32 };
      const item2 = { ...testItem, count: 32 };
      
      inventory.addItem(item1);
      inventory.addItem(item2);
      
      const slot = inventory.getItem(0);
      assert.strictEqual(slot.count, 64);
    });

    it('should not stack beyond maxStackSize', () => {
      const item1 = { ...testItem, count: 64 };
      const item2 = { ...testItem, count: 1 };
      
      inventory.addItem(item1);
      inventory.addItem(item2);
      
      assert.strictEqual(inventory.getItem(0).count, 64);
      assert.deepStrictEqual(inventory.getItem(1), item2);
    });

    it('should remove items correctly', () => {
      inventory.addItem(testItem);
      const removed = inventory.removeItem(0);
      assert.deepStrictEqual(removed, testItem);
      assert.strictEqual(inventory.isEmpty(), true);
    });

    it('should remove partial stacks', () => {
      const item = { ...testItem, count: 10 };
      inventory.addItem(item);
      const removed = inventory.removeItem(0, 3);
      assert.strictEqual(removed.count, 3);
      assert.strictEqual(inventory.getItem(0).count, 7);
    });
  });

  describe('Selected Slot', () => {
    it('should start with slot 0 selected', () => {
      assert.strictEqual(inventory.getSelectedSlot(), 0);
    });

    it('should change selected slot', () => {
      inventory.setSelectedSlot(5);
      assert.strictEqual(inventory.getSelectedSlot(), 5);
    });

    it('should not select invalid slots', () => {
      inventory.setSelectedSlot(100);
      assert.strictEqual(inventory.getSelectedSlot(), 0);
    });

    it('should get selected item', () => {
      const testItem = { id: 'test_item', count: 1 };
      inventory.addItem(testItem);
      assert.deepStrictEqual(inventory.getSelectedItem(), testItem);
    });
  });

  describe('Item Queries', () => {
    const testItem = { id: 'test_item', count: 5, maxStackSize: 64 };

    it('should check for item presence', () => {
      inventory.addItem(testItem);
      assert.strictEqual(inventory.hasItem('test_item'), true);
      assert.strictEqual(inventory.hasItem('nonexistent'), false);
    });

    it('should count total items', () => {
      inventory.addItem({ ...testItem, count: 3 });
      inventory.addItem({ ...testItem, count: 2 });
      assert.strictEqual(inventory.countItem('test_item'), 5);
    });

    it('should find first empty slot', () => {
      inventory.addItem(testItem);
      assert.strictEqual(inventory.getFirstEmptySlot(), 1);
    });
  });

  describe('Serialization', () => {
    it('should serialize inventory state', () => {
      const testItem = { id: 'test_item', count: 1 };
      inventory.addItem(testItem);
      inventory.setSelectedSlot(5);

      const serialized = inventory.serialize();
      assert.strictEqual(serialized.size, 36);
      assert.deepStrictEqual(serialized.slots[0], testItem);
      assert.strictEqual(serialized.selectedSlot, 5);
    });

    it('should deserialize inventory state', () => {
      const data = {
        size: 36,
        slots: [
          { id: 'test_item', count: 1 },
          null
        ],
        selectedSlot: 5
      };

      inventory.deserialize(data);
      assert.strictEqual(inventory.getSize(), 36);
      assert.deepStrictEqual(inventory.getItem(0), data.slots[0]);
      assert.strictEqual(inventory.getSelectedSlot(), 5);
    });
  });

  describe('Event Emission', () => {
    it('should emit itemChanged event when adding items', (done) => {
      const testItem = { id: 'test_item', count: 1 };
      
      inventory.on('itemChanged', ({ slot, item }) => {
        assert.strictEqual(slot, 0);
        assert.deepStrictEqual(item, testItem);
        done();
      });

      inventory.addItem(testItem);
    });

    it('should emit selectedSlotChanged event', (done) => {
      inventory.on('selectedSlotChanged', ({ slot }) => {
        assert.strictEqual(slot, 5);
        done();
      });

      inventory.setSelectedSlot(5);
    });

    it('should emit inventoryCleared event', (done) => {
      inventory.on('inventoryCleared', () => {
        assert.strictEqual(inventory.isEmpty(), true);
        done();
      });

      inventory.clear();
    });
  });
}); 