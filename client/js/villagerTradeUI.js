/**
 * Villager Trading UI Manager
 */
class VillagerTradeUI {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.currentVillager = null;
    this.trades = [];
    this.selectedTrade = null;
    
    // Create UI elements
    this.createUIElements();
    
    // Setup event listeners
    this.setupListeners();
  }
  
  /**
   * Create UI elements for trading
   */
  createUIElements() {
    // Main container - initially hidden
    this.container = document.createElement('div');
    this.container.className = 'trade-ui';
    this.container.style.display = 'none';
    document.body.appendChild(this.container);
    
    // Villager info section
    this.villagerInfo = document.createElement('div');
    this.villagerInfo.className = 'villager-info';
    this.container.appendChild(this.villagerInfo);
    
    // Trade list container
    this.tradeList = document.createElement('div');
    this.tradeList.className = 'trade-list';
    this.container.appendChild(this.tradeList);
    
    // Trade details section
    this.tradeDetails = document.createElement('div');
    this.tradeDetails.className = 'trade-details';
    this.container.appendChild(this.tradeDetails);
    
    // Trade button
    this.tradeButton = document.createElement('button');
    this.tradeButton.className = 'trade-button';
    this.tradeButton.textContent = 'Trade';
    this.tradeButton.disabled = true;
    this.container.appendChild(this.tradeButton);
    
    // Close button
    this.closeButton = document.createElement('button');
    this.closeButton.className = 'close-button';
    this.closeButton.textContent = 'X';
    this.container.appendChild(this.closeButton);
  }
  
  /**
   * Setup event listeners
   */
  setupListeners() {
    // Close button
    this.closeButton.addEventListener('click', () => {
      this.close();
    });
    
    // Trade button
    this.tradeButton.addEventListener('click', () => {
      if (this.selectedTrade && this.currentVillager) {
        this.executeTrade(this.selectedTrade.id);
      }
    });
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
    
    // Handle trade results from server
    this.game.socket.on('tradeResult', (result) => {
      if (result.success) {
        // If trade succeeded, refresh trades
        this.refreshTrades();
        
        // Show success message
        if (result.message) {
          this.showMessage(result.message, 'success');
        }
      } else {
        // Show error message
        this.showMessage(result.error || 'Trade failed', 'error');
      }
    });
  }
  
  /**
   * Display a message in the UI
   * @param {string} message - Message to display
   * @param {string} type - Message type (success/error)
   */
  showMessage(message, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    this.container.appendChild(messageElement);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
      }
    }, 3000);
  }
  
  /**
   * Open the trading UI with a specific villager
   * @param {string} villagerId - ID of the villager
   */
  open(villagerId) {
    this.currentVillager = villagerId;
    this.isOpen = true;
    this.container.style.display = 'block';
    
    // Request trades from server
    this.game.socket.emit('villagerTrade', {
      mobId: villagerId,
      action: 'get_trades'
    });
    
    // Center the UI on screen
    this.container.style.left = '50%';
    this.container.style.top = '50%';
    this.container.style.transform = 'translate(-50%, -50%)';
    
    // Disable game controls while trading
    this.game.controls.enabled = false;
  }
  
  /**
   * Close the trading UI
   */
  close() {
    this.isOpen = false;
    this.container.style.display = 'none';
    this.currentVillager = null;
    this.trades = [];
    this.selectedTrade = null;
    
    // Re-enable game controls
    this.game.controls.enabled = true;
  }
  
  /**
   * Update the UI with received trades data
   * @param {Object} data - Trades data from server
   */
  updateTrades(data) {
    this.trades = data.trades || [];
    
    // Update villager info
    const info = data.villagerInfo || {};
    
    // Construct the HTML for villager info including reputation if available
    let infoHTML = `
      <h2>${this.capitalizeFirstLetter(info.profession || 'Villager')}</h2>
      <div class="villager-level">Level: ${info.level || 1}</div>
      <div class="villager-xp">
        <div class="xp-bar">
          <div class="xp-fill" style="width: ${this.calculateXpPercentage(info)}%"></div>
        </div>
        <div class="xp-text">${info.experience || 0}/${info.experienceNeeded || 10}</div>
      </div>
    `;
    
    // Add reputation display if available
    if (data.reputation !== undefined && info.villageId) {
      // Store for later use
      this.villageId = info.villageId;
      this.reputation = data.reputation;
      this.discount = data.discount || 0;
      
      // Add reputation display
      const repClass = data.reputation >= 0 ? 'positive' : 'negative';
      const discountText = data.discount > 0 ? 
        `(${Math.round(data.discount * 100)}% discount)` : '';
      
      infoHTML += `
        <div class="villager-reputation ${repClass}">
          <div class="rep-label">Reputation:</div>
          <div class="rep-value">${data.reputation} ${discountText}</div>
        </div>
      `;
    }
    
    this.villagerInfo.innerHTML = infoHTML;
    
    // Clear trade list
    this.tradeList.innerHTML = '';
    
    // Add trades to list
    this.trades.forEach((trade, index) => {
      const tradeItem = document.createElement('div');
      tradeItem.className = `trade-item ${trade.available ? '' : 'disabled'}`;
      tradeItem.dataset.index = index;
      
      // Display inputs and output
      const inputsHtml = trade.inputItems.map(item => {
        // Calculate discount if applicable
        let displayCount = item.count;
        let discountHtml = '';
        
        if (item.id === 'emerald' && this.discount > 0 && trade.available) {
          const discountedCount = Math.max(1, Math.floor(item.count * (1 - this.discount)));
          if (discountedCount < item.count) {
            displayCount = discountedCount;
            discountHtml = `<span class="discount">${item.count}</span>`;
          }
        }
        
        return `<div class="trade-item-input">
          <img src="assets/items/${item.id}.png" alt="${item.id}">
          <span class="item-count">${displayCount}${discountHtml}</span>
        </div>`;
      }).join('');
      
      const outputHtml = 
        `<div class="trade-item-output">
          <img src="assets/items/${trade.outputItem.id}.png" alt="${trade.outputItem.id}">
          <span class="item-count">${trade.outputItem.count}</span>
        </div>`;
      
      tradeItem.innerHTML = `
        <div class="trade-inputs">${inputsHtml}</div>
        <div class="trade-arrow">→</div>
        <div class="trade-outputs">${outputHtml}</div>
        <div class="trade-uses">${trade.uses || 0}/${trade.maxUses || 12}</div>
      `;
      
      // Add click handler
      tradeItem.addEventListener('click', () => {
        if (trade.available) {
          this.selectTrade(index);
        }
      });
      
      this.tradeList.appendChild(tradeItem);
    });
    
    // Reset selected trade
    this.selectedTrade = null;
    this.tradeButton.disabled = true;
    this.tradeDetails.innerHTML = '<p>Select a trade</p>';
  }
  
  /**
   * Select a trade from the list
   * @param {number} index - Index of the trade
   */
  selectTrade(index) {
    // Update selection in UI
    const items = this.tradeList.querySelectorAll('.trade-item');
    items.forEach(item => item.classList.remove('selected'));
    
    if (items[index]) {
      items[index].classList.add('selected');
    }
    
    // Update selected trade
    this.selectedTrade = this.trades[index];
    
    // Update trade details
    if (this.selectedTrade) {
      // Check if player has required items, accounting for discounts
      const canTrade = this.selectedTrade.inputItems.every(item => {
        const playerHas = this.game.inventory[item.id] || 0;
        
        // Apply discount to emeralds if applicable
        if (item.id === 'emerald' && this.discount > 0) {
          const discountedCount = Math.max(1, Math.floor(item.count * (1 - this.discount)));
          return playerHas >= discountedCount;
        }
        
        return playerHas >= item.count;
      });
      
      // Format input items with discounts applied
      const inputItems = this.selectedTrade.inputItems.map(item => {
        let displayText = `${item.count}x ${this.formatItemName(item.id)}`;
        
        // Apply discount to emeralds if applicable
        if (item.id === 'emerald' && this.discount > 0) {
          const discountedCount = Math.max(1, Math.floor(item.count * (1 - this.discount)));
          if (discountedCount < item.count) {
            displayText = `${discountedCount}x ${this.formatItemName(item.id)} <span class="discount">(was ${item.count})</span>`;
          }
        }
        
        const playerHas = this.game.inventory[item.id] || 0;
        const sufficientClass = (item.id === 'emerald' && this.discount > 0) ?
          (playerHas >= Math.max(1, Math.floor(item.count * (1 - this.discount))) ? 'sufficient' : 'insufficient') :
          (playerHas >= item.count ? 'sufficient' : 'insufficient');
        
        return `<li class="${sufficientClass}">${displayText} - You have: ${playerHas}</li>`;
      }).join('');
      
      // Display trade details
      this.tradeDetails.innerHTML = `
        <h3>Trade Details</h3>
        <div class="trade-requirements">
          <p>Required items:</p>
          <ul>
            ${inputItems}
          </ul>
        </div>
        <div class="trade-reward">
          <p>You will receive:</p>
          <div class="reward-item">
            ${this.selectedTrade.outputItem.count}x ${this.formatItemName(this.selectedTrade.outputItem.id)}
          </div>
        </div>
        <div class="trade-status">
          <p>Uses: ${this.selectedTrade.uses || 0}/${this.selectedTrade.maxUses || 12}</p>
          ${this.selectedTrade.available ? 
            '<span class="available">Available</span>' : 
            '<span class="unavailable">Unavailable</span>'}
        </div>
      `;
      
      // Enable/disable trade button
      this.tradeButton.disabled = !canTrade || !this.selectedTrade.available;
    }
  }
  
  /**
   * Execute a trade with the selected villager
   * @param {string} tradeId - ID of the trade to execute
   */
  executeTrade(tradeId) {
    if (!this.currentVillager) return;
    
    // Send trade request to server
    this.game.socket.emit('villagerTrade', {
      mobId: this.currentVillager,
      action: 'execute_trade',
      tradeId: tradeId
    });
  }
  
  /**
   * Refresh trades from the server
   */
  refreshTrades() {
    if (!this.currentVillager) return;
    
    // Request updated trades from server
    this.game.socket.emit('villagerTrade', {
      mobId: this.currentVillager,
      action: 'get_trades'
    });
  }
  
  /**
   * Calculate XP percentage for the progress bar
   * @param {Object} info - Villager info
   * @returns {number} - Percentage (0-100)
   */
  calculateXpPercentage(info) {
    if (!info || !info.experience || !info.experienceNeeded) return 0;
    return Math.min(100, (info.experience / info.experienceNeeded) * 100);
  }
  
  /**
   * Capitalize first letter of a string
   * @param {string} str - String to capitalize
   * @returns {string} - Capitalized string
   */
  capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  /**
   * Format item ID as a readable name
   * @param {string} itemId - Item ID
   * @returns {string} - Formatted name
   */
  formatItemName(itemId) {
    return itemId
      .split('_')
      .map(word => this.capitalizeFirstLetter(word))
      .join(' ');
  }
}

// Export the class
export default VillagerTradeUI; 