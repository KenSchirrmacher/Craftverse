const events = require('events');

class WorldGenerator extends events.EventEmitter {
  constructor(options = {}) {
    super();
    
    // ... existing initialization code
    
    // When a structure is generated, emit an event
    this.on('structureGenerated', (structure) => {
      console.log(`Structure generated: ${structure.type}`);
    });
  }
  
  // ... existing methods
  
  /**
   * Generate structures in a chunk
   * @param {Object} chunk - Chunk data
   * @param {number} chunkX - Chunk X coordinate
   * @param {number} chunkZ - Chunk Z coordinate
   */
  generateStructures(chunk, chunkX, chunkZ) {
    // ... existing implementation
    
    // When a structure is successfully generated:
    if (structure && structure.type) {
      // Emit the structure generated event
      this.emit('structureGenerated', structure);
    }
    
    return structures;
  }
  
  // ... rest of the class
} 