class PistonManager {
  constructor() {
    this.pushableBlocks = new Set();
    this.pullableBlocks = new Set();
    this.movingBlocks = new Map();
  }

  canPush(block) {
    if (!block) return false;
    
    // Check if block is already being moved
    if (this.movingBlocks.has(block)) return false;
    
    // Check block properties
    if (block.properties && block.properties.pistonBehavior) {
      return block.properties.pistonBehavior === 'pushable' || 
             block.properties.pistonBehavior === 'both';
    }
    
    // Default to true for most blocks
    return true;
  }

  canPull(block) {
    if (!block) return false;
    
    // Check if block is already being moved
    if (this.movingBlocks.has(block)) return false;
    
    // Check block properties
    if (block.properties && block.properties.pistonBehavior) {
      return block.properties.pistonBehavior === 'pullable' || 
             block.properties.pistonBehavior === 'both';
    }
    
    // Default to true for most blocks
    return true;
  }

  push(block, direction, world) {
    if (!this.canPush(block)) {
      return false;
    }

    // Calculate new position
    const newPos = {
      x: block.position.x + direction.x,
      y: block.position.y + direction.y,
      z: block.position.z + direction.z
    };

    // Check if new position is valid
    if (!this.isValidPosition(newPos, world)) {
      return false;
    }

    // Start moving the block
    this.movingBlocks.set(block, {
      direction,
      startTime: Date.now(),
      duration: 200, // 200ms for movement
      startPos: { ...block.position },
      endPos: newPos
    });

    // Update block position in world
    world.moveBlock(block.position, newPos);

    return true;
  }

  pull(block, direction, world) {
    if (!this.canPull(block)) {
      return false;
    }

    // Calculate new position
    const newPos = {
      x: block.position.x + direction.x,
      y: block.position.y + direction.y,
      z: block.position.z + direction.z
    };

    // Check if new position is valid
    if (!this.isValidPosition(newPos, world)) {
      return false;
    }

    // Start moving the block
    this.movingBlocks.set(block, {
      direction,
      startTime: Date.now(),
      duration: 200, // 200ms for movement
      startPos: { ...block.position },
      endPos: newPos
    });

    // Update block position in world
    world.moveBlock(block.position, newPos);

    return true;
  }

  isValidPosition(position, world) {
    // Check if position is within world bounds
    if (!world.isValidPosition(position)) {
      return false;
    }

    // Check if position is empty or contains a replaceable block
    const block = world.getBlock(position.x, position.y, position.z);
    return !block || block.properties.replaceable;
  }

  update() {
    const now = Date.now();
    
    // Update all moving blocks
    for (const [block, data] of this.movingBlocks.entries()) {
      const elapsed = now - data.startTime;
      
      if (elapsed >= data.duration) {
        // Movement complete
        this.movingBlocks.delete(block);
      }
    }
  }
}

module.exports = PistonManager; 