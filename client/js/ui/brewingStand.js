/**
 * UI component for brewing stand interaction
 */
import { DOMHelper } from '../utils/domHelper.js';
import { ItemRenderer } from '../renderer/itemRenderer.js';

export class BrewingStandUI {
  constructor() {
    this.isOpen = false;
    this.container = null;
    this.ingredientSlot = null;
    this.fuelSlot = null;
    this.bottleSlots = [];
    this.progressBar = null;
    this.fuelBar = null;
    
    // Callback functions
    this.onSlotClick = null;
    this.onClose = null;
    
    // Item renderer for slots
    this.itemRenderer = new ItemRenderer();
  }
  
  /**
   * Create and initialize the UI elements
   */
  createUI() {
    // Create main container
    this.container = DOMHelper.createElement('div', {
      id: 'brewing-stand-ui',
      className: 'ui-container brewing-stand'
    });
    
    // Create header
    const header = DOMHelper.createElement('div', {
      className: 'ui-header'
    });
    
    const title = DOMHelper.createElement('h2', {
      textContent: 'Brewing Stand'
    });
    
    const closeButton = DOMHelper.createElement('button', {
      className: 'close-button',
      textContent: 'X'
    });
    closeButton.addEventListener('click', () => {
      if (this.onClose) this.onClose();
    });
    
    header.appendChild(title);
    header.appendChild(closeButton);
    this.container.appendChild(header);
    
    // Create brewing stand content
    const content = DOMHelper.createElement('div', {
      className: 'brewing-content'
    });
    
    // Create the brewing apparatus graphic
    const brewingApparatus = DOMHelper.createElement('div', {
      className: 'brewing-apparatus'
    });
    
    // Create ingredient slot (top)
    this.ingredientSlot = this.createSlot('ingredient', null);
    brewingApparatus.appendChild(this.ingredientSlot);
    
    // Create progress indicator
    this.progressBar = DOMHelper.createElement('div', {
      className: 'brewing-progress'
    });
    
    const progressFill = DOMHelper.createElement('div', {
      className: 'progress-fill'
    });
    this.progressBar.appendChild(progressFill);
    brewingApparatus.appendChild(this.progressBar);
    
    // Create bottle slots (bottom)
    const bottleContainer = DOMHelper.createElement('div', {
      className: 'bottle-container'
    });
    
    for (let i = 0; i < 3; i++) {
      const bottleSlot = this.createSlot('bottle', i);
      this.bottleSlots.push(bottleSlot);
      bottleContainer.appendChild(bottleSlot);
    }
    
    brewingApparatus.appendChild(bottleContainer);
    
    // Create fuel slot and indicator
    const fuelContainer = DOMHelper.createElement('div', {
      className: 'fuel-container'
    });
    
    this.fuelSlot = this.createSlot('fuel', null);
    
    this.fuelBar = DOMHelper.createElement('div', {
      className: 'fuel-bar'
    });
    
    const fuelFill = DOMHelper.createElement('div', {
      className: 'fuel-fill'
    });
    this.fuelBar.appendChild(fuelFill);
    
    fuelContainer.appendChild(this.fuelSlot);
    fuelContainer.appendChild(this.fuelBar);
    brewingApparatus.appendChild(fuelContainer);
    
    content.appendChild(brewingApparatus);
    this.container.appendChild(content);
    
    // Add to document
    document.body.appendChild(this.container);
    
    // Hide initially
    this.container.style.display = 'none';
  }
  
  /**
   * Create a slot element for items
   * @param {string} type - Slot type (ingredient, fuel, bottle)
   * @param {number|null} index - Index for bottle slots, null for others
   * @returns {HTMLElement} - The created slot element
   */
  createSlot(type, index) {
    const slot = DOMHelper.createElement('div', {
      className: `item-slot ${type}-slot`,
      dataset: {
        type: type,
        index: index !== null ? index.toString() : ''
      }
    });
    
    // Add click event
    slot.addEventListener('click', (event) => {
      if (this.onSlotClick) {
        this.onSlotClick({
          type: type,
          index: index
        }, event.shiftKey);
      }
    });
    
    // Create item container
    const itemContainer = DOMHelper.createElement('div', {
      className: 'item-container'
    });
    slot.appendChild(itemContainer);
    
    return slot;
  }
  
  /**
   * Open the brewing stand UI with initial data
   * @param {Object} data - Brewing stand data
   */
  open(data) {
    if (!this.container) {
      this.createUI();
    }
    
    this.isOpen = true;
    this.container.style.display = 'flex';
    
    // Update UI with initial data
    this.updateUI(data);
    
    // Add keyboard event for escape key
    document.addEventListener('keydown', this.handleKeyDown);
  }
  
  /**
   * Close the brewing stand UI
   */
  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    
    if (this.container) {
      this.container.style.display = 'none';
    }
    
    // Remove keyboard event listener
    document.removeEventListener('keydown', this.handleKeyDown);
  }
  
  /**
   * Handle keyboard events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown = (event) => {
    if (event.key === 'Escape' && this.isOpen) {
      if (this.onClose) this.onClose();
    }
  }
  
  /**
   * Update the UI with brewing stand data
   * @param {Object} data - Brewing stand data
   */
  updateUI(data) {
    if (!this.isOpen || !this.container) return;
    
    // Update ingredient slot
    this.updateSlot(this.ingredientSlot, data.items.ingredient);
    
    // Update fuel slot
    this.updateSlot(this.fuelSlot, data.items.fuel);
    
    // Update bottle slots
    for (let i = 0; i < this.bottleSlots.length; i++) {
      this.updateSlot(this.bottleSlots[i], data.items.bottles[i]);
    }
    
    // Update brewing progress
    const progressPercentage = data.brewingTime > 0 
      ? ((data.maxBrewingTime - data.brewingTime) / data.maxBrewingTime) * 100
      : 0;
    this.progressBar.querySelector('.progress-fill').style.height = `${progressPercentage}%`;
    
    // Update fuel level
    const fuelPercentage = data.maxFuelLevel > 0 
      ? (data.fuelLevel / data.maxFuelLevel) * 100
      : 0;
    this.fuelBar.querySelector('.fuel-fill').style.height = `${fuelPercentage}%`;
    
    // Add active class to brewing apparatus if brewing
    if (data.brewingTime > 0) {
      this.container.querySelector('.brewing-apparatus').classList.add('active');
    } else {
      this.container.querySelector('.brewing-apparatus').classList.remove('active');
    }
  }
  
  /**
   * Update a slot with item data
   * @param {HTMLElement} slotElement - The slot element
   * @param {Object|null} itemData - Item data or null if empty
   */
  updateSlot(slotElement, itemData) {
    const itemContainer = slotElement.querySelector('.item-container');
    
    // Clear existing content
    itemContainer.innerHTML = '';
    
    if (!itemData) {
      slotElement.classList.remove('filled');
      return;
    }
    
    // Add filled class
    slotElement.classList.add('filled');
    
    // Render item
    const itemElement = this.itemRenderer.renderItem(itemData);
    itemContainer.appendChild(itemElement);
    
    // Add quantity if more than 1
    if (itemData.count && itemData.count > 1) {
      const quantityElement = DOMHelper.createElement('span', {
        className: 'item-quantity',
        textContent: itemData.count.toString()
      });
      itemContainer.appendChild(quantityElement);
    }
    
    // Add tooltip with item name
    slotElement.title = itemData.name || '';
  }
  
  /**
   * Destroy the UI and clean up resources
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    this.container = null;
    this.ingredientSlot = null;
    this.fuelSlot = null;
    this.bottleSlots = [];
    this.progressBar = null;
    this.fuelBar = null;
    
    document.removeEventListener('keydown', this.handleKeyDown);
    
    this.isOpen = false;
  }
}

export default BrewingStandUI; 