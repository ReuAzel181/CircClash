// Compiled version of archer.ts for direct execution with Node.js
const { BaseCharacter, BaseAbility } = require('./baseCharacter');
const { getCharacterConfig } = require('../characterConfig');
const { createProjectile } = require('./projectileUtils');

// Archer primary attack implementation
class ArcherPrimaryAttack extends BaseAbility {
  constructor(characterType) {
    const config = getCharacterConfig(characterType);
    super(characterType, config.firingRate);
    
    this.chargeTime = 0;
    this.maxChargeTime = config.maxChargeTime || 1500; // 1.5 seconds max charge
    this.minDamageMultiplier = config.minDamageMultiplier || 1.0;
    this.maxDamageMultiplier = config.maxDamageMultiplier || 3.0;
    this.minSpeedMultiplier = config.minSpeedMultiplier || 1.0;
    this.maxSpeedMultiplier = config.maxSpeedMultiplier || 1.5;
    this.isCharging = false;
  }

  startCharging() {
    this.isCharging = true;
    this.chargeTime = 0;
  }
  
  updateCharge(deltaTime) {
    if (this.isCharging) {
      this.chargeTime += deltaTime * 1000;
      if (this.chargeTime > this.maxChargeTime) {
        this.chargeTime = this.maxChargeTime;
      }
    }
  }
  
  releaseCharge(entityId, direction, world) {
    if (!this.isCharging) return;
    
    // Calculate charge percentage
    const chargePercent = Math.min(1.0, this.chargeTime / this.maxChargeTime);
    
    // Calculate multipliers based on charge
    const damageMultiplier = this.minDamageMultiplier + 
      (this.maxDamageMultiplier - this.minDamageMultiplier) * chargePercent;
    const speedMultiplier = this.minSpeedMultiplier + 
      (this.maxSpeedMultiplier - this.minSpeedMultiplier) * chargePercent;
    
    // Reset charging state
    this.isCharging = false;
    this.chargeTime = 0;
    
    // Execute the attack with multipliers
    this.execute(entityId, direction, world, damageMultiplier, speedMultiplier);
  }

  execute(entityId, direction, world, damageMultiplier = 1.0, speedMultiplier = 1.0) {
    const entity = world.entities.get(entityId);
    if (!entity) return;
    
    const config = getCharacterConfig(this.characterType);
    
    // Create an arrow projectile
    const projectile = createProjectile(entityId, entity, direction, {
      baseDamage: config.damage * damageMultiplier,
      projectileSpeed: config.projectileSpeed * speedMultiplier,
      radius: config.bulletRadius,
      characterType: this.characterType,
      isArrow: true,
      piercing: Math.floor(damageMultiplier), // Higher damage = more piercing
      arrowSize: config.arrowSize || 1.0 + (chargePercent * 0.5) // Bigger arrows when charged
    });
    
    // Add projectile to world
    world.entities.set(projectile.id, projectile);
  }
}

// Archer projectile behavior
const archerProjectileBehavior = {
  onUpdate: (projectile, world, deltaTime) => {
    // Arrows maintain momentum better
    if (projectile.isArrow) {
      // Reduce air friction effect
      const airFriction = world.airFriction || 0.01;
      projectile.velocity.x *= (1 - airFriction * 0.5 * deltaTime);
      projectile.velocity.y *= (1 - airFriction * 0.5 * deltaTime);
    }
  },
  
  onCollision: (projectile, target, world) => {
    // Apply damage
    if (target.health) {
      target.health -= projectile.damage;
    }
    
    // Handle piercing
    if (projectile.isArrow && projectile.piercing > 0) {
      projectile.piercing--;
      // Continue arrow flight with reduced velocity
      projectile.velocity.x *= 0.8;
      projectile.velocity.y *= 0.8;
    } else {
      // Remove projectile if no more piercing
      world.entities.delete(projectile.id);
    }
  }
};

// Archer character implementation
class ArcherCharacter extends BaseCharacter {
  constructor() {
    super('archer');
    
    // Override with archer implementations
    this.primaryAttack = new ArcherPrimaryAttack('archer');
    
    // Set up projectile behaviors
    this.projectileBehaviors = {
      'default': archerProjectileBehavior
    };
  }
  
  // Handle charging mechanic
  onUpdate(entityId, world, deltaTime) {
    // Update charge if charging
    if (this.primaryAttack.isCharging) {
      this.primaryAttack.updateCharge(deltaTime);
    }
  }
}

// Create and export the archer character
module.exports = new ArcherCharacter();