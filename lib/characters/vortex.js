// Compiled version of vortex.ts for direct execution with Node.js
const { BaseCharacter, BaseAbility } = require('./baseCharacter');
const { getCharacterConfig } = require('../characterConfig');
const { createProjectile } = require('./projectileUtils');
const { Vector } = require('../physics');

// Vortex primary attack implementation
class VortexPrimaryAttack extends BaseAbility {
  constructor(characterType) {
    const config = getCharacterConfig(characterType);
    super(characterType, config.firingRate);
    
    this.stacks = 0;
    this.stacksToTrigger = config.stacksToTrigger || 5;
    this.rapidFireCount = config.rapidFireCount || 3;
    this.rapidFireDelay = config.rapidFireDelay || 150;
  }

  execute(entityId, direction, world) {
    const entity = world.entities.get(entityId);
    if (!entity) return;
    
    const config = getCharacterConfig(this.characterType);
    const normalizedDir = Vector.normalize ? Vector.normalize(direction) : direction;
    
    // Increment stacks
    this.stacks++;
    
    // Create a basic projectile
    const projectile = createProjectile(entityId, entity, normalizedDir, {
      baseDamage: config.damage,
      projectileSpeed: config.projectileSpeed,
      radius: config.bulletRadius,
      characterType: this.characterType,
      isVortex: true,
      vortexStopDistance: config.vortexStopDistance || 250
    });
    
    // Add projectile to world
    world.entities.set(projectile.id, projectile);
  }
}

// Vortex projectile behavior
const vortexProjectileBehavior = {
  onUpdate: (projectile, world, deltaTime) => {
    // Check if projectile should transform into a vortex
    if (projectile.isVortex && projectile.distanceTraveled >= projectile.vortexStopDistance) {
      // Transform into vortex
      projectile.isActiveVortex = true;
      projectile.velocity.x = 0;
      projectile.velocity.y = 0;
      projectile.radius = projectile.radius * 2;
      projectile.vortexDuration = projectile.vortexDuration || 3000; // 3 seconds
      projectile.vortexPullStrength = projectile.vortexPullStrength || 100;
      
      // Apply vortex effect to nearby entities
      for (const entity of world.entities.values()) {
        if (entity.id !== projectile.id && entity.id !== projectile.ownerId) {
          // Calculate distance
          const dx = projectile.position.x - entity.position.x;
          const dy = projectile.position.y - entity.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Apply pull force if within range
          if (distance < projectile.radius * 3) {
            const pullStrength = projectile.vortexPullStrength / Math.max(1, distance);
            const direction = {
              x: dx / distance,
              y: dy / distance
            };
            
            // Apply pull force
            entity.velocity.x += direction.x * pullStrength * deltaTime;
            entity.velocity.y += direction.y * pullStrength * deltaTime;
          }
        }
      }
      
      // Reduce duration
      projectile.vortexDuration -= deltaTime * 1000;
      if (projectile.vortexDuration <= 0) {
        // Remove vortex
        world.entities.delete(projectile.id);
      }
    }
  },
  
  onCollision: (projectile, target, world) => {
    // Apply damage
    if (target.health) {
      target.health -= projectile.damage;
    }
    
    // Transform into vortex on collision
    if (projectile.isVortex && !projectile.isActiveVortex) {
      projectile.isActiveVortex = true;
      projectile.velocity.x = 0;
      projectile.velocity.y = 0;
      projectile.radius = projectile.radius * 2;
      projectile.vortexDuration = 3000; // 3 seconds
    }
  }
};

// Vortex character implementation
class VortexCharacter extends BaseCharacter {
  constructor() {
    super('vortex');
    
    // Override with vortex implementations
    this.primaryAttack = new VortexPrimaryAttack('vortex');
    
    // Set up projectile behaviors
    this.projectileBehaviors = {
      'default': vortexProjectileBehavior
    };
  }
}

// Create and export the vortex character
module.exports = new VortexCharacter();