/**
 * CrafterBlock - Automated crafting block from Minecraft 1.21 Update
 * Allows for redstone-powered crafting automation
 * Enhanced for Minecraft 1.24 Update (Trail Tales)
 */

const Block = require('./baseBlock');
const { EventEmitter } = require('events');

class CrafterBlock extends Block {
  constructor(options = {}) {
    const defaultOptions = {
      id: 'crafter',
      name: 'Crafter',
      hardness: 3.0,
      resistance: 6.0,
      requiresTool: true,
      toolType: 'axe',
      transparent: false,
      solid: true,
      gravity: false,
      luminance: 0,
      ...options
    };
    
    super(defaultOptions);
    
    this.toolType = defaultOptions.toolType;
    this.transparent = defaultOptions.transparent;
    this.gravity = defaultOptions.gravity;
    
    this.inventorySize = 9;
    this.inventory = new Array(this.inventorySize).fill(null);
    this.outputSlot = null;
    this.facing = options.facing || 'north';
    this.powered = false;
    this.cooldown = 0;
    this.cooldownTime = 20;
    this.world = null;
    
    this.recipeMemory = null;
    this.recipeResult = null;
    this.craftingMode = options.craftingMode || 'manual';
    this.slotsLocked = new Array(this.inventorySize).fill(false);
    this.redstoneMode = options.redstoneMode || 'pulse';
    this.lastComparatorOutput = 0;
    
    this.events = new EventEmitter();
  }

  getWorld() {
    return this.world;
  }

  setWorld(world) {
    this.world = world;
  }

  setPowered(isPowered) {
    if (this.powered !== isPowered) {
      this.powered = isPowered;
      
      if (isPowered) {
        switch (this.redstoneMode) {
          case 'pulse':
            if (this.cooldown <= 0) {
              this.attemptCrafting();
              this.cooldown = this.cooldownTime;
            }
            break;
          case 'continuous':
            break;
          case 'filtered':
            if (this.cooldown <= 0 && this.recipeMemory && this.matchesRecipeMemory()) {
              this.attemptCrafting();
              this.cooldown = this.cooldownTime;
            }
            break;
        }
      }
      
      return true;
    }
    return false;
  }

  setFacing(direction) {
    const validDirections = ['north', 'south', 'east', 'west'];
    if (validDirections.includes(direction)) {
      this.facing = direction;
    }
  }

  placeItem(slot, item) {
    if (slot >= 0 && slot < this.inventorySize) {
      if (this.slotsLocked[slot]) {
        return item;
      }
      
      const previousItem = this.inventory[slot];
      this.inventory[slot] = item;
      
      this.updateComparatorOutput();
      
      return previousItem;
    }
    return null;
  }

  removeItem(slot) {
    if (slot >= 0 && slot < this.inventorySize) {
      if (this.slotsLocked[slot]) {
        return null;
      }
      
      const item = this.inventory[slot];
      this.inventory[slot] = null;
      
      this.updateComparatorOutput();
      
      return item;
    }
    return null;
  }

  getOutput() {
    const output = this.outputSlot;
    this.outputSlot = null;
    
    if (output) {
      if (this.craftingMode !== 'manual') {
        this.saveRecipeMemory(output);
      }
      
      this.consumeIngredients();
    }
    
    this.updateComparatorOutput();
    
    return output;
  }

  saveRecipeMemory(result) {
    this.recipeMemory = this.inventory.map(item => {
      if (!item) return null;
      return {
        id: item.id,
        count: item.count
      };
    });
    
    this.recipeResult = {
      id: result.id,
      count: result.count
    };
    
    this.events.emit('recipeMemorySaved', {
      pattern: this.recipeMemory,
      result: this.recipeResult
    });
    
    this.createRecipeMemoryParticles();
  }

  clearRecipeMemory() {
    this.recipeMemory = null;
    this.recipeResult = null;
    
    this.events.emit('recipeMemoryCleared');
    
    this.createRecipeMemoryClearedParticles();
  }

  matchesRecipeMemory() {
    if (!this.recipeMemory) {
      return false;
    }
    
    const recipeManager = this.world.getRecipeManager();
    if (!recipeManager) {
      return false;
    }
    
    // Convert flat inventory to 3x3 grid
    const grid = [];
    for (let y = 0; y < 3; y++) {
      const row = [];
      for (let x = 0; x < 3; x++) {
        row.push(this.inventory[y * 3 + x]);
      }
      grid.push(row);
    }
    
    const recipe = recipeManager.findMatchingRecipe(grid);
    if (!recipe) {
      return false;
    }
    
    return recipeManager.matchesPattern(grid, recipe.pattern, recipe.alternatives);
  }

  calculateRecipeCompleteness() {
    if (!this.recipeMemory) {
      return 0;
    }
    
    const recipeManager = this.world.getRecipeManager();
    if (!recipeManager) {
      return 0;
    }
    
    // Convert flat inventory to 3x3 grid
    const grid = [];
    for (let y = 0; y < 3; y++) {
      const row = [];
      for (let x = 0; x < 3; x++) {
        row.push(this.inventory[y * 3 + x]);
      }
      grid.push(row);
    }
    
    const recipe = recipeManager.findMatchingRecipe(grid);
    if (!recipe) {
      return 0;
    }
    
    return recipeManager.calculatePatternCompleteness(grid, recipe.pattern, recipe.alternatives);
  }

  setCraftingMode(mode) {
    const validModes = ['manual', 'template', 'auto-refill'];
    if (validModes.includes(mode)) {
      this.craftingMode = mode;
      
      this.createCraftingModeChangedParticles();
      
      this.events.emit('craftingModeChanged', {
        mode: this.craftingMode
      });
      
      return true;
    }
    return false;
  }

  toggleSlotLock(slot) {
    if (slot >= 0 && slot < this.inventorySize) {
      this.slotsLocked[slot] = !this.slotsLocked[slot];
      
      this.createSlotLockChangedParticles(slot, this.slotsLocked[slot]);
      
      this.events.emit('slotLockChanged', {
        slot: slot,
        locked: this.slotsLocked[slot]
      });
      
      return this.slotsLocked[slot];
    }
    return false;
  }

  cycleRedstoneMode() {
    const modes = ['pulse', 'continuous', 'filtered'];
    const currentIndex = modes.indexOf(this.redstoneMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.redstoneMode = modes[nextIndex];
    
    this.createRedstoneModeChangedParticles();
    
    this.events.emit('redstoneModeChanged', {
      mode: this.redstoneMode
    });
    
    return this.redstoneMode;
  }

  attemptCrafting() {
    const recipeManager = this.world.getRecipeManager();
    if (!recipeManager) return false;

    if (this.outputSlot !== null) return false;

    // Convert flat inventory to 3x3 grid
    const grid = [];
    for (let y = 0; y < 3; y++) {
      const row = [];
      for (let x = 0; x < 3; x++) {
        row.push(this.inventory[y * 3 + x]);
      }
      grid.push(row);
    }

    const result = recipeManager.craftItem(grid);
    if (!result) return false;

    this.outputSlot = result;

    this.events.emit('itemCrafted', result);

    this.createCraftingParticles();

    return true;
  }

  consumeIngredients() {
    const recipeManager = this.world.getRecipeManager();
    if (!recipeManager) return;

    // Convert flat inventory to 3x3 grid
    const grid = [];
    for (let y = 0; y < 3; y++) {
      const row = [];
      for (let x = 0; x < 3; x++) {
        row.push(this.inventory[y * 3 + x]);
      }
      grid.push(row);
    }

    const recipe = recipeManager.findMatchingRecipe(grid);
    if (!recipe) return;

    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const slot = y * 3 + x;
        const patternItem = recipe.pattern[y][x];
        
        if (patternItem !== null) {
          const item = this.inventory[slot];
          if (item) {
            item.count--;
            if (item.count <= 0) {
              this.inventory[slot] = null;
            }
          }
        }
      }
    }
  }

  getComparatorOutput() {
    if (!this.recipeMemory) {
      const filledSlots = this.inventory.filter(item => item !== null).length;
      return Math.min(15, Math.round((filledSlots / this.inventorySize) * 15));
    }
    
    const completeness = this.calculateRecipeCompleteness();
    
    if (completeness === 0) {
      return 0;
    } else if (completeness < 100) {
      // Scale 0-100% to 1-7 range
      return 1 + Math.round((completeness / 100) * 6);
    } else if (this.outputSlot) {
      return 15;
    } else {
      return 14;
    }
  }

  updateComparatorOutput() {
    const newOutput = this.getComparatorOutput();
    if (newOutput !== this.lastComparatorOutput) {
      this.lastComparatorOutput = newOutput;
      
      const world = this.getWorld();
      if (world && world.updateComparatorOutput) {
        world.updateComparatorOutput(this.position.x, this.position.y, this.position.z, newOutput);
      }
    }
  }

  update() {
    if (this.cooldown > 0) {
      this.cooldown--;
    }
    
    if (this.powered && this.cooldown <= 0) {
      switch (this.redstoneMode) {
        case 'pulse':
          break;
        case 'continuous':
          this.attemptCrafting();
          this.cooldown = this.cooldownTime;
          break;
        case 'filtered':
          if (this.recipeMemory && this.matchesRecipeMemory()) {
            this.attemptCrafting();
            this.cooldown = this.cooldownTime;
          }
          break;
      }
    }
    
    if (this.craftingMode === 'auto-refill' && this.recipeMemory) {
      this.tryRefillFromAdjacentContainers();
    }
    
    this.updateComparatorOutput();
  }

  tryRefillFromAdjacentContainers() {
    // Implement in future update - requires adjacent block access
  }

  createRecipeMemoryParticles() {
    this.events.emit('visualEffect', {
      type: 'recipeSaved',
      position: this.position
    });
  }

  createRecipeMemoryClearedParticles() {
    this.events.emit('visualEffect', {
      type: 'recipeCleared',
      position: this.position
    });
  }

  createCraftingModeChangedParticles() {
    this.events.emit('visualEffect', {
      type: 'modeChanged',
      mode: this.craftingMode,
      position: this.position
    });
  }

  createSlotLockChangedParticles(slot, locked) {
    this.events.emit('visualEffect', {
      type: 'slotLockChanged',
      slot: slot,
      locked: locked,
      position: this.position
    });
  }

  createRedstoneModeChangedParticles() {
    this.events.emit('visualEffect', {
      type: 'redstoneModeChanged',
      mode: this.redstoneMode,
      position: this.position
    });
  }

  createCraftingParticles() {
    this.events.emit('visualEffect', {
      type: 'crafting',
      position: this.position
    });
  }

  interact(player, action) {
    if (player && action.type === 'right_click' && action.sneaking) {
      if (action.mainHand === null) {
        this.setCraftingMode(
          this.craftingMode === 'manual' ? 'template' : 
          this.craftingMode === 'template' ? 'auto-refill' : 'manual'
        );
        return true;
      }
      
      if (action.targetSlot !== undefined && action.targetSlot >= 0 && action.targetSlot < this.inventorySize) {
        this.toggleSlotLock(action.targetSlot);
        return true;
      }
      
      if (action.mainHand && action.mainHand.id === 'redstone_dust') {
        this.cycleRedstoneMode();
        return true;
      }
    }
    
    return false;
  }

  serialize() {
    const data = super.serialize();
    
    data.inventory = this.inventory.map(item => item ? { ...item } : null);
    data.outputSlot = this.outputSlot ? { ...this.outputSlot } : null;
    data.facing = this.facing;
    data.powered = this.powered;
    data.cooldown = this.cooldown;
    data.recipeMemory = this.recipeMemory ? this.recipeMemory.map(item => item ? { ...item } : null) : null;
    data.recipeResult = this.recipeResult ? { ...this.recipeResult } : null;
    data.craftingMode = this.craftingMode;
    data.slotsLocked = [...this.slotsLocked];
    data.redstoneMode = this.redstoneMode;
    data.lastComparatorOutput = this.lastComparatorOutput;
    
    return data;
  }

  static deserialize(data, world) {
    const block = new CrafterBlock();
    block.deserialize(data);
    block.setWorld(world);
    
    block.inventory = data.inventory.map(item => item ? { ...item } : null);
    block.outputSlot = data.outputSlot ? { ...data.outputSlot } : null;
    block.facing = data.facing;
    block.powered = data.powered;
    block.cooldown = data.cooldown;
    block.recipeMemory = data.recipeMemory ? data.recipeMemory.map(item => item ? { ...item } : null) : null;
    block.recipeResult = data.recipeResult ? { ...data.recipeResult } : null;
    block.craftingMode = data.craftingMode;
    block.slotsLocked = [...data.slotsLocked];
    block.redstoneMode = data.redstoneMode;
    block.lastComparatorOutput = data.lastComparatorOutput;
    
    return block;
  }

  getDrops() {
    const drops = [{
      id: 'crafter',
      count: 1
    }];
    
    // Add inventory items
    this.inventory.forEach(item => {
      if (item) {
        drops.push({ ...item });
      }
    });
    
    // Add output item
    if (this.outputSlot) {
      drops.push({ ...this.outputSlot });
    }
    
    return drops;
  }
}

module.exports = CrafterBlock; 