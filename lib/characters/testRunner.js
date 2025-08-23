// Test runner for character system

// Import the test function
const { testCharacterSystem } = require('./test');

// Run the test
console.log('Starting character system test...');
try {
  testCharacterSystem();
  console.log('Test completed successfully!');
} catch (error) {
  console.error('Test failed with error:', error);
}