// Default character implementation for fallback
import { Vector, CircleEntity, PhysicsWorld } from '../physics';
import { CharacterImplementation, CharacterAbility, ProjectileBehavior } from './characterInterface';
import { BaseCharacter, BaseAbility } from './baseCharacter';
import { getCharacterConfig } from '../characterConfig';

// Default primary attack implementation
class DefaultPrimaryAttack extends BaseAbility {
  constructor(characterType: string) {
    const config = getCharacterConfig(characterType);
    super(characterType, config.firingRate);
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    // This will be implemented when we extract the fireProjectile function
    // from the game.ts file
    console.log(`Default primary attack for ${this.characterType}`);
  }
}

// Default character implementation
class DefaultCharacter extends BaseCharacter {
  constructor(type: string) {
    super(type);
    
    // Set up default abilities
    this.primaryAttack = new DefaultPrimaryAttack(type);
    
    // Set up default projectile behaviors
    this.projectileBehaviors = {
      'default': {
        onUpdate: (projectile, world, deltaTime) => {
          // Default update behavior
        },
        onCollision: (projectile, target, world) => {
          // Default collision behavior
        },
        onCreation: (projectile, owner) => {
          // Default creation behavior
        }
      }
    };
  }
}

// Factory function to create a default character
export function createDefaultCharacter(type: string): CharacterImplementation {
  return new DefaultCharacter(type);
}

// Export the default character as default export
export default createDefaultCharacter('default');