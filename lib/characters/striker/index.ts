// Striker character implementation
import { Vector, CircleEntity, PhysicsWorld, ProjectileEntity } from '../../physics';
import { BaseCharacter, BaseAbility, BaseAI } from '../baseCharacter';
import { CharacterAbility, ProjectileBehavior } from '../characterInterface';
import { createProjectile, EntityUtils } from '../characterUtils';
import { getCharacterConfigSync } from '../../characterConfig';

// Striker character configuration
const strikerConfig = {
  name: 'Lightning Striker',
  color: '#fbbf24',
  bulletColor: '#fbbf24',
  damage: 42,
  projectileSpeed: 455,
  bulletRadius: 3.5,
  firingRate: 1080,
  attackRange: 315,
  multiShot: 1,
  spreadAngle: 0,
  electricField: true,
  fieldRadius: 80,
  fieldDuration: 4000,
  fieldDamage: 8,
  fieldTickRate: 300,
  stunDuration: 1500,
  immobilize: true,
  electricColor: '#e0e7ff',
  chainLightning: true,
  explosiveRadius: 25
};

// Thunder Spear Attack - Primary ability
class ThunderSpearAttack extends BaseAbility {
  constructor() {
    super('striker', strikerConfig.firingRate);
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;

    const owner = world.entities.get(entityId) as CircleEntity;
    if (!owner) return;

    // Create thunder spear projectile
    const spear = createProjectile(entityId, owner, direction, {
      projectileSpeed: strikerConfig.projectileSpeed,
      baseDamage: strikerConfig.damage,
      radius: strikerConfig.bulletRadius,
      lifetime: 2000,
      piercing: 1,
      visualEffects: {
        color: strikerConfig.bulletColor,
        trail: {
          color: strikerConfig.electricColor,
          opacity: 0.8,
          lifetime: 300
        },
        glow: {
          color: strikerConfig.bulletColor,
          strength: 1.0
        }
      }
    });

    // Keep only valid projectile properties
    spear.properties = {
      ...spear.properties,
      explosionRadius: strikerConfig.explosiveRadius
    };

    // Add thunder spear special property
    if (!spear.special) spear.special = [];
    spear.special.push('thunderSpear');

    world.entities.set(spear.id, spear);
    this.lastUsed = Date.now();
  }
}

// Chain Surge - Special ability
class ChainSurge extends BaseAbility {
  constructor() {
    super('striker', 6000); // 6 second cooldown
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;

    const owner = world.entities.get(entityId) as CircleEntity;
    if (!owner) return;

    // Find all enemies within range
    const targets: CircleEntity[] = [];
    const maxRange = 400;
    
    Array.from(world.entities.values()).forEach(entity => {
      if (entity.type === 'player' && entity.id !== owner.id && entity.health > 0) {
        const distance = Math.sqrt(
          (entity.position.x - owner.position.x) ** 2 + 
          (entity.position.y - owner.position.y) ** 2
        );
        
        if (distance <= maxRange) {
          targets.push(entity);
        }
      }
    });

    if (targets.length === 0) return;

    // Create chain lightning effect
    this.createChainLightning(owner, targets, world);
    this.lastUsed = Date.now();
  }

  private createChainLightning(owner: CircleEntity, targets: CircleEntity[], world: PhysicsWorld): void {
    const chainDamage = strikerConfig.damage * 0.8; // Slightly reduced for AoE
    const maxChains = Math.min(targets.length, 5); // Max 5 targets
    
    // Sort targets by distance
    targets.sort((a, b) => {
      const distA = Math.sqrt((a.position.x - owner.position.x) ** 2 + (a.position.y - owner.position.y) ** 2);
      const distB = Math.sqrt((b.position.x - owner.position.x) ** 2 + (b.position.y - owner.position.y) ** 2);
      return distA - distB;
    });

    // Chain between targets
    for (let i = 0; i < maxChains; i++) {
      const target = targets[i];
      
      // Apply damage
      target.health -= chainDamage;
      
      // Apply stun effect
      if (!target.properties) {
        target.properties = {
          visualEffects: {
            color: strikerConfig.electricColor,
            trail: {
              color: strikerConfig.electricColor,
              opacity: 0.5,
              lifetime: 200
            },
            glow: {
              color: strikerConfig.electricColor,
              strength: 0.8
            }
          }
        };
      }
      // Add stun duration tracking
      target.properties.slowDuration = strikerConfig.stunDuration;
      target.properties.slowStartTime = Date.now();
      
      // Create lightning effect
      const lightningEffect = EntityUtils.createEffect({
        position: target.position,
        color: strikerConfig.electricColor,
        radius: 25,
        lifetime: 500
      });
      EntityUtils.addEffectToWorld(lightningEffect, world);
      
      // Create electric field around target
      this.createElectricField(target.position, world);
    }
  }

  private createElectricField(position: Vector, world: PhysicsWorld): void {
    const field: CircleEntity = {
      id: `electric_field_${Date.now()}_${Math.random()}`,
      position: { ...position },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      radius: strikerConfig.fieldRadius,
      mass: 1,
      health: 1,
      maxHealth: 1,
      damage: strikerConfig.fieldDamage,
      restitution: 0,
      friction: 0,
      isStatic: true,
      type: 'hazard' as const,
      ownerId: 'striker_field',
      properties: {
        visualEffects: {
          color: strikerConfig.electricColor,
          trail: {
            color: strikerConfig.electricColor,
            opacity: 0.5,
            lifetime: 200
          },
          glow: {
            color: strikerConfig.electricColor,
            strength: 0.8
          }
        }
      },
      special: ['electricField'],
      lifetime: strikerConfig.fieldDuration
    };

    world.entities.set(field.id, field);
  }
}

// Thunder spear projectile behavior
const thunderSpearBehavior: ProjectileBehavior = {
  onUpdate: (projectile: ProjectileEntity, world: PhysicsWorld, deltaTime: number) => {
    if (!projectile.special?.includes('thunderSpear')) return;

    // Create electric particles along the path
    if (Math.random() < 0.3) {
      const sparkEffect = EntityUtils.createEffect({
        position: projectile.position,
        color: strikerConfig.electricColor,
        radius: 5,
        lifetime: 200
      });
      EntityUtils.addEffectToWorld(sparkEffect, world);
    }
  },

  onCollision: (projectile: ProjectileEntity, target: CircleEntity, world: PhysicsWorld) => {
    if (!projectile.special?.includes('thunderSpear')) return;
    
    if (target.type === 'player' && target.id !== projectile.ownerId) {
      // Apply main damage
      target.health -= projectile.damage;
      
      // Apply stun effect
      if (!target.properties) {
        target.properties = {
          visualEffects: {
            color: '#ffffff',
            trail: { color: '#ffffff', opacity: 0.5, lifetime: 500 },
            glow: { color: '#ffffff', strength: 0.5 }
          }
        };
      }
      // Use existing stun properties from CircleEntity interface
      (target as any).stunned = true;
      (target as any).stunStartTime = Date.now();
      (target as any).stunDuration = strikerConfig.stunDuration;
      
      // Create electric field at impact
      if (strikerConfig.electricField) {
        createElectricField(target.position, world, strikerConfig);
      }
      
      // Chain lightning to nearby enemies
      if (strikerConfig.chainLightning) {
        chainToNearbyEnemies(target, world, projectile);
      }
      
      // Create impact effect
      const impactEffect = EntityUtils.createEffect({
        position: target.position,
        color: strikerConfig.bulletColor,
        radius: projectile.properties.explosionRadius || 25,
        lifetime: 400
      });
      EntityUtils.addEffectToWorld(impactEffect, world);
    }
  }
};

// Helper function to create electric field
function createElectricField(position: Vector, world: PhysicsWorld, properties: any): void {
  const field: CircleEntity = {
    id: `electric_field_${Date.now()}_${Math.random()}`,
    position: { ...position },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    radius: properties.fieldRadius,
    mass: 1,
    health: 1,
    maxHealth: 1,
    damage: properties.fieldDamage,
    restitution: 0,
    friction: 0,
    isStatic: true,
    type: 'hazard' as const,
    ownerId: 'striker_field',
    properties: {
      visualEffects: {
        color: strikerConfig.electricColor,
        trail: {
          color: strikerConfig.electricColor,
          opacity: 0.5,
          lifetime: 200
        },
        glow: {
          color: strikerConfig.electricColor,
          strength: 0.8
        }
      }
    },
    special: ['electricField'],
    lifetime: properties.fieldDuration
  };

  world.entities.set(field.id, field);
}

// Helper function for chain lightning
function chainToNearbyEnemies(origin: CircleEntity, world: PhysicsWorld, projectile: CircleEntity): void {
  const chainRange = 150;
  const chainDamage = projectile.damage * 0.6;
  const maxChains = 3;
  let chainCount = 0;
  
  Array.from(world.entities.values()).forEach(entity => {
    if (chainCount >= maxChains) return;
    if (entity.type === 'player' && 
        entity.id !== projectile.ownerId && 
        entity.id !== origin.id && 
        entity.health > 0) {
      
      const distance = Math.sqrt(
        (entity.position.x - origin.position.x) ** 2 + 
        (entity.position.y - origin.position.y) ** 2
      );
      
      if (distance <= chainRange) {
        // Apply chain damage
        entity.health -= chainDamage;
        chainCount++;
        
        // Create chain effect
        const chainEffect = EntityUtils.createEffect({
          position: entity.position,
          color: strikerConfig.electricColor,
          radius: 15,
          lifetime: 300
        });
        EntityUtils.addEffectToWorld(chainEffect, world);
      }
    }
  });
}

// Striker AI implementation
class StrikerAI extends BaseAI {
  private lastSpecialUse: number = 0;
  private specialCooldown: number = 6000;

  constructor() {
    super();
  }

  findNearestEnemy(owner: CircleEntity, world: PhysicsWorld): CircleEntity | null {
    let nearestEnemy: CircleEntity | null = null;
    let nearestDistance = Infinity;

    Array.from(world.entities.values()).forEach(entity => {
      if (entity.type === 'player' && entity.id !== owner.id && entity.health > 0) {
        const distance = Math.sqrt(
          (entity.position.x - owner.position.x) ** 2 + 
          (entity.position.y - owner.position.y) ** 2
        );
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestEnemy = entity;
        }
      }
    });

    return nearestEnemy;
  }

  calculateMovementDirection(owner: CircleEntity, target: CircleEntity): Vector {
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    // Striker prefers medium-close range
    const optimalDistance = strikerConfig.attackRange * 0.8;
    
    if (distance > optimalDistance + 20) {
      // Move closer aggressively
      return {
        x: (target.position.x - owner.position.x) / distance,
        y: (target.position.y - owner.position.y) / distance
      };
    } else if (distance < optimalDistance - 20) {
      // Move away slightly
      return {
        x: (owner.position.x - target.position.x) / distance * 0.3,
        y: (owner.position.y - target.position.y) / distance * 0.3
      };
    }
    
    // Strafe around target
    const perpendicular = {
      x: -(target.position.y - owner.position.y) / distance,
      y: (target.position.x - owner.position.x) / distance
    };
    
    return perpendicular;
  }

  calculateAttackDirection(owner: CircleEntity, target: CircleEntity): Vector {
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    // Lead target for fast projectiles
    const prediction = {
      x: target.position.x + target.velocity.x * 0.2,
      y: target.position.y + target.velocity.y * 0.2
    };
    
    const predictedDistance = Math.sqrt(
      (prediction.x - owner.position.x) ** 2 + 
      (prediction.y - owner.position.y) ** 2
    );
    
    return {
      x: (prediction.x - owner.position.x) / predictedDistance,
      y: (prediction.y - owner.position.y) / predictedDistance
    };
  }

  shouldUseSpecialAbility(owner: CircleEntity, target: CircleEntity): boolean {
    const currentTime = Date.now();
    if (currentTime - this.lastSpecialUse < this.specialCooldown) {
      return false;
    }

    // Count nearby enemies for chain surge
    let nearbyEnemies = 0;
    const world = owner as any; // Temporary workaround
    
    // Use special when multiple enemies are nearby or target is close
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    return distance <= 300; // Use when target is within chain range
  }

  useSpecialAbility(owner: CircleEntity, target: CircleEntity, world: PhysicsWorld): void {
    const striker = world.entities.get(owner.id) as any;
    if (striker?.specialAbility) {
      const direction = this.calculateAttackDirection(owner, target);
      striker.specialAbility.execute(owner.id, direction, world);
      this.lastSpecialUse = Date.now();
    }
  }
}

// Main Striker character class
export class Striker extends BaseCharacter {
  private ai: StrikerAI;

  constructor() {
    super('striker');
    
    // Initialize abilities
    this.primaryAttack = new ThunderSpearAttack();
    this.specialAbility = new ChainSurge();
    this.ai = new StrikerAI();
    
    // Register projectile behavior
    this.projectileBehaviors['striker'] = thunderSpearBehavior;
  }

  onUpdate(owner: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    const target = this.ai.findNearestEnemy(owner, world);
    
    if (!target) return;
    
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    // Movement (fast and aggressive)
    if (distance > 30) {
      const moveDirection = this.ai.calculateMovementDirection(owner, target);
      const moveSpeed = 180 * (deltaTime / 1000); // Fast movement
      owner.velocity.x = moveDirection.x * moveSpeed;
      owner.velocity.y = moveDirection.y * moveSpeed;
    }
    
    // Attack
    if (distance <= strikerConfig.attackRange) {
      if (this.ai.shouldUseSpecialAbility(owner, target)) {
        this.ai.useSpecialAbility(owner, target, world);
      } else if (!this.primaryAttack.isOnCooldown()) {
        const attackDirection = this.ai.calculateAttackDirection(owner, target);
        this.primaryAttack.execute(owner.id, attackDirection, world);
      }
    }
  }

  onDamaged(owner: CircleEntity, damage: number, source: CircleEntity | null): void {
    // Create electric damage effect - handled by the game engine
    // EntityUtils.createEffect would need world context to add effect
  }

  onKill(owner: CircleEntity, target: CircleEntity): void {
    // Create electric explosion on kill - handled by the game engine
    // EntityUtils.createEffect would need world context to add effect
  }
}

// Export configuration and implementation
export { strikerConfig, ThunderSpearAttack, ChainSurge, thunderSpearBehavior, StrikerAI };
export default Striker;