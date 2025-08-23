// Simple test script for character system
const { getCharacterImplementation, getAllCharacterImplementations } = require('./characterFactory');

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
  
  try {
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
        console.log(`Successfully loaded ${type} character implementation`);
      } catch (error) {
        console.error(`Error loading ${type} character:`, error);
      }
    }
    
    console.log('Character system tests completed successfully!');
  } catch (error) {
    console.error('Error testing character system:', error);
  }
}

testCharacterSystem();