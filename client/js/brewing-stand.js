/**
 * Client-side BrewingStandUI - Handles the UI interaction for the brewing stand
 * Controls item placement, removal, and state updates
 */

class BrewingStandUI {
  constructor(game) {
    this.game = game;
    this.visible = false;
    this.position = null;
    this.state = {
      ingredient: null,
      bottles: [null, null, null],
      fuel: null,
      fuelLevel: 0,
      maxFuel: 20,
      brewingProgress: 0,
      isActive: false
    };
    
    this.draggedItem = null;
    this.draggedSlot = null;
    this.isDragging = false;
    
    this.initUI();
    this.setupEventListeners();
  }
  
  /**
   * Initialize the brewing stand UI elements
   */
  initUI() {
    // Create UI container
    this.container = document.createElement('div');
    this.container.className = 'brewing-stand-container';
    this.container.style.display = 'none';
    
    // Create title
    const title = document.createElement('div');
    title.className = 'brewing-stand-title';
    title.textContent = 'Brewing Stand';
    this.container.appendChild(title);
    
    // Create brewing stand apparatus
    this.apparatus = document.createElement('div');
    this.apparatus.className = 'brewing-apparatus';
    this.container.appendChild(this.apparatus);
    
    // Create ingredient slot
    this.ingredientSlot = this.createSlot('ingredient', 'ingredient-slot');
    this.apparatus.appendChild(this.ingredientSlot);
    
    // Create bottle slots
    this.bottleSlots = [];
    for (let i = 0; i < 3; i++) {
      const bottleSlot = this.createSlot(`bottle${i}`, 'bottle-slot');
      this.bottleSlots.push(bottleSlot);
      this.apparatus.appendChild(bottleSlot);
    }
    
    // Create fuel slot
    this.fuelSlot = this.createSlot('fuel', 'fuel-slot');
    this.apparatus.appendChild(this.fuelSlot);
    
    // Create progress bar
    this.progressBarContainer = document.createElement('div');
    this.progressBarContainer.className = 'brewing-progress-container';
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'brewing-progress-bar';
    this.progressBarContainer.appendChild(this.progressBar);
    this.apparatus.appendChild(this.progressBarContainer);
    
    // Create fuel bar
    this.fuelBarContainer = document.createElement('div');
    this.fuelBarContainer.className = 'fuel-bar-container';
    this.fuelBar = document.createElement('div');
    this.fuelBar.className = 'fuel-bar';
    this.fuelBarContainer.appendChild(this.fuelBar);
    this.apparatus.appendChild(this.fuelBarContainer);
    
    // Create player inventory
    this.inventoryContainer = document.createElement('div');
    this.inventoryContainer.className = 'player-inventory-container';
    this.container.appendChild(this.inventoryContainer);
    
    // Create inventory slots
    this.inventorySlots = [];
    const hotbarRow = document.createElement('div');
    hotbarRow.className = 'inventory-row hotbar-row';
    this.inventoryContainer.appendChild(hotbarRow);
    
    // Create hotbar (9 slots)
    for (let i = 0; i < 9; i++) {
      const slot = this.createSlot(`inventory${i}`, 'inventory-slot hotbar-slot');
      hotbarRow.appendChild(slot);
      this.inventorySlots.push(slot);
    }
    
    // Create main inventory (27 slots)
    for (let row = 0; row < 3; row++) {
      const inventoryRow = document.createElement('div');
      inventoryRow.className = 'inventory-row';
      this.inventoryContainer.appendChild(inventoryRow);
      
      for (let col = 0; col < 9; col++) {
        const index = 9 + (row * 9) + col;
        const slot = this.createSlot(`inventory${index}`, 'inventory-slot');
        inventoryRow.appendChild(slot);
        this.inventorySlots.push(slot);
      }
    }
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.textContent = 'X';
    closeButton.addEventListener('click', () => this.hide());
    this.container.appendChild(closeButton);
    
    // Add to document
    document.body.appendChild(this.container);
  }
  
  /**
   * Create a slot element for items
   * @param {string} slotName - The slot identifier
   * @param {string} className - CSS class for the slot
   * @returns {HTMLElement} The created slot element
   */
  createSlot(slotName, className) {
    const slot = document.createElement('div');
    slot.className = `item-slot ${className}`;
    slot.dataset.slot = slotName;
    
    // Create item container
    const itemContainer = document.createElement('div');
    itemContainer.className = 'item-container';
    slot.appendChild(itemContainer);
    
    // Create count display
    const countDisplay = document.createElement('div');
    countDisplay.className = 'item-count';
    slot.appendChild(countDisplay);
    
    return slot;
  }
  
  /**
   * Set up event listeners for UI interaction
   */
  setupEventListeners() {
    // Mouse down on slots to start dragging
    this.container.addEventListener('mousedown', (e) => {
      if (e.target.closest('.item-slot')) {
        this.handleSlotMouseDown(e);
      }
    });
    
    // Mouse up to drop items
    this.container.addEventListener('mouseup', (e) => {
      if (this.isDragging) {
        this.handleSlotMouseUp(e);
      }
    });
    
    // Mouse move to drag items
    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.handleMouseMove(e);
      }
    });
    
    // Mouse up anywhere to cancel drag
    document.addEventListener('mouseup', (e) => {
      if (this.isDragging) {
        this.handleMouseUp(e);
      }
    });
    
    // Key events for splitting stacks, etc.
    document.addEventListener('keydown', (e) => {
      if (this.visible && e.key === 'Escape') {
        this.hide();
      }
    });
  }
  
  /**
   * Handle mouse down on a slot
   * @param {MouseEvent} e - The mouse event
   */
  handleSlotMouseDown(e) {
    const slot = e.target.closest('.item-slot');
    const slotName = slot.dataset.slot;
    
    // Get item from the appropriate collection
    let item = null;
    
    if (slotName === 'ingredient') {
      item = this.state.ingredient;
    } else if (slotName === 'fuel') {
      item = this.state.fuel;
    } else if (slotName.startsWith('bottle')) {
      const index = parseInt(slotName.substring(6), 10);
      item = this.state.bottles[index];
    } else if (slotName.startsWith('inventory')) {
      const index = parseInt(slotName.substring(9), 10);
      item = this.game.player.inventory.items[index];
    }
    
    if (item) {
      this.startDragging(item, slotName, e);
    }
  }
  
  /**
   * Start dragging an item
   * @param {Object} item - The item being dragged
   * @param {string} slotName - The source slot name
   * @param {MouseEvent} e - The mouse event
   */
  startDragging(item, slotName, e) {
    this.isDragging = true;
    this.draggedItem = item;
    this.draggedSlot = slotName;
    
    // Create drag visual
    this.dragVisual = document.createElement('div');
    this.dragVisual.className = 'dragged-item';
    
    const itemImg = document.createElement('img');
    itemImg.src = this.getItemImageUrl(item);
    this.dragVisual.appendChild(itemImg);
    
    if (item.count > 1) {
      const countDisplay = document.createElement('div');
      countDisplay.className = 'dragged-item-count';
      countDisplay.textContent = item.count;
      this.dragVisual.appendChild(countDisplay);
    }
    
    document.body.appendChild(this.dragVisual);
    
    // Position at mouse
    this.dragVisual.style.left = `${e.clientX - 16}px`;
    this.dragVisual.style.top = `${e.clientY - 16}px`;
    
    // Remove item from source slot visual
    if (slotName === 'ingredient') {
      this.state.ingredient = null;
    } else if (slotName === 'fuel') {
      this.state.fuel = null;
    } else if (slotName.startsWith('bottle')) {
      const index = parseInt(slotName.substring(6), 10);
      this.state.bottles[index] = null;
    } else if (slotName.startsWith('inventory')) {
      const index = parseInt(slotName.substring(9), 10);
      this.game.player.inventory.items[index] = null;
    }
    
    this.updateUI();
  }
  
  /**
   * Handle mouse movement when dragging
   * @param {MouseEvent} e - The mouse event
   */
  handleMouseMove(e) {
    if (this.dragVisual) {
      this.dragVisual.style.left = `${e.clientX - 16}px`;
      this.dragVisual.style.top = `${e.clientY - 16}px`;
    }
  }
  
  /**
   * Handle mouse up on a slot when dragging
   * @param {MouseEvent} e - The mouse event
   */
  handleSlotMouseUp(e) {
    const slot = e.target.closest('.item-slot');
    
    if (slot) {
      const targetSlotName = slot.dataset.slot;
      this.placeItemInSlot(targetSlotName);
    }
    
    this.stopDragging();
  }
  
  /**
   * Handle mouse up anywhere (cancel drag if not on a slot)
   */
  handleMouseUp() {
    // Return item to original slot
    if (this.draggedItem && this.draggedSlot) {
      if (this.draggedSlot === 'ingredient') {
        this.state.ingredient = this.draggedItem;
      } else if (this.draggedSlot === 'fuel') {
        this.state.fuel = this.draggedItem;
      } else if (this.draggedSlot.startsWith('bottle')) {
        const index = parseInt(this.draggedSlot.substring(6), 10);
        this.state.bottles[index] = this.draggedItem;
      } else if (this.draggedSlot.startsWith('inventory')) {
        const index = parseInt(this.draggedSlot.substring(9), 10);
        this.game.player.inventory.items[index] = this.draggedItem;
      }
    }
    
    this.stopDragging();
    this.updateUI();
  }
  
  /**
   * Stop dragging and clean up
   */
  stopDragging() {
    this.isDragging = false;
    
    if (this.dragVisual) {
      this.dragVisual.remove();
      this.dragVisual = null;
    }
    
    this.draggedItem = null;
    this.draggedSlot = null;
  }
  
  /**
   * Place the dragged item in a target slot
   * @param {string} targetSlotName - The target slot name
   */
  placeItemInSlot(targetSlotName) {
    if (!this.draggedItem) return;
    
    let canPlace = true;
    
    // Check if item can be placed in this slot type
    if (targetSlotName === 'ingredient') {
      // Any item can be an ingredient
    } else if (targetSlotName === 'fuel') {
      // Only blaze powder can be fuel
      canPlace = this.draggedItem.type === 'blaze_powder';
    } else if (targetSlotName.startsWith('bottle')) {
      // Only water bottles and potions can go in bottle slots
      canPlace = this.draggedItem.type === 'potion' || 
                this.draggedItem.type === 'glass_bottle';
    }
    
    if (!canPlace) {
      return;
    }
    
    // Get current item in target slot
    let targetItem = null;
    
    if (targetSlotName === 'ingredient') {
      targetItem = this.state.ingredient;
    } else if (targetSlotName === 'fuel') {
      targetItem = this.state.fuel;
    } else if (targetSlotName.startsWith('bottle')) {
      const index = parseInt(targetSlotName.substring(6), 10);
      targetItem = this.state.bottles[index];
    } else if (targetSlotName.startsWith('inventory')) {
      const index = parseInt(targetSlotName.substring(9), 10);
      targetItem = this.game.player.inventory.items[index];
    }
    
    // Swap items
    if (targetSlotName === 'ingredient') {
      this.state.ingredient = this.draggedItem;
    } else if (targetSlotName === 'fuel') {
      this.state.fuel = this.draggedItem;
    } else if (targetSlotName.startsWith('bottle')) {
      const index = parseInt(targetSlotName.substring(6), 10);
      this.state.bottles[index] = this.draggedItem;
    } else if (targetSlotName.startsWith('inventory')) {
      const index = parseInt(targetSlotName.substring(9), 10);
      this.game.player.inventory.items[index] = this.draggedItem;
    }
    
    // If dropped on original slot, just update UI and return
    if (targetSlotName === this.draggedSlot) {
      this.updateUI();
      return;
    }
    
    // Put target item in original dragged slot
    if (targetItem) {
      if (this.draggedSlot === 'ingredient') {
        this.state.ingredient = targetItem;
      } else if (this.draggedSlot === 'fuel') {
        this.state.fuel = targetItem;
      } else if (this.draggedSlot.startsWith('bottle')) {
        const index = parseInt(this.draggedSlot.substring(6), 10);
        this.state.bottles[index] = targetItem;
      } else if (this.draggedSlot.startsWith('inventory')) {
        const index = parseInt(this.draggedSlot.substring(9), 10);
        this.game.player.inventory.items[index] = targetItem;
      }
    }
    
    // Send update to server
    this.sendStateUpdate();
    this.updateUI();
  }
  
  /**
   * Send the current state to the server
   */
  sendStateUpdate() {
    if (!this.position) return;
    
    this.game.socket.emit('brewingStandUpdate', {
      position: this.position,
      action: 'updateState',
      state: {
        ingredient: this.state.ingredient,
        bottles: this.state.bottles,
        fuel: this.state.fuel
      }
    });
  }
  
  /**
   * Get the image URL for an item
   * @param {Object} item - The item object
   * @returns {string} URL to the item's image
   */
  getItemImageUrl(item) {
    if (!item) return '';
    
    if (item.type === 'potion') {
      const potionType = item.metadata?.potionType || 'water';
      return `/assets/items/potion_${potionType}.png`;
    }
    
    return `/assets/items/${item.type}.png`;
  }
  
  /**
   * Update the UI to reflect the current state
   */
  updateUI() {
    // Update ingredient slot
    this.updateSlotVisual(this.ingredientSlot, this.state.ingredient);
    
    // Update bottle slots
    for (let i = 0; i < 3; i++) {
      this.updateSlotVisual(this.bottleSlots[i], this.state.bottles[i]);
    }
    
    // Update fuel slot
    this.updateSlotVisual(this.fuelSlot, this.state.fuel);
    
    // Update inventory slots
    for (let i = 0; i < this.inventorySlots.length; i++) {
      const item = this.game.player.inventory.items[i];
      this.updateSlotVisual(this.inventorySlots[i], item);
    }
    
    // Update progress bar
    this.progressBar.style.height = `${this.state.brewingProgress * 100}%`;
    
    // Update fuel bar
    const fuelPercentage = (this.state.fuelLevel / this.state.maxFuel) * 100;
    this.fuelBar.style.height = `${fuelPercentage}%`;
    
    // Add active class if brewing
    if (this.state.isActive) {
      this.apparatus.classList.add('brewing-active');
    } else {
      this.apparatus.classList.remove('brewing-active');
    }
  }
  
  /**
   * Update a slot's visual to show an item
   * @param {HTMLElement} slotElement - The slot element
   * @param {Object} item - The item to display
   */
  updateSlotVisual(slotElement, item) {
    const itemContainer = slotElement.querySelector('.item-container');
    const countDisplay = slotElement.querySelector('.item-count');
    
    // Clear existing content
    itemContainer.innerHTML = '';
    countDisplay.textContent = '';
    
    if (item) {
      // Create and add item image
      const itemImg = document.createElement('img');
      itemImg.src = this.getItemImageUrl(item);
      itemImg.alt = item.type;
      itemContainer.appendChild(itemImg);
      
      // Show count if more than 1
      if (item.count > 1) {
        countDisplay.textContent = item.count;
      }
      
      // Add filled class
      slotElement.classList.add('slot-filled');
    } else {
      // Remove filled class
      slotElement.classList.remove('slot-filled');
    }
  }
  
  /**
   * Show the brewing stand UI
   * @param {Object} position - The position of the brewing stand
   * @param {Object} state - The current state of the brewing stand
   */
  show(position, state) {
    this.visible = true;
    this.position = position;
    
    // Update state with the server data
    if (state) {
      this.state = state;
    }
    
    // Show the container
    this.container.style.display = 'flex';
    
    // Update UI to reflect current state
    this.updateUI();
    
    // Disable player movement
    this.game.controls.enabled = false;
  }
  
  /**
   * Hide the brewing stand UI
   */
  hide() {
    this.visible = false;
    this.container.style.display = 'none';
    
    // Return any dragged item
    if (this.isDragging) {
      this.handleMouseUp();
    }
    
    // Re-enable player movement
    this.game.controls.enabled = true;
    
    // Send close message to server
    if (this.position) {
      this.game.socket.emit('brewingStandUpdate', {
        position: this.position,
        action: 'close'
      });
      
      this.position = null;
    }
  }
  
  /**
   * Handle state updates from the server
   * @param {Object} state - The new state from the server
   */
  handleStateUpdate(state) {
    if (!this.visible) return;
    
    this.state = state;
    this.updateUI();
  }
}

// Export the class
export default BrewingStandUI; 