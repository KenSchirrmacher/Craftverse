/**
 * BrewingStandUI - Client-side UI for interacting with brewing stands
 */

class BrewingStandUI {
  constructor(game, position) {
    this.game = game;
    this.position = position;
    this.isOpen = false;
    this.playerInventory = game.player.inventory;
    
    // Brewing stand state
    this.brewingState = {
      ingredientSlot: null,
      fuelSlot: null,
      bottleSlots: [null, null, null],
      brewingProgress: 0,
      fuelLevel: 0,
      maxFuelLevel: 20,
      isActive: false
    };
    
    // Dragging state
    this.isDragging = false;
    this.draggedItem = null;
    this.draggedFromType = null;
    this.draggedFromIndex = null;
    
    // Element references
    this.container = null;
    this.progressBar = null;
    this.fuelBar = null;
    this.slots = {
      ingredient: null,
      fuel: null,
      bottles: []
    };
    
    // Bind methods
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.close = this.close.bind(this);
    
    // Init
    this.createUI();
    this.attachEventListeners();
    
    // Request initial state from server
    this.game.socket.emit('brewingStand:getState', { position: this.position });
  }
  
  createUI() {
    // Create main container
    this.container = document.createElement('div');
    this.container.className = 'brewing-stand';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'brewing-stand-header';
    
    const title = document.createElement('h2');
    title.textContent = 'Brewing Stand';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'close-btn';
    closeButton.textContent = '×';
    closeButton.addEventListener('click', this.close);
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Create brewing apparatus
    const apparatus = document.createElement('div');
    apparatus.className = 'brewing-apparatus';
    
    // Create ingredient slot
    const ingredientSlot = this.createSlot('ingredient');
    this.slots.ingredient = ingredientSlot;
    apparatus.appendChild(ingredientSlot);
    
    // Create progress bar
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'brewing-progress';
    
    const progressInner = document.createElement('div');
    progressInner.className = 'brewing-progress-inner';
    this.progressBarInner = progressInner;
    
    this.progressBar.appendChild(progressInner);
    apparatus.appendChild(this.progressBar);
    
    // Create fuel slot and bar
    const fuelContainer = document.createElement('div');
    fuelContainer.className = 'fuel-container';
    
    const fuelSlot = this.createSlot('fuel');
    this.slots.fuel = fuelSlot;
    fuelContainer.appendChild(fuelSlot);
    
    this.fuelBar = document.createElement('div');
    this.fuelBar.className = 'fuel-bar';
    
    const fuelBarInner = document.createElement('div');
    fuelBarInner.className = 'fuel-bar-inner';
    this.fuelBarInner = fuelBarInner;
    
    this.fuelBar.appendChild(fuelBarInner);
    fuelContainer.appendChild(this.fuelBar);
    
    apparatus.appendChild(fuelContainer);
    
    // Create bottle slots
    const bottleContainer = document.createElement('div');
    bottleContainer.className = 'bottle-container';
    
    for (let i = 0; i < 3; i++) {
      const bottleSlot = this.createSlot('bottle', i);
      this.slots.bottles[i] = bottleSlot;
      bottleContainer.appendChild(bottleSlot);
    }
    
    apparatus.appendChild(bottleContainer);
    
    // Create inventory section
    const inventorySection = document.createElement('div');
    inventorySection.className = 'inventory-section';
    
    const inventoryTitle = document.createElement('h3');
    inventoryTitle.textContent = 'Inventory';
    inventorySection.appendChild(inventoryTitle);
    
    const inventoryGrid = document.createElement('div');
    inventoryGrid.className = 'inventory-grid';
    
    // Create inventory slots (3 rows of 9)
    for (let i = 0; i < 27; i++) {
      const slot = this.createSlot('inventory', i);
      inventoryGrid.appendChild(slot);
    }
    
    inventorySection.appendChild(inventoryGrid);
    
    // Create hotbar
    const hotbar = document.createElement('div');
    hotbar.className = 'hotbar';
    
    for (let i = 0; i < 9; i++) {
      const slot = this.createSlot('hotbar', i);
      hotbar.appendChild(slot);
    }
    
    inventorySection.appendChild(hotbar);
    
    // Create dragged item element (hidden initially)
    this.draggedItemElement = document.createElement('div');
    this.draggedItemElement.className = 'dragged-item hidden';
    
    // Assemble all components
    this.container.appendChild(header);
    this.container.appendChild(apparatus);
    this.container.appendChild(inventorySection);
    this.container.appendChild(this.draggedItemElement);
    
    // Add to document
    document.body.appendChild(this.container);
    
    // Hide initially
    this.container.style.display = 'none';
  }
  
  createSlot(type, index = 0) {
    const slot = document.createElement('div');
    slot.className = `slot ${type}-slot`;
    slot.dataset.type = type;
    slot.dataset.index = index;
    
    // Add visual cue for specific slot types
    if (type === 'ingredient') {
      const icon = document.createElement('div');
      icon.className = 'slot-icon ingredient-icon';
      slot.appendChild(icon);
    } else if (type === 'fuel') {
      const icon = document.createElement('div');
      icon.className = 'slot-icon fuel-icon';
      slot.appendChild(icon);
    } else if (type === 'bottle') {
      const icon = document.createElement('div');
      icon.className = 'slot-icon bottle-icon';
      slot.appendChild(icon);
    }
    
    return slot;
  }
  
  updateSlot(slotElement, item) {
    // Clear existing content
    while (slotElement.childNodes.length > 1) { // Keep the icon if present
      if (!slotElement.lastChild.classList || !slotElement.lastChild.classList.contains('slot-icon')) {
        slotElement.removeChild(slotElement.lastChild);
      } else {
        break;
      }
    }
    
    if (!item) return;
    
    // Create item element
    const itemElement = document.createElement('div');
    itemElement.className = 'item';
    itemElement.style.backgroundImage = `url(assets/items/${item.id}.png)`;
    
    // Add count indicator if more than 1
    if (item.count > 1) {
      const countElement = document.createElement('span');
      countElement.className = 'item-count';
      countElement.textContent = item.count;
      itemElement.appendChild(countElement);
    }
    
    slotElement.appendChild(itemElement);
  }
  
  updateAllSlots() {
    // Update brewing stand slots
    this.updateSlot(this.slots.ingredient, this.brewingState.ingredientSlot);
    this.updateSlot(this.slots.fuel, this.brewingState.fuelSlot);
    
    for (let i = 0; i < 3; i++) {
      this.updateSlot(this.slots.bottles[i], this.brewingState.bottleSlots[i]);
    }
    
    // Update inventory slots
    const inventorySlots = document.querySelectorAll('.inventory-slot');
    for (let i = 0; i < inventorySlots.length; i++) {
      this.updateSlot(inventorySlots[i], this.playerInventory.items[i + 9]); // Skip hotbar
    }
    
    // Update hotbar slots
    const hotbarSlots = document.querySelectorAll('.hotbar-slot');
    for (let i = 0; i < hotbarSlots.length; i++) {
      this.updateSlot(hotbarSlots[i], this.playerInventory.items[i]);
    }
  }
  
  updateProgressBars() {
    // Update brewing progress
    const progressPercent = this.brewingState.brewingProgress * 100;
    this.progressBarInner.style.height = `${progressPercent}%`;
    
    if (this.brewingState.isActive) {
      this.progressBarInner.classList.add('active');
    } else {
      this.progressBarInner.classList.remove('active');
    }
    
    // Update fuel level
    const fuelPercent = (this.brewingState.fuelLevel / this.brewingState.maxFuelLevel) * 100;
    this.fuelBarInner.style.height = `${fuelPercent}%`;
  }
  
  setState(state) {
    this.brewingState = state;
    this.updateAllSlots();
    this.updateProgressBars();
  }
  
  attachEventListeners() {
    document.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Listen for server updates
    this.game.socket.on('brewingStand:state', this.setState.bind(this));
    this.game.socket.on('brewingStand:progress', progress => {
      this.brewingState.brewingProgress = progress;
      this.updateProgressBars();
    });
  }
  
  removeEventListeners() {
    document.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('keydown', this.handleKeyDown);
    
    // Remove socket listeners
    this.game.socket.off('brewingStand:state');
    this.game.socket.off('brewingStand:progress');
  }
  
  handleMouseDown(e) {
    if (!this.isOpen) return;
    
    // Check if clicked on a slot
    let target = e.target;
    while (target && !target.classList.contains('slot')) {
      if (target === this.container || target === document.body) {
        target = null;
        break;
      }
      target = target.parentElement;
    }
    
    if (!target) return;
    
    const slotType = target.dataset.type;
    const slotIndex = parseInt(target.dataset.index, 10);
    
    // Determine which item collection to use
    let sourceItem = null;
    
    if (slotType === 'ingredient') {
      sourceItem = this.brewingState.ingredientSlot;
    } else if (slotType === 'fuel') {
      sourceItem = this.brewingState.fuelSlot;
    } else if (slotType === 'bottle') {
      sourceItem = this.brewingState.bottleSlots[slotIndex];
    } else if (slotType === 'inventory' || slotType === 'hotbar') {
      const inventoryIndex = slotType === 'hotbar' ? slotIndex : slotIndex + 9;
      sourceItem = this.playerInventory.items[inventoryIndex];
    }
    
    // Start dragging if there's an item
    if (sourceItem) {
      this.startDragging(sourceItem, slotType, slotIndex);
      e.preventDefault();
    }
  }
  
  handleMouseUp(e) {
    if (!this.isOpen || !this.isDragging) return;
    
    // Check if dropped on a slot
    let target = e.target;
    while (target && !target.classList.contains('slot')) {
      if (target === this.container || target === document.body) {
        target = null;
        break;
      }
      target = target.parentElement;
    }
    
    if (target) {
      const targetType = target.dataset.type;
      const targetIndex = parseInt(target.dataset.index, 10);
      
      // Attempt to move the item
      this.moveItem(this.draggedFromType, this.draggedFromIndex, targetType, targetIndex);
    }
    
    // Stop dragging
    this.stopDragging();
    e.preventDefault();
  }
  
  handleMouseMove(e) {
    if (!this.isOpen || !this.isDragging) return;
    
    // Update dragged item position
    this.draggedItemElement.style.left = `${e.clientX}px`;
    this.draggedItemElement.style.top = `${e.clientY}px`;
  }
  
  handleKeyDown(e) {
    if (!this.isOpen) return;
    
    // Close on Escape key
    if (e.key === 'Escape' || e.key === 'e' || e.key === 'E') {
      this.close();
      e.preventDefault();
    }
  }
  
  startDragging(item, fromType, fromIndex) {
    this.isDragging = true;
    this.draggedItem = { ...item };
    this.draggedFromType = fromType;
    this.draggedFromIndex = fromIndex;
    
    // Update dragged item visual
    this.draggedItemElement.style.backgroundImage = `url(assets/items/${item.id}.png)`;
    
    if (item.count > 1) {
      const countElement = document.createElement('span');
      countElement.className = 'item-count';
      countElement.textContent = item.count;
      this.draggedItemElement.appendChild(countElement);
    }
    
    this.draggedItemElement.classList.remove('hidden');
  }
  
  stopDragging() {
    this.isDragging = false;
    this.draggedItem = null;
    this.draggedFromType = null;
    this.draggedFromIndex = null;
    
    // Clear dragged item visual
    this.draggedItemElement.style.backgroundImage = '';
    this.draggedItemElement.innerHTML = '';
    this.draggedItemElement.classList.add('hidden');
  }
  
  moveItem(fromType, fromIndex, toType, toIndex) {
    // Convert to inventory index if needed
    let fromInventoryIndex = fromIndex;
    let toInventoryIndex = toIndex;
    
    if (fromType === 'inventory') {
      fromInventoryIndex += 9;
    } else if (fromType === 'hotbar') {
      fromInventoryIndex = fromIndex;
    }
    
    if (toType === 'inventory') {
      toInventoryIndex += 9;
    } else if (toType === 'hotbar') {
      toInventoryIndex = toIndex;
    }
    
    // Handle different source and target types
    if ((fromType === 'inventory' || fromType === 'hotbar') && 
        (toType === 'ingredient' || toType === 'fuel' || toType === 'bottle')) {
      // From inventory to brewing stand
      const item = this.playerInventory.items[fromInventoryIndex];
      if (!item) return;
      
      // Send to server
      this.game.socket.emit('brewingStand:moveItem', {
        position: this.position,
        fromType: 'inventory',
        fromIndex: fromInventoryIndex,
        toType,
        toIndex,
        count: item.count
      });
    } 
    else if ((fromType === 'ingredient' || fromType === 'fuel' || fromType === 'bottle') && 
             (toType === 'inventory' || toType === 'hotbar')) {
      // From brewing stand to inventory
      let item = null;
      
      if (fromType === 'ingredient') {
        item = this.brewingState.ingredientSlot;
      } else if (fromType === 'fuel') {
        item = this.brewingState.fuelSlot;
      } else if (fromType === 'bottle') {
        item = this.brewingState.bottleSlots[fromIndex];
      }
      
      if (!item) return;
      
      // Send to server
      this.game.socket.emit('brewingStand:moveItem', {
        position: this.position,
        fromType,
        fromIndex,
        toType: 'inventory',
        toIndex: toInventoryIndex,
        count: item.count
      });
    }
    else if ((fromType === 'ingredient' || fromType === 'fuel' || fromType === 'bottle') && 
             (toType === 'ingredient' || toType === 'fuel' || toType === 'bottle')) {
      // From brewing stand to brewing stand
      let item = null;
      
      if (fromType === 'ingredient') {
        item = this.brewingState.ingredientSlot;
      } else if (fromType === 'fuel') {
        item = this.brewingState.fuelSlot;
      } else if (fromType === 'bottle') {
        item = this.brewingState.bottleSlots[fromIndex];
      }
      
      if (!item) return;
      
      // Send to server
      this.game.socket.emit('brewingStand:moveItem', {
        position: this.position,
        fromType,
        fromIndex,
        toType,
        toIndex,
        count: item.count
      });
    }
    else if ((fromType === 'inventory' || fromType === 'hotbar') && 
             (toType === 'inventory' || toType === 'hotbar')) {
      // From inventory to inventory
      this.playerInventory.moveItem(fromInventoryIndex, toInventoryIndex);
      this.updateAllSlots();
    }
  }
  
  open() {
    this.isOpen = true;
    this.container.style.display = 'flex';
    this.game.player.controls.lock(true);
    this.game.socket.emit('brewingStand:getState', { position: this.position });
  }
  
  close() {
    this.isOpen = false;
    this.container.style.display = 'none';
    this.game.player.controls.unlock();
    this.game.socket.emit('brewingStand:close', { position: this.position });
    
    // Stop dragging if we were
    if (this.isDragging) {
      this.stopDragging();
    }
  }
  
  destroy() {
    this.removeEventListeners();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrewingStandUI;
} else {
  window.BrewingStandUI = BrewingStandUI;
} 