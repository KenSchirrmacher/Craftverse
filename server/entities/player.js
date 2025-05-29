const Entity = require('./entity');
const { Inventory } = require('../inventory/inventory');

class Player extends Entity {
  constructor(id, name) {
    super(id);
    this.name = name;
    this.inventory = new Inventory(36); // 36 slots (4 rows of 9)
    this.position = { x: 0, y: 64, z: 0 };
    this.rotation = { yaw: 0, pitch: 0 };
    this.health = 20;
    this.maxHealth = 20;
    this.hunger = 20;
    this.maxHunger = 20;
    this.experience = 0;
    this.level = 0;
    this.gameMode = 'survival';
    this.dimension = 'overworld';
    this.returnPoint = null;
  }

  getPosition() {
    return { ...this.position };
  }

  setPosition(x, y, z) {
    this.position = { x, y, z };
  }

  getRotation() {
    return { ...this.rotation };
  }

  setRotation(yaw, pitch) {
    this.rotation = { yaw, pitch };
  }

  getHealth() {
    return this.health;
  }

  setHealth(health) {
    this.health = Math.min(Math.max(0, health), this.maxHealth);
  }

  getHunger() {
    return this.hunger;
  }

  setHunger(hunger) {
    this.hunger = Math.min(Math.max(0, hunger), this.maxHunger);
  }

  getExperience() {
    return this.experience;
  }

  addExperience(amount) {
    this.experience += amount;
    // Level up logic could be added here
  }

  getLevel() {
    return this.level;
  }

  setLevel(level) {
    this.level = level;
  }

  getGameMode() {
    return this.gameMode;
  }

  setGameMode(mode) {
    this.gameMode = mode;
  }

  getDimension() {
    return this.dimension;
  }

  setDimension(dimension) {
    this.dimension = dimension;
  }

  getReturnPoint() {
    return this.returnPoint;
  }

  setReturnPoint(point) {
    this.returnPoint = point;
  }

  getInventory() {
    return this.inventory;
  }

  addItem(item) {
    return this.inventory.addItem(item);
  }

  removeItem(slot) {
    return this.inventory.removeItem(slot);
  }

  getItemInHand() {
    return this.inventory.getSelectedItem();
  }

  setItemInHand(slot) {
    this.inventory.setSelectedSlot(slot);
  }

  // Helper method to check if player is in creative mode
  isCreative() {
    return this.gameMode === 'creative';
  }

  // Helper method to check if player is in survival mode
  isSurvival() {
    return this.gameMode === 'survival';
  }

  // Helper method to check if player is in adventure mode
  isAdventure() {
    return this.gameMode === 'adventure';
  }

  // Helper method to check if player is in spectator mode
  isSpectator() {
    return this.gameMode === 'spectator';
  }
}

module.exports = Player; 