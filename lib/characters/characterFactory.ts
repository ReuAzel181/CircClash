// Character factory implementation
import { CharacterImplementation } from './characterInterface';
import { CharacterConfig } from '../characterConfig';

/**
 * Character factory class for managing character creation and configuration
 */
export class CharacterFactory {
  private configCache: Map<string, CharacterConfig> = new Map();
  private implementationCache: Map<string, CharacterImplementation> = new Map();
  private availableTypes: string[] = [
    'vortex',
    'guardian',
    'striker',
    'mystic',
    'flame',
    'frost',
    'shadow',
    'titan',
    'archer',
    'blade',
    'void',
    'chaos'
  ];

  /**
   * Get character configuration by type
   * @param type Character type identifier
   * @returns Promise of character configuration object
   */
  async getConfig(type: string): Promise<CharacterConfig> {
    if (!this.hasCharacterType(type)) {
      throw new Error(`Character type '${type}' does not exist`);
    }

    // Check cache first
    const cachedConfig = this.configCache.get(type);
    if (cachedConfig) return cachedConfig;

    try {
      // Dynamic import of config
      const configModule = await import(`./${type}/config`);
      const config = configModule[`${type}Config`];
      
      // Cache the config
      this.configCache.set(type, config);
      
      return config;
    } catch (error) {
      console.error(`Failed to load config for character type: ${type}`, error);
      throw new Error(`Character config not found for type: ${type}`);
    }
  }

  /**
   * Get character implementation by type
   * @param type Character type identifier
   * @returns Promise of character implementation object
   */
  async getImplementation(type: string): Promise<CharacterImplementation> {
    if (!this.hasCharacterType(type)) {
      throw new Error(`Character type '${type}' does not exist`);
    }

    // Check cache first
    const cachedImpl = this.implementationCache.get(type);
    if (cachedImpl) return cachedImpl;

    try {
      // Dynamic import of implementation
      const implModule = await import(`./${type}`);
      const CharacterClass = implModule.default;
      
      // Instantiate the character class
      const implementation = new CharacterClass();
      
      // Cache the implementation
      this.implementationCache.set(type, implementation);
      
      return implementation;
    } catch (error) {
      console.error(`Failed to load implementation for character type: ${type}`, error);
      throw new Error(`Character implementation not found for type: ${type}`);
    }
  }

  /**
   * Get all available character types
   * @returns Array of character type identifiers
   */
  getAvailableTypes(): string[] {
    return [...this.availableTypes];
  }

  /**
   * Check if a character type exists
   * @param type Character type to check
   * @returns Boolean indicating if the type exists
   */
  hasCharacterType(type: string): boolean {
    return this.availableTypes.includes(type);
  }

  /**
   * Clear the cache for a specific character type or all types
   * @param type Optional character type to clear cache for
   */
  clearCache(type?: string): void {
    if (type) {
      this.configCache.delete(type);
      this.implementationCache.delete(type);
    } else {
      this.configCache.clear();
      this.implementationCache.clear();
    }
  }
}

// Export singleton instance
export default new CharacterFactory();
