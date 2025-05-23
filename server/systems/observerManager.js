class ObserverManager {
  constructor() {
    this.observers = new Map();
  }

  createObserver(position) {
    const observer = {
      position,
      facing: 'north',
      lastUpdate: Date.now()
    };
    this.observers.set(position, observer);
    return observer;
  }

  faceBlock(observer, block) {
    observer.facing = this.calculateFacing(observer.position, block.position);
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
    const now = Date.now();
    const timeSinceLastUpdate = now - observer.lastUpdate;
    observer.lastUpdate = now;
    return timeSinceLastUpdate < 1000; // Consider detection if update was within last second
  }
}

module.exports = ObserverManager; 