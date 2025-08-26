// Frost character implementation
import { Vector, CircleEntity, PhysicsWorld } from '../../physics';
import { BaseCharacter, BaseAbility, BaseAI } from '../baseCharacter';
import { CharacterAbility, ProjectileBehavior } from '../characterInterface';
import { createProjectile, EntityUtils } from '../characterUtils';
import { getCharacterConfigSync } from '../../characterConfig';

// Frost character configuration
const frostConfig = {
  name: 'Frost Guardian',
  color: '#06b6d4',
  bulletColor: '#67e8f9',
  damage: 16,
  projectileSpeed: 300,
  bulletRadius: 2.8,
  firingRate: 700,
  attackRange: 350,
  multiShot: 1,
  spreadAngle: 0,
  freezeDuration: 2500,
  slowStrength: 0.7,
  iceShardCount: 6,
  barrierHealth: 80,
  barrierDuration: 8000,
  chargeDistance: 200,
  chargeDamage: 30,
  chargeSpeed: 400,
  iceTrailDuration: 3000
};

// Ice Shard Attack - Primary ability
class IceShardAttack extends BaseAbility {
  constructor() {
    super('frost', frostConfig.firingRate);
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;

    const owner = world.entities.get(entityId) as CircleEntity;
    if (!owner) return;

    // Create ice shard projectile
    const iceShard = createProjectile(entityId, owner, direction, {
      projectileSpeed: frostConfig.projectileSpeed,
      baseDamage: frostConfig.damage,
      radius: frostConfig.bulletRadius,
      lifetime: 3000,
      piercing: 1,
      visualEffects: {
        color: frostConfig.bulletColor,
        trail: {
          color: frostConfig.bulletColor,
          opacity: 0.7,
          lifetime: 1000
        },
        glow: {
          color: frostConfig.bulletColor,
          strength: 0.8
        }
      }
    });

    // Add frost projectile properties
    iceShard.properties = {
      ...iceShard.properties,
      isIceShard: true,
      freezeDuration: frostConfig.freezeDuration,
      slowStrength: frostConfig.slowStrength,
      shatterOnImpact: true,
      shardCount: frostConfig.iceShardCount
    };

    world.entities.set(iceShard.id, iceShard);
    this.lastUsed = Date.now();
  }
}

// Ice Charge - Special ability
class IceCharge extends BaseAbility {
  constructor() {
    super('frost', 6000); // 6 second cooldown
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;

    const owner = world.entities.get(entityId) as CircleEntity;
    if (!owner) return;

    // Store original position and velocity
    const startPosition = { ...owner.position };
    const chargeDirection = { ...direction };
    
    // Calculate charge end position
    const endPosition = {
      x: owner.position.x + chargeDirection.x * frostConfig.chargeDistance,
      y: owner.position.y + chargeDirection.y * frostConfig.chargeDistance
    };

    // Create ice barrier at current position
    this.createIceBarrier(startPosition, world, owner.id);
    
    // Perform charge movement
    const chargeDuration = 400; // 0.4 seconds
    const startTime = Date.now();
    
    // Add charge properties to owner
    if (!owner.properties) {
      owner.properties = {
        visualEffects: {
          color: frostConfig.color,
          trail: {
            color: frostConfig.bulletColor,
            opacity: 0.6,
            lifetime: 600
          },
          glow: {
            color: frostConfig.bulletColor,
            strength: 0.8
          }
        }
      };
    }
    owner.properties.isCharging = true;
    owner.properties.chargeStartTime = startTime;
    owner.properties.chargeDuration = chargeDuration;
    owner.properties.chargeDirection = chargeDirection;
    owner.properties.chargeSpeed = frostConfig.chargeSpeed;
    owner.properties.chargeDamage = frostConfig.chargeDamage;
    owner.properties.chargeStartPos = startPosition;
    owner.properties.chargeEndPos = endPosition;
    
    // Create charge effect
    const chargeEffect = EntityUtils.createEffect({
      position: owner.position,
      radius: 25,
      lifetime: chargeDuration,
      color: frostConfig.bulletColor,
      opacity: 0.8,
      glowStrength: 1.0
    });
    world.entities.set(chargeEffect.id, chargeEffect);

    this.lastUsed = Date.now();
  }

  private createIceBarrier(position: Vector, world: PhysicsWorld, ownerId: string): void {
    const barrier = {
      id: `ice_barrier_${Date.now()}`,
      position: { ...position },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      radius: 35,
      mass: 1,
      health: frostConfig.barrierHealth,
      maxHealth: frostConfig.barrierHealth,
      damage: 0,
      restitution: 0,
      friction: 0,
      isStatic: true,
      type: 'hazard' as const,
      ownerId: ownerId,
      properties: {
        visualEffects: {
          color: frostConfig.bulletColor,
          trail: {
            color: frostConfig.bulletColor,
            opacity: 0.6,
            lifetime: 500
          },
          glow: {
            color: frostConfig.bulletColor,
            opacity: 0.8,
            strength: 0.8
          }
        },
        isIceBarrier: true,
        duration: frostConfig.barrierDuration,
        creationTime: Date.now(),
        absorbedDamage: 0,
        reflectChance: 0.3
      }
    };

    world.entities.set(barrier.id, barrier);
    
    // Create barrier visual effect
    const barrierEffect = EntityUtils.createEffect({
      position: position,
      radius: 35,
      lifetime: frostConfig.barrierDuration,
      color: frostConfig.bulletColor,
      opacity: 0.8,
      glowStrength: 0.8
    });
    world.entities.set(barrierEffect.id, barrierEffect);
  }
}

// Frost projectile behavior
const frostProjectileBehavior: ProjectileBehavior = {
  onUpdate: (projectile: CircleEntity, world: PhysicsWorld, deltaTime: number) => {
    if (!projectile.properties?.isIceShard) return;

    // Create ice crystal trail particles
    if (Math.random() < 0.5) {
      const crystalEffect = EntityUtils.createEffect({
        position: {
          x: projectile.position.x + (Math.random() - 0.5) * 8,
          y: projectile.position.y + (Math.random() - 0.5) * 8
        },
        radius: 1 + Math.random() * 2,
        lifetime: 600,
        color: frostConfig.bulletColor,
        opacity: 0.7
      });
      world.entities.set(crystalEffect.id, crystalEffect);
    }

    // Create frost mist effect
    if (Math.random() < 0.2) {
      const mistEffect = EntityUtils.createEffect({
        position: projectile.position,
        radius: projectile.radius * 3,
        lifetime: 400,
        color: '#67e8f9',
        opacity: 0.4
      });
      world.entities.set(mistEffect.id, mistEffect);
    }
  },

  onCollision: (projectile: CircleEntity, target: CircleEntity, world: PhysicsWorld) => {
    if (!projectile.properties?.isIceShard) return;
    
    if (target.type === 'player' && target.id !== projectile.ownerId) {
      // Apply damage
      target.health -= projectile.damage;
      
      // Apply freeze/slow effect
      applyFreezeEffect(target, projectile, world);
      
      // Shatter into smaller ice shards
      if (projectile.properties.shatterOnImpact) {
        createIceShatter(projectile.position, world, projectile);
      }
      
      // Create impact effect
      const impactEffect = EntityUtils.createEffect({
        position: target.position,
        radius: 15,
        lifetime: 500,
        color: frostConfig.bulletColor,
        opacity: 0.8
      });
      world.entities.set(impactEffect.id, impactEffect);
    }
  }

};

// Helper function to apply freeze effect
function applyFreezeEffect(target: CircleEntity, projectile: CircleEntity, world: PhysicsWorld): void {
  if (!target.properties) {
    target.properties = {
      visualEffects: {
        color: '#ffffff',
        trail: {
          color: '#ffffff',
          opacity: 0.5,
          lifetime: 500
        },
        glow: {
          color: '#ffffff',
          strength: 0.5
        }
      }
    };
  }
  
  target.properties.freezeEffect = {
    slowStrength: frostConfig.slowStrength,
    duration: frostConfig.freezeDuration,
    startTime: Date.now()
  };
  
  // Create freeze effect
  const freezeEffect = EntityUtils.createEffect({
    position: target.position,
    radius: 12,
    lifetime: 400,
    color: frostConfig.bulletColor,
    opacity: 0.6,
    glowStrength: 0.8
  });
  world.entities.set(freezeEffect.id, freezeEffect);
}

// Helper function to create ice shatter
function createIceShatter(position: Vector, world: PhysicsWorld, originalProjectile: CircleEntity): void {
  const shardCount = (originalProjectile.properties as any)?.shardCount || frostConfig.iceShardCount;
  
  for (let i = 0; i < shardCount; i++) {
    const angle = (i / shardCount) * Math.PI * 2;
    const direction = {
      x: Math.cos(angle),
      y: Math.sin(angle)
    };
    
    const shard = createProjectile(`ice_shard_${Date.now()}_${i}`, originalProjectile, direction, {
      projectileSpeed: frostConfig.projectileSpeed * 0.6,
      baseDamage: frostConfig.damage * 0.4,
      radius: frostConfig.bulletRadius * 0.7,
      lifetime: 1500,
      piercing: 0,
      visualEffects: {
        color: frostConfig.bulletColor,
        trail: {
          color: frostConfig.bulletColor,
          opacity: 0.5,
          lifetime: 600
        },
        glow: {
          color: frostConfig.bulletColor,
          strength: 0.6
        }
      }
    });
    
    // Override position to shatter location
    shard.position = { ...position };
    
    // Add shard properties
    shard.properties = {
      ...shard.properties,
      isIceShard: true,
      isShatterShard: true,
      freezeDuration: frostConfig.freezeDuration * 0.6,
      slowStrength: frostConfig.slowStrength * 0.8,
      shatterOnImpact: false // Shards don't shatter further
    };
    
    world.entities.set(shard.id, shard);
  }
  
  // Create shatter effect
  const shatterEffect = EntityUtils.createEffect({
    position: position,
    radius: 20,
    lifetime: 600,
    color: frostConfig.bulletColor,
    opacity: 0.8,
    glowStrength: 1.0
  });
  world.entities.set(shatterEffect.id, shatterEffect);
}

// Frost AI implementation
class FrostAI extends BaseAI {
  private lastSpecialUse: number = 0;
  private specialCooldown: number = 6000;
  private defensiveMode: boolean = false;

  constructor() {
    super();
  }

  findNearestEnemy(owner: CircleEntity, world: PhysicsWorld): CircleEntity | null {
    let nearestEnemy: CircleEntity | null = null;
    let nearestDistance = Infinity;

    for (const entity of Array.from(world.entities.values())) {
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
    }

    return nearestEnemy;
  }

  calculateMovementDirection(owner: CircleEntity, target: CircleEntity): Vector {
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    // Frost prefers medium range for optimal ice shard effectiveness
    const optimalDistance = frostConfig.attackRange * 0.8;
    
    // Check if in defensive mode (low health)
    const healthPercentage = owner.health / owner.maxHealth;
    this.defensiveMode = healthPercentage < 0.4;
    
    if (this.defensiveMode) {
      // Defensive positioning - maintain distance
      if (distance < optimalDistance + 50) {
        return {
          x: (owner.position.x - target.position.x) / distance,
          y: (owner.position.y - target.position.y) / distance
        };
      }
    }
    
    if (distance > optimalDistance + 40) {
      // Move closer
      return {
        x: (target.position.x - owner.position.x) / distance,
        y: (target.position.y - owner.position.y) / distance
      };
    } else if (distance < optimalDistance - 40) {
      // Move away to maintain optimal distance
      return {
        x: (owner.position.x - target.position.x) / distance,
        y: (owner.position.y - target.position.y) / distance
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
    
    // Predict target movement for ice shards
    const leadTime = distance / frostConfig.projectileSpeed;
    const prediction = {
      x: target.position.x + target.velocity.x * leadTime * 0.7,
      y: target.position.y + target.velocity.y * leadTime * 0.7
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

    // Use ice charge when health is low, enemy is close, or for aggressive positioning
    const healthPercentage = owner.health / owner.maxHealth;
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    return healthPercentage < 0.5 || distance <= 180 || (distance > 300 && healthPercentage > 0.7);
  }

  useSpecialAbility(owner: CircleEntity, target: CircleEntity, world: PhysicsWorld): void {
    const frost = world.entities.get(owner.id) as any;
    if (frost?.specialAbility) {
      const direction = this.calculateAttackDirection(owner, target);
      frost.specialAbility.execute(owner, direction, world);
      this.lastSpecialUse = Date.now();
    }
  }
}

// Main Frost character class
export class Frost extends BaseCharacter {
  private ai: FrostAI;

  constructor() {
    super('frost');
    
    // Initialize abilities
    this.primaryAttack = new IceShardAttack();
    this.specialAbility = new IceCharge();
    this.ai = new FrostAI();
    
    // Register projectile behavior
    this.projectileBehaviors['frost'] = frostProjectileBehavior;
  }

  onUpdate(owner: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    const target = this.ai.findNearestEnemy(owner, world);
    
    // Update freeze effects on all entities
    this.updateFreezeEffects(world, deltaTime);
    
    // Update ice barriers
    this.updateIceBarriers(world, deltaTime);
    
    // Handle charging movement
    this.handleChargeMovement(owner, world, deltaTime);
    
    if (!target) return;
    
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    // Movement (only if not charging)
    if (!owner.properties?.isCharging && distance > 40) {
      const moveDirection = this.ai.calculateMovementDirection(owner, target);
      const moveSpeed = 120 * (deltaTime / 1000); // Moderate speed
      owner.velocity.x = moveDirection.x * moveSpeed;
      owner.velocity.y = moveDirection.y * moveSpeed;
    }
    
    // Attack
    if (distance <= frostConfig.attackRange && !owner.properties?.isCharging) {
      if (this.ai.shouldUseSpecialAbility(owner, target)) {
        this.ai.useSpecialAbility(owner, target, world);
      } else if (!this.primaryAttack.isOnCooldown()) {
        const attackDirection = this.ai.calculateAttackDirection(owner, target);
        this.primaryAttack.execute(owner.id, attackDirection, world);
      }
    }
  }

  private updateFreezeEffects(world: PhysicsWorld, deltaTime: number): void {
    const currentTime = Date.now();
    
    for (const entity of Array.from(world.entities.values())) {
      if (entity.properties?.freezeEffect) {
        const freeze = entity.properties.freezeEffect;
        const elapsed = currentTime - freeze.startTime;
        
        // Remove expired freeze
        if (elapsed > freeze.duration) {
          delete entity.properties.freezeEffect;
          return;
        }
        
        // Apply slow effect
        const slowMultiplier = 1 - freeze.slowStrength;
        if (entity.velocity) {
          entity.velocity.x *= slowMultiplier;
          entity.velocity.y *= slowMultiplier;
        }
        
        // Create freeze visual effect
        if (Math.random() < 0.1) {
          const freezeEffect = EntityUtils.createEffect({
            position: entity.position,
            radius: 8,
            lifetime: 200,
            color: frostConfig.bulletColor,
            opacity: 0.6,
            glowStrength: 0.8
          });
          world.entities.set(freezeEffect.id, freezeEffect);
        }
      }
    }
  }

  private updateIceBarriers(world: PhysicsWorld, deltaTime: number): void {
    const currentTime = Date.now();
    
    for (const entity of Array.from(world.entities.values())) {
      if ((entity.properties as any)?.isIceBarrier) {
        const age = currentTime - ((entity.properties as any).creationTime || 0);
        const duration = (entity.properties as any).duration || 0;
        
        // Remove expired barriers
        if (age > duration || entity.health <= 0) {
          // Create shatter effect when barrier breaks
          const barrierShatterEffect = EntityUtils.createEffect({
            position: entity.position,
            radius: entity.radius,
            lifetime: 800,
            color: frostConfig.bulletColor,
            opacity: 0.8,
            glowStrength: 1.0
          });
          world.entities.set(barrierShatterEffect.id, barrierShatterEffect);
          
          entity.health = 0;
          return;
        }
        
        // Create barrier particle effects
        if (Math.random() < 0.3) {
          const particleEffect = EntityUtils.createEffect({
            position: {
              x: entity.position.x + (Math.random() - 0.5) * entity.radius,
              y: entity.position.y + (Math.random() - 0.5) * entity.radius
            },
            radius: 1 + Math.random(),
            lifetime: 500,
            color: frostConfig.bulletColor,
            opacity: 0.7,
            glowStrength: 0.5
          });
          world.entities.set(particleEffect.id, particleEffect);
        }
      }
    }
  }

  private handleChargeMovement(owner: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    if (!owner.properties?.isCharging) return;
    
    const currentTime = Date.now();
    const chargeStartTime = owner.properties.chargeStartTime ?? currentTime;
    const chargeDuration = owner.properties.chargeDuration ?? 1000;
    const elapsed = currentTime - chargeStartTime;
    
    if (elapsed >= chargeDuration) {
      // End charge
      owner.properties.isCharging = false;
      owner.velocity.x = 0;
      owner.velocity.y = 0;
      
      // Create charge end effect
      const chargeEndEffect = EntityUtils.createEffect({
        position: owner.position,
        radius: 30,
        lifetime: 500,
        color: frostConfig.bulletColor,
        opacity: 0.8,
        glowStrength: 1.2
      });
      world.entities.set(chargeEndEffect.id, chargeEndEffect);
      
      return;
    }
    
    // Apply charge movement
    const chargeSpeed = (owner.properties.chargeSpeed ?? frostConfig.chargeSpeed) * (deltaTime / 1000);
    const chargeDirection = owner.properties.chargeDirection ?? { x: 1, y: 0 };
    owner.velocity.x = chargeDirection.x * chargeSpeed;
    owner.velocity.y = chargeDirection.y * chargeSpeed;
    
    // Check for collisions during charge
    for (const entity of Array.from(world.entities.values())) {
      if (entity.type === 'player' && 
          entity.id !== owner.id && 
          entity.health > 0) {
        
        const distance = Math.sqrt(
          (entity.position.x - owner.position.x) ** 2 + 
          (entity.position.y - owner.position.y) ** 2
        );
        
        if (distance <= owner.radius + entity.radius + 5) {
          // Apply charge damage
          const chargeDamage = owner.properties.chargeDamage ?? frostConfig.chargeDamage;
          entity.health -= chargeDamage;
          
          // Apply freeze effect directly to entity properties
          if (!entity.properties) {
            entity.properties = {
              visualEffects: {
                color: frostConfig.bulletColor,
                trail: {
                  color: frostConfig.bulletColor,
                  opacity: 0.5,
                  lifetime: 500
                },
                glow: {
                  color: frostConfig.bulletColor,
                  strength: 0.5
                }
              }
            };
          }
          entity.properties.freezeEffect = {
            duration: frostConfig.freezeDuration * 1.5,
            slowStrength: frostConfig.slowStrength,
            startTime: Date.now()
          };
          
          // Apply knockback
          const knockbackForce = 300;
          const knockbackDirection = {
            x: (entity.position.x - owner.position.x) / distance,
            y: (entity.position.y - owner.position.y) / distance
          };
          
          entity.velocity.x += knockbackDirection.x * knockbackForce;
          entity.velocity.y += knockbackDirection.y * knockbackForce;
          
          // Create charge impact effect
          const chargeImpactEffect = EntityUtils.createEffect({
            position: entity.position,
            radius: 20,
            lifetime: 600,
            color: frostConfig.bulletColor,
            opacity: 0.9,
            glowStrength: 1.5
          });
          world.entities.set(chargeImpactEffect.id, chargeImpactEffect);
        }
      }
    }
    
    // Create charge trail effect
    if (Math.random() < 0.7) {
      const trailEffect = EntityUtils.createEffect({
        position: owner.position,
        radius: 8,
        lifetime: frostConfig.iceTrailDuration,
        color: frostConfig.bulletColor,
        opacity: 0.5,
        glowStrength: 0.8
      });
      world.entities.set(trailEffect.id, trailEffect);
    }
  }

  onDamaged(entity: CircleEntity, damageAmount: number, source: CircleEntity | null): void {
    // Note: World-dependent effects moved to onUpdate or other methods
    // that have access to the world parameter
  }

  onKill(owner: CircleEntity, target: CircleEntity): void {
    // Note: World-dependent effects moved to onUpdate or other methods
    // that have access to the world parameter
  }
}

// Export configuration and implementation
export { frostConfig, IceShardAttack, IceCharge, frostProjectileBehavior, FrostAI };
export default Frost;