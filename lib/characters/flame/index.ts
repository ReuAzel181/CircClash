// Flame character implementation
import { Vector, CircleEntity, PhysicsWorld } from '../../physics';
import { BaseCharacter, BaseAbility, BaseAI } from '../baseCharacter';
import { CharacterAbility, ProjectileBehavior } from '../characterInterface';
import { createProjectile, EntityUtils } from '../characterUtils';
import { getCharacterConfigSync } from '../../characterConfig';

// Flame character configuration
const flameConfig = {
  name: 'Flame Warrior',
  color: '#ef4444',
  bulletColor: '#f97316',
  damage: 18,
  projectileSpeed: 280,
  bulletRadius: 3,
  firingRate: 600,
  attackRange: 320,
  multiShot: 1,
  spreadAngle: 0,
  explosionRadius: 60,
  explosionDamage: 25,
  burnDuration: 3000,
  burnDamage: 8,
  burstCount: 5,
  burstInterval: 150,
  flameTrailDuration: 1000,
  igniteChance: 0.7
};

// Flame Burst Attack - Primary ability
class FlameBurstAttack extends BaseAbility {
  constructor() {
    super('flame', flameConfig.firingRate);
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;

    const owner = world.entities.get(entityId) as CircleEntity;
    if (!owner) return;

    // Create explosive flame projectile
    const flameProjectile = createProjectile(entityId, owner, direction, {
      projectileSpeed: flameConfig.projectileSpeed,
      baseDamage: flameConfig.damage,
      radius: flameConfig.bulletRadius,
      lifetime: 2500,
      piercing: 0,
      visualEffects: {
        color: flameConfig.bulletColor,
        trail: {
          color: flameConfig.bulletColor,
          opacity: 0.8,
          lifetime: flameConfig.flameTrailDuration
        },
        glow: {
          color: flameConfig.bulletColor,
          strength: 1.0
        }
      }
    });

    // Add flame projectile properties
    flameProjectile.properties = {
      ...flameProjectile.properties,
      isFlameProjectile: true,
      explosionRadius: flameConfig.explosionRadius,
      explosionDamage: flameConfig.explosionDamage,
      burnDuration: flameConfig.burnDuration,
      burnDamage: flameConfig.burnDamage,
      igniteChance: flameConfig.igniteChance,
      hasExploded: false
    };

    world.entities.set(flameProjectile.id, flameProjectile);
    this.lastUsed = Date.now();
  }
}

// Inferno Burst - Special ability
class InfernoBurst extends BaseAbility {
  constructor() {
    super('flame', 8000); // 8 second cooldown
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;

    const owner = world.entities.get(entityId) as CircleEntity;
    if (!owner) return;

    // Create multiple flame bursts in sequence
    for (let i = 0; i < flameConfig.burstCount; i++) {
      setTimeout(() => {
        if (owner.health <= 0) return; // Stop if owner is dead
        
        // Calculate spread directions
        const angleStep = (Math.PI * 2) / 8; // 8 directions
        for (let j = 0; j < 8; j++) {
          const angle = j * angleStep;
          const burstDirection = {
            x: Math.cos(angle),
            y: Math.sin(angle)
          };

          const infernoBurst = createProjectile(entityId, owner, burstDirection, {
            projectileSpeed: flameConfig.projectileSpeed * 1.2,
            baseDamage: flameConfig.damage * 0.8,
            radius: flameConfig.bulletRadius * 1.2,
            lifetime: 2000,
            piercing: 1,
            visualEffects: {
              color: '#dc2626',
              trail: {
                color: '#dc2626',
                opacity: 0.9,
                lifetime: 1200
              },
              glow: {
                color: '#dc2626',
                strength: 1.2
              }
            }
          });

          // Add inferno burst properties
          infernoBurst.properties = {
            ...infernoBurst.properties,
            isInfernoBurst: true,
            explosionRadius: flameConfig.explosionRadius * 1.3,
            explosionDamage: flameConfig.explosionDamage * 1.2,
            burnDuration: flameConfig.burnDuration * 1.5,
            burnDamage: flameConfig.burnDamage * 1.5,
            igniteChance: 1.0, // Always ignites
            hasExploded: false
          };

          world.entities.set(infernoBurst.id, infernoBurst);
        }
        
        // Create burst effect at owner position
        const burstEffect = EntityUtils.createEffect({
          position: owner.position,
          radius: 40,
          lifetime: 600,
          color: '#dc2626'
        });
        EntityUtils.addEffectToWorld(burstEffect, world);
        
      }, i * flameConfig.burstInterval);
    }

    this.lastUsed = Date.now();
  }
}

// Flame projectile behavior
const flameProjectileBehavior: ProjectileBehavior = {
  onUpdate: (projectile: CircleEntity, world: PhysicsWorld, deltaTime: number) => {
    if (!(projectile.properties as any)?.isFlameProjectile && !(projectile.properties as any)?.isInfernoBurst) return;

    // Create flame trail particles
    if (Math.random() < 0.6) {
      const effect = EntityUtils.createEffect({
        position: {
          x: projectile.position.x + (Math.random() - 0.5) * 10,
          y: projectile.position.y + (Math.random() - 0.5) * 10
        },
        radius: 2 + Math.random() * 3,
        lifetime: 400 + Math.random() * 300,
        color: flameConfig.bulletColor
      });
      EntityUtils.addEffectToWorld(effect, world);
    }

    // Heat distortion effect
    if (Math.random() < 0.3) {
      const heatEffect = EntityUtils.createEffect({
        position: projectile.position,
        radius: projectile.radius * 2,
        lifetime: 200,
        color: 'rgba(255, 100, 0, 0.3)'
      });
      EntityUtils.addEffectToWorld(heatEffect, world);
    }
  },

  onCollision: (projectile: CircleEntity, target: CircleEntity, world: PhysicsWorld) => {
    if (!(projectile.properties as any)?.isFlameProjectile && !(projectile.properties as any)?.isInfernoBurst) return;
    
    if (target.type === 'player' && target.id !== projectile.ownerId) {
      // Apply direct damage
      target.health -= projectile.damage;
      
      // Create explosion
      createFlameExplosion(projectile.position, world, projectile);
      
      // Apply burn effect
      applyBurnEffect(target, projectile, world);
    }
  },

  // Note: onDestroy is not supported by ProjectileBehavior interface
  // Explosion on expiry should be handled in the physics system
};

// Helper function to create flame explosion
function createFlameExplosion(position: Vector, world: PhysicsWorld, projectile: CircleEntity): void {
  if ((projectile.properties as any)?.hasExploded) return;
  (projectile.properties as any).hasExploded = true;

  const explosionRadius = (projectile.properties as any)?.explosionRadius;
  const explosionDamage = (projectile.properties as any)?.explosionDamage;
  
  // Create explosion visual effect
  const explosionEffect = EntityUtils.createEffect({
    position: position,
    radius: explosionRadius,
    lifetime: 800,
    color: (projectile.properties as any)?.isInfernoBurst ? '#dc2626' : flameConfig.bulletColor
  });
  EntityUtils.addEffectToWorld(explosionEffect, world);
  
  // Damage entities in explosion radius
  Array.from(world.entities.values()).forEach(entity => {
    if (entity.type === 'player' && 
        entity.id !== projectile.ownerId && 
        entity.health > 0) {
      
      const distance = Math.sqrt(
        (entity.position.x - position.x) ** 2 + 
        (entity.position.y - position.y) ** 2
      );
      
      if (distance <= explosionRadius) {
        // Calculate damage based on distance (closer = more damage)
        const damageMultiplier = Math.max(0.3, 1 - (distance / explosionRadius));
        const finalDamage = explosionDamage * damageMultiplier;
        
        entity.health -= finalDamage;
        
        // Apply burn effect
        applyBurnEffect(entity, projectile, world);
        
        // Apply knockback
        if (distance > 0) {
          const knockbackForce = 200 * damageMultiplier;
          const knockbackDirection = {
            x: (entity.position.x - position.x) / distance,
            y: (entity.position.y - position.y) / distance
          };
          
          entity.velocity.x += knockbackDirection.x * knockbackForce;
          entity.velocity.y += knockbackDirection.y * knockbackForce;
        }
        
        // Create impact effect
        const impactEffect = EntityUtils.createEffect({
          position: entity.position,
          radius: 12,
          lifetime: 400,
          color: '#f97316'
        });
        EntityUtils.addEffectToWorld(impactEffect, world);
      }
    }
  });
  
  // Create lingering fire patches
  for (let i = 0; i < 3; i++) {
    const patchPosition = {
      x: position.x + (Math.random() - 0.5) * explosionRadius,
      y: position.y + (Math.random() - 0.5) * explosionRadius
    };
    
    createFirePatch(patchPosition, world, projectile.ownerId || 'unknown');
  }
}

// Helper function to apply burn effect
function applyBurnEffect(target: CircleEntity, projectile: CircleEntity, world: PhysicsWorld): void {
  if (Math.random() > ((projectile.properties as any)?.igniteChance || 0.7)) return;
  
  if (!target.properties) {
    target.properties = {
      visualEffects: {
        color: '#FFFFFF',
        trail: { color: '#FFFFFF', opacity: 0.5, lifetime: 500 },
        glow: { color: '#FFFFFF', strength: 0.5 }
      }
    };
  }
  
  (target.properties as any).burnEffect = {
    damage: (projectile.properties as any)?.burnDamage || flameConfig.burnDamage,
    duration: (projectile.properties as any)?.burnDuration || flameConfig.burnDuration,
    startTime: Date.now(),
    lastTickTime: Date.now(),
    tickInterval: 500 // Damage every 0.5 seconds
  };
  
  // Create ignite effect
  const igniteEffect = EntityUtils.createEffect({
    position: target.position,
    radius: 8,
    lifetime: 300,
    color: '#f97316'
  });
  EntityUtils.addEffectToWorld(igniteEffect, world);
}

// Helper function to create fire patch
function createFirePatch(position: Vector, world: PhysicsWorld, ownerId: string): void {
  const firePatch: CircleEntity = {
    id: `fire_patch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    position: { ...position },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    radius: 25,
    mass: 1,
    health: 1,
    maxHealth: 1,
    damage: flameConfig.burnDamage,
    restitution: 0,
    friction: 0,
    isStatic: true,
    type: 'hazard' as const,
    ownerId: ownerId,
    properties: {
      visualEffects: {
        color: '#f97316',
        trail: { color: '#f97316', opacity: 0.7, lifetime: 1000 },
        glow: { color: '#f97316', strength: 0.8 }
      },
      isFirePatch: true,
      duration: 5000,
      creationTime: Date.now(),
      lastDamageTime: 0
    } as any
  };

  world.entities.set(firePatch.id, firePatch);
}

// Flame AI implementation
class FlameAI extends BaseAI {
  private lastSpecialUse: number = 0;
  private specialCooldown: number = 8000;
  private aggressionLevel: number = 0.8; // High aggression

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
    
    // Flame prefers close to medium range for maximum explosion effectiveness
    const optimalDistance = flameConfig.attackRange * 0.7;
    
    if (distance > optimalDistance + 30) {
      // Move closer aggressively
      return {
        x: (target.position.x - owner.position.x) / distance,
        y: (target.position.y - owner.position.y) / distance
      };
    } else if (distance < optimalDistance - 50) {
      // Move back slightly to avoid being too close
      return {
        x: (owner.position.x - target.position.x) / distance * 0.5,
        y: (owner.position.y - target.position.y) / distance * 0.5
      };
    }
    
    // Circle strafe for positioning
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
    
    // Lead target slightly for explosive projectiles
    const leadTime = distance / flameConfig.projectileSpeed;
    const prediction = {
      x: target.position.x + target.velocity.x * leadTime * 0.6,
      y: target.position.y + target.velocity.y * leadTime * 0.6
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

    // Use inferno burst when health is low or target is close
    const healthPercentage = owner.health / owner.maxHealth;
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    return healthPercentage < 0.5 || distance <= 150;
  }

  useSpecialAbility(owner: CircleEntity, target: CircleEntity, world: PhysicsWorld): void {
    const flame = Array.from(world.entities.values()).find(e => e.id === owner.id) as any;
    if (flame?.specialAbility) {
      const direction = this.calculateAttackDirection(owner, target);
      flame.specialAbility.execute(owner.id, direction, world);
      this.lastSpecialUse = Date.now();
    }
  }
}

// Main Flame character class
export class Flame extends BaseCharacter {
  private ai: FlameAI;

  constructor() {
    super('flame');
    this.ai = new FlameAI();
    this.specialAbility = new FlameBurstAttack();
    this.primaryAttack = this.specialAbility;
    
    // Set up projectile behaviors
    this.projectileBehaviors = {
      default: flameProjectileBehavior,
      flame: flameProjectileBehavior
    };
  }

  onUpdate(owner: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    const target = this.ai.findNearestEnemy(owner, world);
    
    // Update burn effects on all entities
    this.updateBurnEffects(world, deltaTime);
    
    // Update fire patches
    this.updateFirePatches(world, deltaTime);
    
    if (!target) return;
    
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    // Movement (aggressive speed)
    if (distance > 40) {
      const moveDirection = this.ai.calculateMovementDirection(owner, target);
      const moveSpeed = 150 * (deltaTime / 1000); // Fast movement
      owner.velocity.x = moveDirection.x * moveSpeed;
      owner.velocity.y = moveDirection.y * moveSpeed;
    }
    
    if (distance <= flameConfig.attackRange) {
      const attackDirection = this.ai.calculateAttackDirection(owner, target);
      if (this.specialAbility && !(this.specialAbility as BaseAbility).isOnCooldown() && this.ai.shouldUseSpecialAbility(owner, target)) {
        this.specialAbility.execute(owner.id, attackDirection, world);
      }
    }
  }

  private updateBurnEffects(world: PhysicsWorld, deltaTime: number): void {
    const currentTime = Date.now();
    
    Array.from(world.entities.values()).forEach(entity => {
      if ((entity.properties as any)?.burnEffect) {
        const burn = (entity.properties as any).burnEffect;
        const elapsed = currentTime - burn.startTime;
        
        // Remove expired burn
        if (elapsed > burn.duration) {
          delete (entity.properties as any).burnEffect;
          return;
        }
        
        // Apply burn damage
        if (currentTime - burn.lastTickTime >= burn.tickInterval) {
          entity.health -= burn.damage;
          burn.lastTickTime = currentTime;
          
          // Create burn damage effect
          const burnDamageEffect = EntityUtils.createEffect({
            position: entity.position,
            radius: 6,
            lifetime: 300,
            color: '#f97316'
          });
          EntityUtils.addEffectToWorld(burnDamageEffect, world);
        }
      }
    });
  }

  private updateFirePatches(world: PhysicsWorld, deltaTime: number): void {
    const currentTime = Date.now();
    
    world.entities.forEach(entity => {
      if ((entity.properties as any)?.isFirePatch) {
        const age = currentTime - (entity.properties as any).creationTime;
        
        // Remove expired fire patches
        if (age > (entity.properties as any).duration) {
          entity.health = 0;
          return;
        }
        
        // Damage enemies standing in fire
        if (currentTime - (entity.properties as any).lastDamageTime > 500) {
          Array.from(world.entities.values()).forEach(target => {
            if (target.type === 'player' && 
                target.id !== entity.ownerId && 
                target.health > 0) {
              
              const distance = Math.sqrt(
                (target.position.x - entity.position.x) ** 2 + 
                (target.position.y - entity.position.y) ** 2
              );
              
              if (distance <= entity.radius) {
                target.health -= (entity.properties as any).damage;
                (entity.properties as any).lastDamageTime = currentTime;
                
                // Create fire damage effect
                const fireDamageEffect = EntityUtils.createEffect({
                  position: target.position,
                  radius: 8,
                  lifetime: 300,
                  color: '#f97316'
                });
                EntityUtils.addEffectToWorld(fireDamageEffect, world);
              }
            }
          });
        }
        
        // Create fire particle effects
        if (Math.random() < 0.4) {
          const particleEffect = EntityUtils.createEffect({
            position: {
              x: entity.position.x + (Math.random() - 0.5) * entity.radius,
              y: entity.position.y + (Math.random() - 0.5) * entity.radius
            },
            radius: 2 + Math.random() * 2,
            lifetime: 400,
            color: '#f97316'
          });
          EntityUtils.addEffectToWorld(particleEffect, world);
        }
      }
    });
  }

  onDamaged(entity: CircleEntity, damageAmount: number, source: CircleEntity | null, world?: PhysicsWorld): void {
    if (!world) return;
    
    // Create flame damage effect
    const flameDamageEffect = EntityUtils.createEffect({
      position: entity.position,
      radius: 18,
      lifetime: 400,
      color: flameConfig.bulletColor
    });
    EntityUtils.addEffectToWorld(flameDamageEffect, world);
    
    // Create defensive fire burst when heavily damaged
    if (damageAmount > 20) {
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const direction = {
          x: Math.cos(angle),
          y: Math.sin(angle)
        };
        
        const patchPosition = {
          x: entity.position.x + Math.cos(angle) * 30,
          y: entity.position.y + Math.sin(angle) * 30
        };
        createFirePatch(patchPosition, world, entity.id);
      }
    }
  }

  onKill(entity: CircleEntity, target: CircleEntity, world?: PhysicsWorld): void {
    if (!world) return;
    
    // Create massive explosion on kill
    const explosionEffect = EntityUtils.createEffect({
      position: target.position,
      radius: 50,
      lifetime: 1000,
      color: '#dc2626'
    });
    EntityUtils.addEffectToWorld(explosionEffect, world);
    
    // Create fire patches around the kill location
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const patchPosition = {
        x: target.position.x + Math.cos(angle) * 40,
        y: target.position.y + Math.sin(angle) * 40
      };
      createFirePatch(patchPosition, world, entity.id);
    }
  }
}

// Export configuration and implementation
export { flameConfig, FlameBurstAttack, InfernoBurst, flameProjectileBehavior, FlameAI };
export default Flame;