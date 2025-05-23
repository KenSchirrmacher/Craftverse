class BlockStateManager {
  constructor() {
    this.states = new Map();
    this.transitions = new Map();
  }

  registerState(blockType, state) {
    if (!this.states.has(blockType)) {
      this.states.set(blockType, new Map());
    }
    this.states.get(blockType).set(state.id, state);
  }

  registerTransition(blockType, fromState, toState, condition) {
    const key = `${blockType}:${fromState}:${toState}`;
    this.transitions.set(key, condition);
  }

  getState(blockType, stateId) {
    return this.states.get(blockType)?.get(stateId);
  }

  getAllStates(blockType) {
    return Array.from(this.states.get(blockType)?.values() || []);
  }

  canTransition(blockType, fromState, toState, context) {
    const key = `${blockType}:${fromState}:${toState}`;
    const condition = this.transitions.get(key);
    return condition ? condition(context) : false;
  }

  getValidTransitions(blockType, currentState, context) {
    const validTransitions = [];
    const states = this.states.get(blockType);
    if (!states) return validTransitions;

    for (const [stateId, state] of states) {
      if (this.canTransition(blockType, currentState, stateId, context)) {
        validTransitions.push(state);
      }
    }
    return validTransitions;
  }

  updateBlockState(block, context) {
    const validTransitions = this.getValidTransitions(block.type, block.state, context);
    if (validTransitions.length > 0) {
      // Apply the first valid transition
      const newState = validTransitions[0];
      block.state = newState.id;
      block.properties = { ...block.properties, ...newState.properties };
      return true;
    }
    return false;
  }

  clear() {
    this.states.clear();
    this.transitions.clear();
  }
}

// Create singleton instance
const blockStateManager = new BlockStateManager();
module.exports = blockStateManager; 