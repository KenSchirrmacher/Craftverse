/**
 * Client-side handler for brewing stand interactions
 */
import BrewingStandUI from '../ui/brewingStand.js';
import { Socket } from '../network/socket.js';
import { SoundManager } from '../audio/soundManager.js';
import { Inventory } from '../player/inventory.js';

export class BrewingStandHandler {
  /**
   * Create a new brewing stand handler
   * @param {Object} game - Game instance
   */
  constructor(game) {
    this.game = game;
    this.player = game.player;
    this.ui = new BrewingStandUI();
    this.activeBrewingStand = null;
    this.isOpen = false;
    
    // Connect to socket events
    this.setupSocketEvents();
    
    // Play sound effects
    this.sounds = {
      brewStart: 'block.brewing_stand.brew',
      brewComplete: 'block.brewing_stand.brew_complete',
      bubbles: 'block.brewing_stand.bubbles'
    };
    
    // Set up current brewing stand data
    this.currentData = {
      items: {
        ingredient: null,
        fuel: null,
        bottles: [null, null, null]
      },
      brewingTime: 0,
      maxBrewingTime: 400,
      fuelLevel: 0,
      maxFuelLevel: 20
    };
    
    // Set up sound timers
    this.bubblesSoundTimer = null;
  }
  
  /**
   * Set up socket events for brewing stand interaction
   */
  setupSocketEvents() {
    Socket.on('brewing_stand_update', (data) => {
      if (!this.activeBrewingStand || data.id !== this.activeBrewingStand.id) {
        return;
      }
      
      // Check if brewing just started
      const wasActive = this.currentData.brewingTime > 0;
      const isNowActive = data.brewingTime > 0;
      
      if (!wasActive && isNowActive) {
        // Brewing just started
        SoundManager.play(this.sounds.brewStart);
        
        // Start bubbling sound on a loop
        this.startBubblesSound();
      } else if (wasActive && !isNowActive && data.brewingTime === 0) {
        // Brewing just completed
        SoundManager.play(this.sounds.brewComplete);
        
        // Stop bubbling sound
        this.stopBubblesSound();
      }
      
      // Update current data
      this.currentData = {
        items: data.items,
        brewingTime: data.brewingTime,
        maxBrewingTime: data.maxBrewingTime,
        fuelLevel: data.fuelLevel,
        maxFuelLevel: data.maxFuelLevel
      };
      
      // Update UI if open
      if (this.isOpen) {
        this.ui.updateUI(this.currentData);
      }
    });
  }
  
  /**
   * Start playing bubbling sound at intervals
   */
  startBubblesSound() {
    // Clear existing timer if any
    this.stopBubblesSound();
    
    // Start new sound timer
    this.bubblesSoundTimer = setInterval(() => {
      SoundManager.play(this.sounds.bubbles, {
        volume: 0.5,
        pitch: 0.9 + Math.random() * 0.2
      });
    }, 2000); // Play every 2 seconds
  }
  
  /**
   * Stop bubbling sound
   */
  stopBubblesSound() {
    if (this.bubblesSoundTimer) {
      clearInterval(this.bubblesSoundTimer);
      this.bubblesSoundTimer = null;
    }
  }
  
  /**
   * Open the brewing stand UI
   * @param {Object} brewingStand - The brewing stand to interact with
   */
  open(brewingStand) {
    if (this.isOpen) {
      return;
    }
    
    this.activeBrewingStand = brewingStand;
    this.isOpen = true;
    
    // Request current state from server
    Socket.emit('brewing_stand_interaction', {
      id: brewingStand.id,
      action: 'open'
    }, (response) => {
      if (response.success) {
        this.currentData = {
          items: response.items,
          brewingTime: response.brewingTime,
          maxBrewingTime: response.maxBrewingTime,
          fuelLevel: response.fuelLevel,
          maxFuelLevel: response.maxFuelLevel
        };
        
        // Open UI with current data
        this.ui.open(this.currentData);
        
        // Set up UI event listeners
        this.setupUIEvents();
        
        // If brewing is in progress, start sound effects
        if (response.brewingTime > 0) {
          this.startBubblesSound();
        }
      }
    });
  }
  
  /**
   * Close the brewing stand UI
   */
  close() {
    if (!this.isOpen) {
      return;
    }
    
    // Notify server that UI is closed
    if (this.activeBrewingStand) {
      Socket.emit('brewing_stand_interaction', {
        id: this.activeBrewingStand.id,
        action: 'close'
      });
    }
    
    // Stop sound effects
    this.stopBubblesSound();
    
    // Clean up
    this.ui.close();
    this.activeBrewingStand = null;
    this.isOpen = false;
    
    // Remove UI event listeners
    this.removeUIEvents();
  }
  
  /**
   * Set up UI event listeners
   */
  setupUIEvents() {
    // Add click event listeners to slots
    this.ui.onSlotClick = this.handleSlotClick.bind(this);
    this.ui.onClose = this.close.bind(this);
  }
  
  /**
   * Remove UI event listeners
   */
  removeUIEvents() {
    this.ui.onSlotClick = null;
    this.ui.onClose = null;
  }
  
  /**
   * Handle slot click in the UI
   * @param {Object} slot - Slot data (type and index)
   * @param {boolean} isShiftClick - Whether shift is being held
   */
  handleSlotClick(slot, isShiftClick) {
    if (!this.activeBrewingStand || !this.isOpen) {
      return;
    }
    
    // Send interaction to server
    Socket.emit('brewing_stand_interaction', {
      id: this.activeBrewingStand.id,
      action: isShiftClick ? 'shift_click' : 'click',
      slot: slot
    }, (response) => {
      if (response.success) {
        // Update local inventory if held item changed
        if (response.playerHeldItem !== undefined) {
          Inventory.setHeldItem(response.playerHeldItem);
        }
        
        // Update UI if items changed
        if (response.items) {
          this.currentData.items = response.items;
          this.ui.updateUI(this.currentData);
        }
        
        // Update fuel level if changed
        if (response.fuelLevel !== undefined) {
          this.currentData.fuelLevel = response.fuelLevel;
          this.currentData.maxFuelLevel = response.maxFuelLevel;
          this.ui.updateUI(this.currentData);
        }
      }
    });
  }
  
  /**
   * Refresh brewing stand data from server
   */
  refresh() {
    if (!this.activeBrewingStand || !this.isOpen) {
      return;
    }
    
    Socket.emit('brewing_stand_interaction', {
      id: this.activeBrewingStand.id,
      action: 'refresh'
    }, (response) => {
      if (response.success) {
        this.currentData = {
          items: response.items,
          brewingTime: response.brewingTime,
          maxBrewingTime: response.maxBrewingTime,
          fuelLevel: response.fuelLevel,
          maxFuelLevel: response.maxFuelLevel
        };
        
        this.ui.updateUI(this.currentData);
      }
    });
  }
  
  /**
   * Update brewing stand (called on client tick)
   */
  update() {
    if (!this.isOpen) {
      return;
    }
    
    // Update UI with current data
    this.ui.updateUI(this.currentData);
  }
}

export default BrewingStandHandler; 