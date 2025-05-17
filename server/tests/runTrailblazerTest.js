/**
 * Trailblazer Test Runner
 * Run tests for the Trailblazer villager profession implementation
 * Part of the Minecraft 1.23 Update
 */

const TrailblazerTest = require('./trailblazerTest');

// Create and run the tests
const tester = new TrailblazerTest();
const results = tester.runTests();

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0); 