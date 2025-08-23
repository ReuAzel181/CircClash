// Compiled version of defaultCharacter.ts for direct execution with Node.js
const { BaseCharacter, BaseAbility } = require('./baseCharacter');
const { createProjectile } = require('./projectileUtils');

// Default primary attack implementation
class DefaultPrimaryAttack extends BaseAbility {
  constructor(characterType) {
    const config = require('../characterConfig').getCharacterConfig(characterType);
    super(characterType, config.firingRate);
  }

  execute(entityId, direction, world) {
    const entity = world.entities.get(entityId);
    if (!entity) return;
    
    const config = require('../characterConfig').getCharacterConfig(this.characterType);
    
    // Create a basic projectile
    const projectile = createProjectile(entityId, entity, direction, {
      baseDamage: config.damage,
      projectileSpeed: config.projectileSpeed,
      radius: config.bulletRadius,
      characterType: this.characterType
    });
    
    // Add projectile to world
    world.entities.set(projectile.id, projectile);
  }
}

// Default projectile behavior
const defaultProjectileBehavior = {
  onUpdate: (projectile, world, deltaTime) => {
    // Default update behavior
  },
  
  onCollision: (projectile, target, world) => {
    // Default collision behavior
  },
  
  onCreation: (projectile, owner) => {
    // Default creation behavior
  }
};

// Default character implementation
class DefaultCharacter extends BaseCharacter {
  constructor() {
    super('default');
    
    // Override with default implementations
    this.primaryAttack = new DefaultPrimaryAttack('default');
    
    // Set up projectile behaviors
    this.projectileBehaviors = {
      'default': defaultProjectileBehavior
    };
  }
}

// Create and export the default character
module.exports = new DefaultCharacter();