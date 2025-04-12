/**
 * BrewingStandUI Component
 * Handles the client-side brewing stand interface and interactions
 */
class BrewingStandUI {
  /**
   * Create a new brewing stand UI
   * @param {Object} options - Configuration options
   * @param {Game} options.game - Reference to the game instance
   * @param {NetworkManager} options.networkManager - Reference to the network manager
   * @param {InventoryManager} options.inventoryManager - Reference to the inventory manager
   * @param {ItemRegistry} options.itemRegistry - Reference to the item registry
   */
  constructor(options) {
    this.game = options.game;
    this.networkManager = options.networkManager;
    this.inventoryManager = options.inventoryManager;
    this.itemRegistry = options.itemRegistry;
    
    this.isOpen = false;
    this.brewingStandId = null;
    this.state = null;
    
    // References to UI elements
    this.container = null;
    this.ingredientSlot = null;
    this.bottleSlots = [];
    this.fuelSlot = null;
    this.progressBar = null;
    this.fuelBar = null;
    
    // Drag and drop state
    this.draggedItem = null;
    this.draggedItemElement = null;
    this.dragSource = null;
    
    this.init();
  }
  
  /**
   * Initialize the brewing stand UI
   */
  init() {
    // Create the UI container
    this.container = document.createElement('div');
    this.container.className = 'brewing-stand-container';
    this.container.style.display = 'none';
    document.body.appendChild(this.container);
    
    // Create the brewing stand UI structure
    this.createUI();
    
    // Set up event handlers
    this.setupEventHandlers();
    
    // Set up network event handlers
    this.setupNetworkHandlers();
  }
  
  /**
   * Create the brewing stand UI structure
   */
  createUI() {
    // Title
    const title = document.createElement('div');
    title.className = 'brewing-stand-title';
    title.textContent = 'Brewing Stand';
    this.container.appendChild(title);
    
    // Brewing apparatus
    const apparatus = document.createElement('div');
    apparatus.className = 'brewing-apparatus';
    this.container.appendChild(apparatus);
    
    // Ingredient slot
    const ingredientSlotContainer = document.createElement('div');
    ingredientSlotContainer.className = 'item-slot ingredient-slot';
    apparatus.appendChild(ingredientSlotContainer);
    
    this.ingredientSlot = document.createElement('div');
    this.ingredientSlot.className = 'item-container';
    this.ingredientSlot.dataset.slotType = 'ingredient';
    ingredientSlotContainer.appendChild(this.ingredientSlot);
    
    // Bottle slots
    const bottleSlotContainer = document.createElement('div');
    bottleSlotContainer.className = 'bottle-slots';
    apparatus.appendChild(bottleSlotContainer);
    
    for (let i = 0; i < 3; i++) {
      const bottleSlot = document.createElement('div');
      bottleSlot.className = 'item-slot bottle-slot';
      bottleSlot.dataset.slotIndex = i;
      
      const bottleItem = document.createElement('div');
      bottleItem.className = 'item-container';
      bottleItem.dataset.slotType = 'bottle';
      bottleItem.dataset.slotIndex = i;
      
      bottleSlot.appendChild(bottleItem);
      bottleSlotContainer.appendChild(bottleSlot);
      this.bottleSlots.push(bottleItem);
    }
    
    // Fuel slot
    const fuelSlotContainer = document.createElement('div');
    fuelSlotContainer.className = 'item-slot fuel-slot';
    apparatus.appendChild(fuelSlotContainer);
    
    this.fuelSlot = document.createElement('div');
    this.fuelSlot.className = 'item-container';
    this.fuelSlot.dataset.slotType = 'fuel';
    fuelSlotContainer.appendChild(this.fuelSlot);
    
    // Progress bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    apparatus.appendChild(progressContainer);
    
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'brewing-progress-bar';
    progressContainer.appendChild(this.progressBar);
    
    // Fuel bar
    const fuelContainer = document.createElement('div');
    fuelContainer.className = 'fuel-container';
    apparatus.appendChild(fuelContainer);
    
    this.fuelBar = document.createElement('div');
    this.fuelBar.className = 'fuel-bar';
    fuelContainer.appendChild(this.fuelBar);
    
    // Player inventory
    const inventoryContainer = document.createElement('div');
    inventoryContainer.className = 'player-inventory-container';
    this.container.appendChild(inventoryContainer);
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.textContent = 'X';
    closeButton.addEventListener('click', () => this.close());
    this.container.appendChild(closeButton);
  }
  
  /**
   * Set up event handlers for UI interactions
   */
  setupEventHandlers() {
    // Set up slot click handlers for ingredient slot
    this.ingredientSlot.addEventListener('mousedown', (e) => this.handleSlotMouseDown(e, 'ingredient', -1));
    
    // Set up slot click handlers for bottle slots
    this.bottleSlots.forEach((slot, index) => {
      slot.addEventListener('mousedown', (e) => this.handleSlotMouseDown(e, 'bottle', index));
    });
    
    // Set up slot click handlers for fuel slot
    this.fuelSlot.addEventListener('mousedown', (e) => this.handleSlotMouseDown(e, 'fuel', -1));
    
    // Set up global mouse events for drag and drop
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    
    // Close when clicking outside or pressing escape
    document.addEventListener('mousedown', (e) => {
      if (this.isOpen && !this.container.contains(e.target)) {
        this.close();
      }
    });
    
    document.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') {
        this.close();
      }
    });
  }
  
  /**
   * Set up network event handlers
   */
  setupNetworkHandlers() {
    this.networkManager.on('brewing_stand_state', (data) => {
      this.updateState(data);
    });
  }
  
  /**
   * Open the brewing stand UI
   * @param {string} brewingStandId - ID of the brewing stand to open
   */
  open(brewingStandId) {
    if (this.isOpen) {
      this.close();
    }
    
    this.brewingStandId = brewingStandId;
    this.isOpen = true;
    this.container.style.display = 'flex';
    
    // Request initial state from server
    this.networkManager.send('brewing_stand_interaction', {
      action: 'open',
      brewingStandId: this.brewingStandId
    });
    
    // Center the UI on screen
    this.centerUI();
    
    // Pause game input
    this.game.input.setPaused(true);
  }
  
  /**
   * Close the brewing stand UI
   */
  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    this.container.style.display = 'none';
    this.brewingStandId = null;
    this.state = null;
    
    // Reset UI state
    this.resetDragState();
    
    // Resume game input
    this.game.input.setPaused(false);
  }
  
  /**
   * Center the UI on the screen
   */
  centerUI() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const containerWidth = this.container.offsetWidth;
    const containerHeight = this.container.offsetHeight;
    
    this.container.style.left = `${(windowWidth - containerWidth) / 2}px`;
    this.container.style.top = `${(windowHeight - containerHeight) / 2}px`;
  }
  
  /**
   * Update the brewing stand state and UI
   * @param {Object} state - The brewing stand state from the server
   */
  updateState(state) {
    if (!this.isOpen || state.id !== this.brewingStandId) return;
    
    this.state = state;
    
    // Update ingredient slot
    this.updateSlot(this.ingredientSlot, state.ingredient);
    
    // Update bottle slots
    for (let i = 0; i < this.bottleSlots.length; i++) {
      this.updateSlot(this.bottleSlots[i], state.bottles[i]);
    }
    
    // Update progress bar
    this.progressBar.style.width = `${state.brewingProgress * 100}%`;
    if (state.isActive) {
      this.progressBar.classList.add('active');
    } else {
      this.progressBar.classList.remove('active');
    }
    
    // Update fuel bar
    const fuelPercentage = (state.fuelLevel / state.maxFuelLevel) * 100;
    this.fuelBar.style.height = `${fuelPercentage}%`;
  }
  
  /**
   * Update a slot with an item
   * @param {HTMLElement} slotElement - The slot element to update
   * @param {Object} item - The item data
   */
  updateSlot(slotElement, item) {
    // Clear existing content
    slotElement.innerHTML = '';
    slotElement.classList.remove('filled');
    
    if (!item) return;
    
    // Add filled class
    slotElement.classList.add('filled');
    
    // Create item display
    const itemImage = document.createElement('div');
    itemImage.className = 'item-image';
    
    // Set item image based on item ID
    const imageUrl = this.getItemImageUrl(item);
    itemImage.style.backgroundImage = `url(${imageUrl})`;
    
    slotElement.appendChild(itemImage);
    
    // Add count if stackable and count > 1
    if (item.count > 1) {
      const countElement = document.createElement('div');
      countElement.className = 'item-count';
      countElement.textContent = item.count;
      slotElement.appendChild(countElement);
    }
    
    // Store item data on the element
    slotElement.dataset.itemId = item.id;
    slotElement.dataset.itemCount = item.count;
  }
  
  /**
   * Get the image URL for an item
   * @param {Object} item - The item data
   * @returns {string} The image URL
   */
  getItemImageUrl(item) {
    if (item.type === 'potion') {
      // Handle potion coloring
      const baseUrl = 'assets/items/potion_base.png';
      // In a real implementation, we'd use the potion's color to tint the image
      return baseUrl;
    }
    
    return `assets/items/${item.id}.png`;
  }
  
  /**
   * Handle mouse down on a slot
   * @param {MouseEvent} e - The mouse event
   * @param {string} slotType - The type of slot ('ingredient', 'bottle', 'fuel')
   * @param {number} slotIndex - The index of the slot
   */
  handleSlotMouseDown(e, slotType, slotIndex) {
    if (!this.isOpen) return;
    
    e.preventDefault();
    
    let item = null;
    
    // Get the item from the slot
    switch (slotType) {
      case 'ingredient':
        item = this.state.ingredient;
        break;
        
      case 'bottle':
        if (slotIndex >= 0 && slotIndex < this.state.bottles.length) {
          item = this.state.bottles[slotIndex];
        }
        break;
        
      case 'fuel':
        // Fuel slot is special - we don't show an item, just the fuel level
        return;
    }
    
    // Check if there's an item to drag
    if (!item) {
      // Try to place item from player inventory instead
      this.tryPlaceFromInventory(slotType, slotIndex);
      return;
    }
    
    // Start dragging the item
    this.startDragging(item, slotType, slotIndex);
  }
  
  /**
   * Start dragging an item
   * @param {Object} item - The item to drag
   * @param {string} sourceType - The source slot type
   * @param {number} sourceIndex - The source slot index
   */
  startDragging(item, sourceType, sourceIndex) {
    this.draggedItem = { ...item };
    this.dragSource = { type: sourceType, index: sourceIndex };
    
    // Create visual drag element
    this.draggedItemElement = document.createElement('div');
    this.draggedItemElement.className = 'dragged-item';
    
    const imageUrl = this.getItemImageUrl(item);
    this.draggedItemElement.style.backgroundImage = `url(${imageUrl})`;
    
    if (item.count > 1) {
      const countElement = document.createElement('div');
      countElement.className = 'item-count';
      countElement.textContent = item.count;
      this.draggedItemElement.appendChild(countElement);
    }
    
    document.body.appendChild(this.draggedItemElement);
    
    // Position at mouse position
    this.updateDragPosition({ clientX: event.clientX, clientY: event.clientY });
  }
  
  /**
   * Update the position of the dragged item
   * @param {Object} e - The mouse event or position object
   */
  updateDragPosition(e) {
    if (!this.draggedItemElement) return;
    
    this.draggedItemElement.style.left = `${e.clientX - 16}px`;
    this.draggedItemElement.style.top = `${e.clientY - 16}px`;
  }
  
  /**
   * Handle mouse move for drag and drop
   * @param {MouseEvent} e - The mouse event
   */
  handleMouseMove(e) {
    if (!this.isOpen || !this.draggedItemElement) return;
    
    this.updateDragPosition(e);
  }
  
  /**
   * Handle mouse up to complete drag and drop
   * @param {MouseEvent} e - The mouse event
   */
  handleMouseUp(e) {
    if (!this.isOpen || !this.draggedItemElement) return;
    
    // Find the slot under the mouse
    const elementsUnderMouse = document.elementsFromPoint(e.clientX, e.clientY);
    const slotElement = elementsUnderMouse.find(element => 
      element.classList.contains('item-container'));
    
    if (slotElement) {
      const targetType = slotElement.dataset.slotType;
      const targetIndex = slotElement.dataset.slotIndex !== undefined ? 
        parseInt(slotElement.dataset.slotIndex) : -1;
      
      // If we're dropping on a different slot
      if (targetType !== this.dragSource.type || targetIndex !== this.dragSource.index) {
        this.dropItem(targetType, targetIndex);
      }
    } else {
      // Dropped outside - return to inventory
      this.returnItemToInventory();
    }
    
    // Reset drag state
    this.resetDragState();
  }
  
  /**
   * Reset the drag and drop state
   */
  resetDragState() {
    if (this.draggedItemElement) {
      document.body.removeChild(this.draggedItemElement);
    }
    
    this.draggedItem = null;
    this.draggedItemElement = null;
    this.dragSource = null;
  }
  
  /**
   * Drop an item into a slot
   * @param {string} targetType - The target slot type
   * @param {number} targetIndex - The target slot index
   */
  dropItem(targetType, targetIndex) {
    // Send to server
    this.networkManager.send('brewing_stand_interaction', {
      action: 'place',
      brewingStandId: this.brewingStandId,
      slotType: targetType,
      slotIndex: targetIndex,
      item: this.draggedItem,
      sourceType: this.dragSource.type,
      sourceIndex: this.dragSource.index
    });
    
    // Remove item from source slot in local state
    if (this.dragSource.type === 'ingredient') {
      this.state.ingredient = null;
    } else if (this.dragSource.type === 'bottle' && 
               this.dragSource.index >= 0 && 
               this.dragSource.index < this.state.bottles.length) {
      this.state.bottles[this.dragSource.index] = null;
    }
    
    // Update UI immediately for responsiveness
    // Server will send updated state shortly
    this.updateUI();
  }
  
  /**
   * Return dragged item to player inventory
   */
  returnItemToInventory() {
    // Send to server
    this.networkManager.send('brewing_stand_interaction', {
      action: 'remove',
      brewingStandId: this.brewingStandId,
      slotType: this.dragSource.type,
      slotIndex: this.dragSource.index
    });
    
    // Remove item from source slot in local state
    if (this.dragSource.type === 'ingredient') {
      this.state.ingredient = null;
    } else if (this.dragSource.type === 'bottle' && 
               this.dragSource.index >= 0 && 
               this.dragSource.index < this.state.bottles.length) {
      this.state.bottles[this.dragSource.index] = null;
    }
    
    // Update UI immediately for responsiveness
    this.updateUI();
  }
  
  /**
   * Try to place an item from player inventory into a slot
   * @param {string} slotType - The target slot type
   * @param {number} slotIndex - The target slot index
   */
  tryPlaceFromInventory(slotType, slotIndex) {
    // In a real implementation, this would open the player's inventory
    // and allow them to select an item to place
    
    // For this example, we'll just log the action
    console.log(`Place from inventory to ${slotType} slot ${slotIndex}`);
  }
  
  /**
   * Update the UI to reflect the current state
   */
  updateUI() {
    if (!this.state) return;
    
    // Update ingredient slot
    this.updateSlot(this.ingredientSlot, this.state.ingredient);
    
    // Update bottle slots
    for (let i = 0; i < this.bottleSlots.length; i++) {
      this.updateSlot(this.bottleSlots[i], this.state.bottles[i]);
    }
  }
  
  /**
   * Update the UI at each animation frame
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    if (!this.isOpen || !this.state) return;
    
    // Animate brewing progress if active
    if (this.state.isActive) {
      // In a real implementation, we'd smoothly update the progress bar
      // based on elapsed time since last server update
    }
  }
}

// Export the class
export default BrewingStandUI; 