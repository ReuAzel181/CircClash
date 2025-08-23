// Compiled version of flame.ts for direct execution with Node.js
const { BaseCharacter, BaseAbility } = require('./baseCharacter');
const { getCharacterConfig } = require('../characterConfig');
const { createProjectile } = require('./projectileUtils');

// Flame primary attack implementation
class FlamePrimaryAttack extends BaseAbility {
  constructor(characterType) {
    const config = getCharacterConfig(characterType);
    super(characterType, config.firingRate);
    
    this.spreadAngle = config.spreadAngle || 15;
    this.projectilesPerShot = config.projectilesPerShot || 3;
  }

  execute(entityId, direction, world) {
    const entity = world.entities.get(entityId);
    if (!entity) return;
    
    const config = getCharacterConfig(this.characterType);
    
    // Fire multiple projectiles in a spread pattern
    for (let i = 0; i < this.projectilesPerShot; i++) {
      // Calculate spread angle
      const angleOffset = (i - (this.projectilesPerShot - 1) / 2) * this.spreadAngle;
      const radians = Math.atan2(direction.y, direction.x) + (angleOffset * Math.PI / 180);
      
      // Calculate new direction
      const spreadDirection = {
        x: Math.cos(radians),
        y: Math.sin(radians)
      };
      
      // Create a flame projectile
      const projectile = createProjectile(entityId, entity, spreadDirection, {
        baseDamage: config.damage,
        projectileSpeed: config.projectileSpeed,
        radius: config.bulletRadius,
        characterType: this.characterType,
        isFlame: true,
        burnDuration: config.burnDuration || 3000,
        burnDamage: config.burnDamage || 5,
        burnTickRate: config.burnTickRate || 500
      });
      
      // Add projectile to world
      world.entities.set(projectile.id, projectile);
    }
  }
}

// Flame projectile behavior
const flameProjectileBehavior = {
  onUpdate: (projectile, world, deltaTime) => {
    // Flame projectiles leave a trail of fire
    if (projectile.isFlame && Math.random() < 0.2) {
      // Create a fire particle
      const fireParticle = {
        id: `fire_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        position: { x: projectile.position.x, y: projectile.position.y },
        velocity: { x: 0, y: 0 },
        acceleration: { x: 0, y: 0 },
        radius: projectile.radius * 0.5,
        mass: 0.1,
        health: 1,
        maxHealth: 1,
        damage: projectile.burnDamage || 1,
        restitution: 0,
        friction: 0,
        isStatic: true,
        type: 'fire_particle',
        ownerId: projectile.ownerId,
        lifetime: 1000,
        characterType: projectile.characterType
      };
      
      // Add fire particle to world
      world.entities.set(fireParticle.id, fireParticle);
    }
  },
  
  onCollision: (projectile, target, world) => {
    // Apply damage
    if (target.health) {
      target.health -= projectile.damage;
      
      // Apply burn effect
      if (projectile.isFlame && target.type === 'player') {
        target.burnDuration = projectile.burnDuration || 3000;
        target.burnDamage = projectile.burnDamage || 5;
        target.burnTickRate = projectile.burnTickRate || 500;
        target.lastBurnTick = Date.now();
        target.isBurning = true;
      }
    }
  }
};

// Flame character implementation
class FlameCharacter extends BaseCharacter {
  constructor() {
    super('flame');
    
    // Override with flame implementations
    this.primaryAttack = new FlamePrimaryAttack('flame');
    
    // Set up projectile behaviors
    this.projectileBehaviors = {
      'default': flameProjectileBehavior
    };
  }
  
  // Update method to handle burning entities
  onUpdate(entityId, world, deltaTime) {
    const entity = world.entities.get(entityId);
    if (!entity) return;
    
    // Handle burn effect
    if (entity.isBurning && entity.burnDuration > 0) {
      const now = Date.now();
      
      // Apply burn damage at the specified tick rate
      if (now - (entity.lastBurnTick || 0) >= entity.burnTickRate) {
        entity.health -= entity.burnDamage;
        entity.lastBurnTick = now;
        
        // Create visual effect
        // (In a real game, this would create particles or visual effects)
      }
      
      // Reduce burn duration
      entity.burnDuration -= deltaTime * 1000;
      if (entity.burnDuration <= 0) {
        entity.isBurning = false;
      }
    }
  }
}

// Create and export the flame character
module.exports = new FlameCharacter();