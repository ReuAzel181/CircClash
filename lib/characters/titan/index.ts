// Titan character implementation
import { Vector, CircleEntity, PhysicsWorld } from '../../physics';
import { BaseCharacter, BaseAbility, BaseAI } from '../baseCharacter';
import { CharacterAbility, ProjectileBehavior } from '../characterInterface';
import { createProjectile, EntityUtils } from '../characterUtils';
import { getCharacterConfigSync } from '../../characterConfig';

// Titan character configuration
const titanConfig = {
  name: 'Iron Titan',
  color: '#78716c',
  bulletColor: '#a8a29e',
  damage: 35,
  projectileSpeed: 280,
  bulletRadius: 3.5,
  firingRate: 800,
  attackRange: 250,
  multiShot: 1,
  spreadAngle: 0,
  grabRange: 120,
  grabDamage: 50,
  grabDuration: 2000,
  ironHandCooldown: 8000,
  armorBonus: 0.3,
  slowResistance: 0.6,
  knockbackResistance: 0.8,
  chargeSpeed: 300,
  chargeDamage: 40,
  chargeStunDuration: 1500,
  groundSlamRadius: 100,
  groundSlamDamage: 45,
  shockwaveSpeed: 200
};

// Iron Cannon Attack - Primary ability
class IronCannonAttack extends BaseAbility {
  constructor() {
    super('titan', titanConfig.firingRate);
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;

    const owner = world.entities.get(entityId) as CircleEntity;
    if (!owner) return;

    // Create heavy iron projectile
    const ironShot = createProjectile(entityId, owner, direction, {
      projectileSpeed: titanConfig.projectileSpeed,
      baseDamage: titanConfig.damage,
      radius: titanConfig.bulletRadius,
      lifetime: 2500,
      piercing: 2,
      visualEffects: {
        color: titanConfig.bulletColor,
        trail: {
          color: titanConfig.bulletColor,
          opacity: 0.9,
          lifetime: 1000
        },
        glow: {
          color: titanConfig.bulletColor,
          strength: 1.2
        }
      }
    });

    // Add titan projectile properties
    ironShot.properties = {
      ...ironShot.properties,
      isIronShot: true,
      knockbackForce: 150,
      armorPiercing: true,
      heavyImpact: true,
      shockwaveOnHit: true
    };

    // Add extra mass for heavy projectile physics
    ironShot.mass = ironShot.mass * 2;

    world.addEntity(ironShot);
    this.lastUsed = Date.now();
  }
}

// Iron Hand - Special ability
class IronHand extends BaseAbility {
  constructor() {
    super('titan', titanConfig.ironHandCooldown);
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;

    const owner = world.entities.get(entityId) as CircleEntity;
    if (!owner) return;

    // Find target within grab range
    const target = this.findGrabTarget(owner, world);
    
    if (target) {
      this.executeGrab(owner, target, world);
    } else {
      // If no target, perform ground slam
      this.executeGroundSlam(owner, world);
    }

    this.lastUsed = Date.now();
  }

  private findGrabTarget(owner: CircleEntity, world: PhysicsWorld): CircleEntity | null {
    let nearestTarget: CircleEntity | null = null;
    let nearestDistance = titanConfig.grabRange;

    for (const entity of world.entities.values()) {
      if (entity.type === 'character' && 
          entity.id !== owner.id && 
          entity.health > 0) {
        
        const distance = Math.sqrt(
          (entity.position.x - owner.position.x) ** 2 + 
          (entity.position.y - owner.position.y) ** 2
        );
        
        if (distance <= nearestDistance) {
          nearestDistance = distance;
          nearestTarget = entity;
        }
      }
    }

    return nearestTarget;
  }

  private executeGrab(owner: CircleEntity, target: CircleEntity, world: PhysicsWorld): void {
    // Create grab effect
    EntityUtils.createEffect({
      position: target.position,
      color: titanConfig.bulletColor,
      radius: 25,
      lifetime: 800
    });

    // Apply grab damage
    target.health -= titanConfig.grabDamage;

    // Stun target
    if (!target.properties) {
      target.properties = {
        visualEffects: {
          color: '#78716c',
          trail: {
            color: '#78716c',
            opacity: 0.5,
            lifetime: 500
          },
          glow: {
            color: '#78716c',
            strength: 0.5
          }
        }
      };
    }
    if (!target.properties) {
      target.properties = {
        visualEffects: {
          color: '#FFFFFF',
          trail: { color: '#FFFFFF', opacity: 0.5, lifetime: 500 },
          glow: { color: '#FFFFFF', strength: 0.5 }
        }
      };
    }
    (target.properties as any).isGrabbed = true;
    (target.properties as any).grabStartTime = Date.now();
    (target.properties as any).grabDuration = titanConfig.grabDuration;
    (target.properties as any).grabberId = owner.id;

    // Pull target towards titan
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    const pullDirection = {
      x: (owner.position.x - target.position.x) / distance,
      y: (owner.position.y - target.position.y) / distance
    };

    target.velocity.x = pullDirection.x * 200;
    target.velocity.y = pullDirection.y * 200;

    // Create iron chains effect
    EntityUtils.createEffect({
      position: {
        x: (owner.position.x + target.position.x) / 2,
        y: (owner.position.y + target.position.y) / 2
      },
      color: titanConfig.bulletColor,
      radius: 15,
      lifetime: titanConfig.grabDuration
    });
  }

  private executeGroundSlam(owner: CircleEntity, world: PhysicsWorld): void {
    // Create ground slam effect
    EntityUtils.createEffect({
      position: owner.position,
      color: titanConfig.bulletColor,
      radius: titanConfig.groundSlamRadius,
      lifetime: 1200
    });

    // Create shockwave
    this.createShockwave(owner, world);

    // Damage all enemies in range
    for (const entity of world.entities.values()) {
      if (entity.type === 'character' && 
          entity.id !== owner.id && 
          entity.health > 0) {
        
        const distance = Math.sqrt(
          (entity.position.x - owner.position.x) ** 2 + 
          (entity.position.y - owner.position.y) ** 2
        );
        
        if (distance <= titanConfig.groundSlamRadius) {
          // Apply damage
          entity.health -= titanConfig.groundSlamDamage;
          
          // Apply knockback
          const knockbackDirection = {
            x: (entity.position.x - owner.position.x) / distance,
            y: (entity.position.y - owner.position.y) / distance
          };
          
          entity.velocity.x = knockbackDirection.x * 180;
          entity.velocity.y = knockbackDirection.y * 180;
          
          // Apply stun
          if (!entity.properties) {
            entity.properties = {
              visualEffects: {
                color: '#FFFFFF',
                trail: { color: '#FFFFFF', opacity: 0.5, lifetime: 500 },
                glow: { color: '#FFFFFF', strength: 0.5 }
              }
            };
          }
          entity.properties.isStunned = true;
          entity.properties.stunStartTime = Date.now();
          entity.properties.stunDuration = titanConfig.chargeStunDuration;
          
          // Create impact effect
          EntityUtils.createEffect({
            position: entity.position,
            color: '#ef4444',
            radius: 18,
            lifetime: 600
          });
        }
      }
    }
  }

  private createShockwave(owner: CircleEntity, world: PhysicsWorld): void {
    // Create expanding shockwave rings
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        EntityUtils.createEffect({
          position: owner.position,
          color: titanConfig.bulletColor,
          radius: 30 + (i * 25),
          lifetime: 800
        });
      }, i * 200);
    }
  }
}

// Titan projectile behavior
const titanProjectileBehavior: ProjectileBehavior = {
  onUpdate: (projectile: CircleEntity, world: PhysicsWorld, deltaTime: number) => {
    if (!projectile.properties?.isIronShot) return;

    // Create heavy projectile trail
    if (Math.random() < 0.8) {
      EntityUtils.createEffect({
        position: {
          x: projectile.position.x + (Math.random() - 0.5) * 6,
          y: projectile.position.y + (Math.random() - 0.5) * 6
        },
        color: titanConfig.bulletColor,
        radius: 2 + Math.random() * 2,
        lifetime: 800
      });
    }

    // Create sparks effect
    if (Math.random() < 0.3) {
      EntityUtils.createEffect({
        position: projectile.position,
        color: '#fbbf24',
        radius: projectile.radius * 1.5,
        lifetime: 400
      });
    }
  },

  onCollision: (projectile: CircleEntity, target: CircleEntity, world: PhysicsWorld) => {
    if (!projectile.properties?.isIronShot) return;
    
    if (target.type === 'character' && target.id !== projectile.ownerId) {
      // Apply heavy damage
      target.health -= projectile.damage;
      
      // Apply knockback
      const distance = Math.sqrt(
        (target.position.x - projectile.position.x) ** 2 + 
        (target.position.y - projectile.position.y) ** 2
      );
      
      if (distance > 0) {
        const knockbackDirection = {
          x: (target.position.x - projectile.position.x) / distance,
          y: (target.position.y - projectile.position.y) / distance
        };
        
        target.velocity.x = knockbackDirection.x * (projectile.properties.knockbackForce ?? 0);
        target.velocity.y = knockbackDirection.y * (projectile.properties.knockbackForce ?? 0);
      }
      
      // Create heavy impact effect
      EntityUtils.createEffect({
        position: target.position,
        color: titanConfig.bulletColor,
        radius: 20,
        lifetime: 600
      });
      
      // Create shockwave on hit
      if (projectile.properties.shockwaveOnHit) {
        createImpactShockwave(target.position, world);
      }
      
      // Create sparks explosion
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        EntityUtils.createEffect({
          position: {
            x: target.position.x + Math.cos(angle) * 15,
            y: target.position.y + Math.sin(angle) * 15
          },
          color: '#fbbf24',
          radius: 3,
          lifetime: 500
        });
      }
    }
  }
};

// Helper function to create impact shockwave
function createImpactShockwave(position: Vector, world: PhysicsWorld): void {
  EntityUtils.createEffect({
    position: position,
    color: titanConfig.bulletColor,
    radius: 25,
    lifetime: 500
  });
  
  // Create ground crack effect
  EntityUtils.createEffect({
    position: position,
    color: '#57534e',
    radius: 12,
    lifetime: 1500
  });
}

// Titan AI implementation
class TitanAI extends BaseAI {
  private lastSpecialUse: number = 0;
  private specialCooldown: number = titanConfig.ironHandCooldown;
  private lastCharge: number = 0;
  private chargeCooldown: number = 5000;
  private isCharging: boolean = false;
  private chargeTarget: CircleEntity | null = null;

  constructor() {
    super();
  }

  findNearestEnemy(owner: CircleEntity, world: PhysicsWorld): CircleEntity | null {
    let nearestEnemy: CircleEntity | null = null;
    let nearestDistance = Infinity;

    for (const entity of world.entities.values()) {
      if (entity.type === 'character' && 
          entity.id !== owner.id && 
          entity.health > 0) {
        
        const distance = Math.sqrt(
          (entity.position.x - owner.position.x) ** 2 + 
          (entity.position.y - owner.position.y) ** 2
        );
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestEnemy = entity;
        }
      }
    }

    return nearestEnemy;
  }

  calculateMovementDirection(owner: CircleEntity, target: CircleEntity): Vector {
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    // Titan prefers close combat
    const optimalDistance = titanConfig.grabRange * 1.2;
    
    if (this.isCharging) {
      // Continue charging towards target
      return {
        x: (target.position.x - owner.position.x) / distance,
        y: (target.position.y - owner.position.y) / distance
      };
    }
    
    if (distance > optimalDistance) {
      // Move closer for grab opportunities
      return {
        x: (target.position.x - owner.position.x) / distance,
        y: (target.position.y - owner.position.y) / distance
      };
    } else if (distance < 60) {
      // Back up slightly to avoid being too close
      return {
        x: (owner.position.x - target.position.x) / distance,
        y: (owner.position.y - target.position.y) / distance
      };
    }
    
    // Hold position for optimal grab range
    return { x: 0, y: 0 };
  }

  calculateAttackDirection(owner: CircleEntity, target: CircleEntity): Vector {
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    // Simple direct aim for heavy projectiles
    return {
      x: (target.position.x - owner.position.x) / distance,
      y: (target.position.y - owner.position.y) / distance
    };
  }

  shouldUseSpecialAbility(owner: CircleEntity, target: CircleEntity): boolean {
    const currentTime = Date.now();
    if (currentTime - this.lastSpecialUse < this.specialCooldown) {
      return false;
    }

    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    // Use Iron Hand when target is in grab range or for ground slam
    return distance <= titanConfig.grabRange * 1.5;
  }

  shouldCharge(owner: CircleEntity, target: CircleEntity): boolean {
    const currentTime = Date.now();
    if (currentTime - this.lastCharge < this.chargeCooldown) {
      return false;
    }

    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    // Charge when target is at medium range
    return distance > 150 && distance < 300;
  }

  executeCharge(owner: CircleEntity, target: CircleEntity, world: PhysicsWorld): void {
    this.isCharging = true;
    this.chargeTarget = target;
    this.lastCharge = Date.now();
    
    // Set charge properties
    if (!owner.properties) {
      owner.properties = {
        visualEffects: {
          color: '#FFFFFF',
          trail: { color: '#FFFFFF', opacity: 0.5, lifetime: 500 },
          glow: { color: '#FFFFFF', strength: 0.5 }
        }
      };
    }
    owner.properties.isCharging = true;
    owner.properties.chargeStartTime = Date.now();
    owner.properties.chargeDuration = 2000;
    owner.properties.chargeSpeed = titanConfig.chargeSpeed;
    
    // Create charge effect
    EntityUtils.createEffect({
      position: owner.position,
      color: titanConfig.bulletColor,
      radius: 30,
      lifetime: 600
    });
    
    // Stop charging after duration
    setTimeout(() => {
      this.isCharging = false;
      this.chargeTarget = null;
      if (owner.properties) {
        owner.properties.isCharging = false;
      }
    }, 2000);
  }

  useSpecialAbility(owner: CircleEntity, target: CircleEntity, world: PhysicsWorld): void {
    const titan = world.entities.get(owner.id) as any;
    if (titan?.specialAbility) {
      const direction = this.calculateAttackDirection(owner, target);
      titan.specialAbility.execute(owner, direction, world);
      this.lastSpecialUse = Date.now();
    }
  }
}

// Main Titan character class
export class Titan extends BaseCharacter {
  private ai: TitanAI;

  constructor() {
    super('titan');
    
    // Initialize abilities
    this.primaryAttack = new IronCannonAttack();
    this.specialAbility = new IronHand();
    this.ai = new TitanAI();
    
    // Register projectile behavior
    this.projectileBehaviors['titan'] = titanProjectileBehavior;
  }

  onUpdate(owner: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    const target = this.ai.findNearestEnemy(owner, world);
    
    // Update grab effects
    this.updateGrabEffects(owner, world, deltaTime);
    
    // Update charge effects
    this.updateChargeEffects(owner, world, deltaTime);
    
    if (!target) return;
    
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    // Charge ability
    if (this.ai.shouldCharge(owner, target)) {
      this.ai.executeCharge(owner, target, world);
    }
    
    // Movement (slow but steady)
    if (distance > 40) {
      const moveDirection = this.ai.calculateMovementDirection(owner, target);
      let moveSpeed = 100 * (deltaTime / 1000); // Slow movement
      
      // Faster movement when charging
      if (owner.properties?.isCharging) {
        moveSpeed = titanConfig.chargeSpeed * (deltaTime / 1000);
      }
      
      owner.velocity.x = moveDirection.x * moveSpeed;
      owner.velocity.y = moveDirection.y * moveSpeed;
    }
    
    // Attack
    if (distance <= titanConfig.attackRange) {
      if (this.ai.shouldUseSpecialAbility(owner, target)) {
        this.ai.useSpecialAbility(owner, target, world);
      } else if (!this.primaryAttack.isOnCooldown()) {
        const attackDirection = this.ai.calculateAttackDirection(owner, target);
        this.primaryAttack.execute(owner.id, attackDirection, world);
      }
    }
  }

  private updateGrabEffects(owner: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    // Update grabbed targets
    for (const entity of world.entities.values()) {
      if (entity.properties?.isGrabbed && entity.properties.grabberId === owner.id) {
        const currentTime = Date.now();
        const elapsed = currentTime - (entity.properties.grabStartTime ?? currentTime);
        
        // Release grab when duration expires
        if (elapsed > (entity.properties.grabDuration ?? 0)) {
          entity.properties.isGrabbed = false;
          
          // Create release effect
          EntityUtils.createEffect({
            position: entity.position,
            color: titanConfig.bulletColor,
            radius: 20,
            lifetime: 400
          });
          
          return;
        }
        
        // Keep target close to titan
        const distance = Math.sqrt(
          (entity.position.x - owner.position.x) ** 2 + 
          (entity.position.y - owner.position.y) ** 2
        );
        
        if (distance > 80) {
          const pullDirection = {
            x: (owner.position.x - entity.position.x) / distance,
            y: (owner.position.y - entity.position.y) / distance
          };
          
          entity.velocity.x = pullDirection.x * 150;
          entity.velocity.y = pullDirection.y * 150;
        }
        
        // Create grab particle effects
        if (Math.random() < 0.4) {
          EntityUtils.createEffect({
            position: entity.position,
            color: titanConfig.bulletColor,
            radius: 1 + Math.random(),
            lifetime: 300
          });
        }
      }
    }
  }

  private updateChargeEffects(owner: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    if (!owner.properties?.isCharging) return;
    
    const currentTime = Date.now();
    const elapsed = currentTime - (owner.properties.chargeStartTime ?? currentTime);
    
    // End charge when duration expires
    if (elapsed > (owner.properties.chargeDuration ?? 0)) {
      owner.properties.isCharging = false;
      return;
    }
    
    // Create charge particle effects
    if (Math.random() < 0.7) {
      EntityUtils.createEffect({
        position: {
          x: owner.position.x + (Math.random() - 0.5) * owner.radius * 3,
          y: owner.position.y + (Math.random() - 0.5) * owner.radius * 3
        },
        color: titanConfig.bulletColor,
        radius: 2 + Math.random() * 2,
        lifetime: 400
      });
    }
    
    // Check for charge collision damage
    for (const entity of world.entities.values()) {
      if (entity.type === 'character' && 
          entity.id !== owner.id && 
          entity.health > 0) {
        
        const distance = Math.sqrt(
          (entity.position.x - owner.position.x) ** 2 + 
          (entity.position.y - owner.position.y) ** 2
        );
        
        if (distance <= owner.radius + entity.radius + 10) {
          // Apply charge damage
          entity.health -= titanConfig.chargeDamage;
          
          // Apply knockback and stun
          const knockbackDirection = {
            x: (entity.position.x - owner.position.x) / distance,
            y: (entity.position.y - owner.position.y) / distance
          };
          
          entity.velocity.x = knockbackDirection.x * 200;
          entity.velocity.y = knockbackDirection.y * 200;
          
          // Apply stun
          if (!entity.properties) {
            entity.properties = {
              visualEffects: {
                color: '#FFFFFF',
                trail: { color: '#FFFFFF', opacity: 0.5, lifetime: 500 },
                glow: { color: '#FFFFFF', strength: 0.5 }
              }
            };
          }
          entity.properties.isStunned = true;
          entity.properties.stunStartTime = Date.now();
          entity.properties.stunDuration = titanConfig.chargeStunDuration;
          
          // Create charge impact effect
          EntityUtils.createEffect({
            position: entity.position,
            color: '#ef4444',
            radius: 25,
            lifetime: 800
          });
          
          // End charge on impact
          owner.properties.isCharging = false;
        }
      }
    }
  }

  onDamaged(entity: CircleEntity, damageAmount: number, source: CircleEntity | null): void {
    // Reduce damage due to armor
    const reducedDamage = damageAmount * (1 - titanConfig.armorBonus);
    
    // Create armor deflection effect
    EntityUtils.createEffect({
      position: entity.position,
      color: titanConfig.bulletColor,
      radius: 18,
      lifetime: 400
    });
    
    // Create sparks when heavily damaged
    if (reducedDamage > 20) {
      for (let i = 0; i < 4; i++) {
        const angle = Math.random() * Math.PI * 2;
        EntityUtils.createEffect({
          position: {
            x: entity.position.x + Math.cos(angle) * 20,
            y: entity.position.y + Math.sin(angle) * 20
          },
          color: '#fbbf24',
          radius: 2,
          lifetime: 600
        });
      }
    }
  }

  onKill(entity: CircleEntity, target: CircleEntity): void {
    // Create crushing victory effect
    EntityUtils.createEffect({
      position: target.position,
      color: titanConfig.bulletColor,
      radius: 25,
      lifetime: 800
    });
    
    // Create ground impact
    EntityUtils.createEffect({
      position: target.position,
      color: '#57534e',
      radius: 30,
      lifetime: 1500
    });
    
    // Restore some health on kill (titan's resilience)
    const healAmount = Math.min(20, entity.maxHealth - entity.health);
    if (healAmount > 0) {
      entity.health += healAmount;
      
      EntityUtils.createEffect({
        position: entity.position,
        color: '#22c55e',
        radius: 15,
        lifetime: 500
      });
    }
    
    // Create victory roar effect
    EntityUtils.createEffect({
      position: entity.position,
      color: titanConfig.bulletColor,
      radius: 50,
      lifetime: 1200
    });
  }
}

// Export configuration and implementation
export { titanConfig, IronCannonAttack, IronHand, titanProjectileBehavior, TitanAI };
export default Titan;