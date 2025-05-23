const { TestBase } = require('./testBase');
const blockStateManager = require('../systems/blockStateManager');

class BlockStateManagerTest extends TestBase {
  constructor() {
    super('BlockStateManagerTest');
  }

  runTests() {
    this.testStateRegistration();
    this.testTransitionRegistration();
    this.testStateRetrieval();
    this.testTransitionValidation();
    this.testBlockStateUpdate();
    this.testErrorHandling();
  }

  testStateRegistration() {
    const blockType = 'test_block';
    const state = {
      id: 'default',
      properties: { powered: false }
    };

    blockStateManager.registerState(blockType, state);
    const registeredState = blockStateManager.getState(blockType, 'default');
    this.assert(registeredState.id === state.id, 'State ID should match');
    this.assert(registeredState.properties.powered === state.properties.powered, 'State properties should match');
  }

  testTransitionRegistration() {
    const blockType = 'test_block';
    const fromState = 'default';
    const toState = 'powered';
    const condition = (context) => context.powered;

    blockStateManager.registerTransition(blockType, fromState, toState, condition);
    const canTransition = blockStateManager.canTransition(blockType, fromState, toState, { powered: true });
    this.assert(canTransition, 'Should allow transition when condition is met');
  }

  testStateRetrieval() {
    const blockType = 'test_block';
    const states = [
      { id: 'state1', properties: { prop1: 'value1' } },
      { id: 'state2', properties: { prop2: 'value2' } }
    ];

    states.forEach(state => blockStateManager.registerState(blockType, state));
    const allStates = blockStateManager.getAllStates(blockType);
    this.assert(allStates.length === states.length, 'Should retrieve all registered states');
    this.assert(allStates[0].id === states[0].id, 'First state should match');
    this.assert(allStates[1].id === states[1].id, 'Second state should match');
  }

  testTransitionValidation() {
    const blockType = 'test_block';
    const states = ['default', 'powered', 'broken'];
    const conditions = {
      'default:powered': (ctx) => ctx.powered,
      'powered:broken': (ctx) => ctx.damaged,
      'broken:default': (ctx) => ctx.repaired
    };

    // Register states and transitions
    states.forEach(state => {
      blockStateManager.registerState(blockType, { id: state, properties: {} });
    });

    Object.entries(conditions).forEach(([transition, condition]) => {
      const [from, to] = transition.split(':');
      blockStateManager.registerTransition(blockType, from, to, condition);
    });

    // Test valid transitions
    const context1 = { powered: true, damaged: false, repaired: false };
    const validTransitions1 = blockStateManager.getValidTransitions(blockType, 'default', context1);
    this.assert(validTransitions1.length === 1, 'Should find one valid transition');
    this.assert(validTransitions1[0].id === 'powered', 'Should transition to powered state');

    // Test invalid transitions
    const context2 = { powered: false, damaged: false, repaired: false };
    const validTransitions2 = blockStateManager.getValidTransitions(blockType, 'default', context2);
    this.assert(validTransitions2.length === 0, 'Should find no valid transitions');
  }

  testBlockStateUpdate() {
    const blockType = 'test_block';
    const block = {
      type: blockType,
      state: 'default',
      properties: { powered: false }
    };

    // Register states and transition
    blockStateManager.registerState(blockType, { id: 'default', properties: { powered: false } });
    blockStateManager.registerState(blockType, { id: 'powered', properties: { powered: true } });
    blockStateManager.registerTransition(blockType, 'default', 'powered', (ctx) => ctx.powered);

    // Test state update
    const context = { powered: true };
    const updated = blockStateManager.updateBlockState(block, context);
    this.assert(updated, 'Block state should be updated');
    this.assert(block.state === 'powered', 'Block should transition to powered state');
    this.assert(block.properties.powered === true, 'Block properties should be updated');
  }

  testErrorHandling() {
    // Test getting non-existent state
    const nonExistentState = blockStateManager.getState('non_existent', 'state');
    this.assert(nonExistentState === undefined, 'Should return undefined for non-existent state');

    // Test getting states for non-existent block type
    const nonExistentStates = blockStateManager.getAllStates('non_existent');
    this.assert(nonExistentStates.length === 0, 'Should return empty array for non-existent block type');

    // Test transition for non-existent block type
    const canTransition = blockStateManager.canTransition('non_existent', 'from', 'to', {});
    this.assert(canTransition === false, 'Should return false for non-existent transition');
  }
}

module.exports = BlockStateManagerTest; 