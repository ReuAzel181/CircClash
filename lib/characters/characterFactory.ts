// Character factory for loading and managing character implementations
import { CharacterImplementation } from './characterInterface';
import defaultCharacter from './defaultCharacter';
import vortexCharacter from './vortex';
import flameCharacter from './flame';
import archerCharacter from './archer';

// Cache for character implementations
const characterImplementations: Record<string, CharacterImplementation> = {
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
export function getCharacterImplementation(characterType: string): CharacterImplementation {
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
export function getAllCharacterImplementations(): Record<string, CharacterImplementation> {
  return characterImplementations;
}

/**
 * Clear the character implementation cache
 * Useful for testing or hot reloading
 */
export function clearCharacterCache(): void {
  // Clear all keys from the characterImplementations object
  Object.keys(characterImplementations).forEach(key => {
    delete characterImplementations[key];
  });
}