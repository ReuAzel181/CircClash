// Compiled version of characterFactory.ts for direct execution with Node.js
const defaultCharacter = require('./defaultCharacter');
const vortexCharacter = require('./vortex');
const flameCharacter = require('./flame');
const archerCharacter = require('./archer');

// Cache for character implementations
const characterImplementations = {
  // Pre-load known character implementations
  'vortex': vortexCharacter,
  'flame': flameCharacter,
  'archer': archerCharacter,
  'default': defaultCharacter
};

/**
 * Get character implementation for a specific character type
 * @param characterType The character type to get implementation for
 * @returns The character implementation
 */
function getCharacterImplementation(characterType) {
  // Return from cache if available
  if (characterImplementations[characterType]) {
    return characterImplementations[characterType];
  }
  
  // Try to load character implementation
  try {
    // This would be dynamic in a real implementation
    // For now, we'll just return the default character
    console.warn(`No implementation found for character type: ${characterType}, using default`);
    const implementation = defaultCharacter;
    
    // Cache the implementation
    characterImplementations[characterType] = implementation;
    
    return implementation;
  } catch (error) {
    console.error(`Failed to load character implementation for ${characterType}:`, error);
    return defaultCharacter;
  }
}

/**
 * Get all available character implementations
 * @returns Record of all character implementations
 */
function getAllCharacterImplementations() {
  return characterImplementations;
}

module.exports = {
  getCharacterImplementation,
  getAllCharacterImplementations
};