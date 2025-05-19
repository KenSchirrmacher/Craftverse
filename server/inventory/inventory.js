const EventEmitter = require('events');

class Inventory extends EventEmitter {
  constructor(size) {
    super();
    this.size = size;
    this.slots = new Array(size).fill(null);
    this.selectedSlot = 0;
  }

  getSize() {
    return this.size;
  }

  getItem(slot) {
    if (slot < 0 || slot >= this.size) {
      return null;
    }
    return this.slots[slot];
  }

  setItem(slot, item) {
    if (slot < 0 || slot >= this.size) {
      return false;
    }
    this.slots[slot] = item;
    this.emit('itemChanged', { slot, item });
    return true;
  }

  addItem(item) {
    // First try to stack with existing items
    for (let i = 0; i < this.size; i++) {
      const existingItem = this.slots[i];
      if (existingItem && existingItem.id === item.id && existingItem.count < existingItem.maxStackSize) {
        const spaceLeft = existingItem.maxStackSize - existingItem.count;
        const amountToAdd = Math.min(spaceLeft, item.count);
        existingItem.count += amountToAdd;
        item.count -= amountToAdd;
        this.emit('itemChanged', { slot: i, item: existingItem });
        if (item.count === 0) {
          return true;
        }
      }
    }

    // Then try to find empty slots
    for (let i = 0; i < this.size; i++) {
      if (!this.slots[i]) {
        this.slots[i] = item;
        this.emit('itemChanged', { slot: i, item });
        return true;
      }
    }

    return false; // Inventory is full
  }

  removeItem(slot, count = 1) {
    if (slot < 0 || slot >= this.size) {
      return null;
    }

    const item = this.slots[slot];
    if (!item) {
      return null;
    }

    if (count >= item.count) {
      this.slots[slot] = null;
      this.emit('itemChanged', { slot, item: null });
      return item;
    } else {
      const removedItem = { ...item, count };
      item.count -= count;
      this.emit('itemChanged', { slot, item });
      return removedItem;
    }
  }

  getSelectedSlot() {
    return this.selectedSlot;
  }

  setSelectedSlot(slot) {
    if (slot >= 0 && slot < this.size) {
      this.selectedSlot = slot;
      this.emit('selectedSlotChanged', { slot });
    }
  }

  getSelectedItem() {
    return this.getItem(this.selectedSlot);
  }

  clear() {
    this.slots.fill(null);
    this.emit('inventoryCleared');
  }

  isEmpty() {
    return this.slots.every(slot => slot === null);
  }

  isFull() {
    return this.slots.every(slot => slot !== null);
  }

  getFirstEmptySlot() {
    return this.slots.findIndex(slot => slot === null);
  }

  hasItem(itemId, count = 1) {
    let totalCount = 0;
    for (const slot of this.slots) {
      if (slot && slot.id === itemId) {
        totalCount += slot.count;
        if (totalCount >= count) {
          return true;
        }
      }
    }
    return false;
  }

  countItem(itemId) {
    return this.slots.reduce((total, slot) => {
      if (slot && slot.id === itemId) {
        return total + slot.count;
      }
      return total;
    }, 0);
  }

  serialize() {
    return {
      size: this.size,
      slots: this.slots.map(slot => slot ? { ...slot } : null),
      selectedSlot: this.selectedSlot
    };
  }

  deserialize(data) {
    this.size = data.size;
    this.slots = data.slots.map(slot => slot ? { ...slot } : null);
    this.selectedSlot = data.selectedSlot;
    this.emit('inventoryLoaded');
  }
}

module.exports = { Inventory }; 