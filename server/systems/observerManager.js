class ObserverManager {
  constructor() {
    this.observers = new Map();
    this.blockStates = new Map();
    this.lastUpdate = Date.now();
  }

  createObserver(position) {
    const observer = {
      position,
      facing: 'north',
      lastUpdate: Date.now(),
      lastState: null,
      detectionRange: 1,
      cooldown: 0
    };
    this.observers.set(this.getPositionKey(position), observer);
    return observer;
  }

  faceBlock(observer, block) {
    if (!observer || !block) return;
    
    const newFacing = this.calculateFacing(observer.position, block.position);
    if (newFacing !== observer.facing) {
      observer.facing = newFacing;
      observer.lastUpdate = Date.now();
      observer.cooldown = 2; // 2 tick cooldown after facing change
    }
  }

  calculateFacing(observerPos, blockPos) {
    const dx = blockPos.x - observerPos.x;
    const dy = blockPos.y - observerPos.y;
    const dz = blockPos.z - observerPos.z;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > Math.abs(dz)) {
      return dx > 0 ? 'east' : 'west';
    } else if (Math.abs(dz) > Math.abs(dy)) {
      return dz > 0 ? 'south' : 'north';
    } else {
      return dy > 0 ? 'up' : 'down';
    }
  }

  checkDetection(observer) {
    if (!observer) return false;
    
    // Debug output
    console.log('[ObserverManager] checkDetection: observer.lastState =', observer.lastState);
    
    // Check cooldown
    if (observer.cooldown > 0) {
      observer.cooldown--;
      return false;
    }
    
    const now = Date.now();
    const timeSinceLastUpdate = now - observer.lastUpdate;
    
    // Get block in front of observer
    const targetPos = this.getTargetPosition(observer);
    const targetBlock = this.getBlockAt(targetPos);
    if (!targetBlock) return false;
    
    // Get current state
    const currentState = this.getBlockState(targetBlock);
    console.log('[ObserverManager] checkDetection: currentState =', currentState);
    
    // Parse states for comparison
    const currentStateObj = JSON.parse(currentState);
    const lastStateObj = observer.lastState ? JSON.parse(observer.lastState) : null;
    
    // Check if state changed
    if (!lastStateObj || 
        !lastStateObj.state || 
        !currentStateObj.state || 
        lastStateObj.state.facing !== currentStateObj.state.facing) {
      console.log('[ObserverManager] DETECTED state change!');
      observer.lastState = currentState;
      observer.lastUpdate = now;
      observer.cooldown = 2; // 2 tick cooldown after detection
      return true;
    }
    
    // Update lastState even if no change detected
    observer.lastState = currentState;
    return false;
  }

  getTargetPosition(observer) {
    const pos = { ...observer.position };
    switch (observer.facing) {
      case 'north': pos.z--; break;
      case 'south': pos.z++; break;
      case 'east': pos.x++; break;
      case 'west': pos.x--; break;
      case 'up': pos.y++; break;
      case 'down': pos.y--; break;
    }
    return pos;
  }

  getBlockAt(position) {
    const key = this.getPositionKey(position);
    return this.blockStates.get(key);
  }

  getBlockState(block) {
    if (!block) return null;
    
    // Create a state hash that includes block type and all relevant properties
    const state = {
      type: block.type,
      properties: { ...block.properties },
      metadata: block.metadata || {},
      state: { ...block.state }
    };
    
    return JSON.stringify(state);
  }

  getPositionKey(position) {
    return `${position.x},${position.y},${position.z}`;
  }

  updateBlockState(block) {
    if (!block || !block.position) return;
    const key = this.getPositionKey(block.position);
    this.blockStates.set(key, block);
    // Debug output
    console.log('[ObserverManager] updateBlockState: set block at', key, 'to', this.getBlockState(block));
    
    // Reset lastState for observers facing this block
    for (const observer of this.observers.values()) {
      const targetPos = this.getTargetPosition(observer);
      if (this.getPositionKey(targetPos) === key) {
        observer.lastState = null;
      }
    }
  }

  update() {
    const now = Date.now();
    this.lastUpdate = now;
    
    // Update all observers
    for (const observer of this.observers.values()) {
      if (observer.cooldown > 0) {
        observer.cooldown--;
      }
    }
  }
}

module.exports = ObserverManager; 