// Compiled version of test.ts for direct execution with Node.js
const { getCharacterImplementation, getAllCharacterImplementations } = require('./characterFactory');
const { Vector } = require('../physics');

/**
 * Test function to verify character system implementation
 */
function testCharacterSystem() {
  console.log('Testing character system...');
  
  // Create a mock world for testing
  const mockWorld = {
    entities: new Map(),
    gravity: { x: 0, y: 0 },
    airFriction: 0.01,
    timeAccumulator: 0,
    fixedTimeStep: 1/60,
    bounds: { width: 1000, height: 1000 }
  };
  
  // Create a mock entity
  const mockEntity = {
    id: 'test_entity_vortex',
    position: { x: 500, y: 500 },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    radius: 20,
    mass: 100,
    health: 100,
    maxHealth: 100,
    damage: 10,
    restitution: 0.8,
    friction: 0.1,
    isStatic: false,
    type: 'player'
  };
  
  // Add entity to world
  mockWorld.entities.set(mockEntity.id, mockEntity);
  
  // Test loading all character implementations
  console.log('Loading all character implementations...');
  const allCharacters = getAllCharacterImplementations();
  console.log(`Loaded ${Object.keys(allCharacters).length} character implementations`);
  
  // Test each character type
  const characterTypes = ['vortex', 'flame', 'archer', 'default'];
  
  for (const type of characterTypes) {
    console.log(`Testing ${type} character...`);
    try {
      // Get character implementation
      const character = getCharacterImplementation(type);
      
      // Test primary attack
      console.log(`Testing ${type} primary attack...`);
      character.primaryAttack.execute(mockEntity.id, { x: 1, y: 0 }, mockWorld);
      
      // Check if projectiles were created
      const projectiles = Array.from(mockWorld.entities.values())
        .filter(entity => entity.type === 'projectile');
      
      console.log(`${type} created ${projectiles.length} projectiles`);
      
      // Clean up projectiles
      for (const projectile of projectiles) {
        mockWorld.entities.delete(projectile.id);
      }
      
      console.log(`${type} character test passed`);
    } catch (error) {
      console.error(`Error testing ${type} character:`, error);
    }
  }
  
  console.log('Character system test completed');
}

// Export the test function
module.exports = { testCharacterSystem };

// Run the test if this file is executed directly
if (require.main === module) {
  testCharacterSystem();
}