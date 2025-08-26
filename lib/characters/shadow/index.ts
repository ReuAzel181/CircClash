// Shadow character implementation
import { Vector, CircleEntity, PhysicsWorld } from '../../physics';
import { BaseCharacter, BaseAbility, BaseAI } from '../baseCharacter';
import { CharacterAbility, ProjectileBehavior } from '../characterInterface';
import { ProjectileEntity } from '../projectileInterface';
import { createProjectile, EntityUtils } from '../characterUtils';
import { getCharacterConfigSync } from '../../characterConfig';

// Shadow character configuration
const shadowConfig = {
  name: 'Shadow Assassin',
  color: '#6b21a8',
  bulletColor: '#8b5cf6',
  damage: 20,
  projectileSpeed: 380,
  bulletRadius: 2.2,
  firingRate: 500,
  attackRange: 300,
  multiShot: 2,
  spreadAngle: 15,
  stealthDuration: 4000,
  stealthSpeedBonus: 1.5,
  cloneDuration: 8000,
  cloneHealth: 40,
  cloneDamageMultiplier: 0.7,
  shadowStepDistance: 150,
  shadowStepCooldown: 3000,
  criticalChance: 0.25,
  criticalMultiplier: 2.0
};

// Shadow Bolt Attack - Primary ability
class ShadowBoltAttack extends BaseAbility {
  constructor() {
    super('shadow', shadowConfig.firingRate);
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;

    const owner = world.entities.get(entityId);
    if (!owner) return;

    // Create multiple shadow bolts
    for (let i = 0; i < shadowConfig.multiShot; i++) {
      const angleOffset = (i - (shadowConfig.multiShot - 1) / 2) * (shadowConfig.spreadAngle * Math.PI / 180);
      const boltDirection = {
        x: direction.x * Math.cos(angleOffset) - direction.y * Math.sin(angleOffset),
        y: direction.x * Math.sin(angleOffset) + direction.y * Math.cos(angleOffset)
      };

      const shadowBolt = createProjectile(entityId, owner, boltDirection, {
        projectileSpeed: shadowConfig.projectileSpeed,
        baseDamage: shadowConfig.damage,
        radius: shadowConfig.bulletRadius,
        lifetime: 2200,
        piercing: 1,
        visualEffects: {
          color: shadowConfig.bulletColor,
          trail: {
            color: shadowConfig.bulletColor,
            opacity: 0.8,
            lifetime: 800
          },
          glow: {
            color: shadowConfig.bulletColor,
            strength: 0.9
          }
        }
      });

      // Add shadow projectile properties
      shadowBolt.properties = {
        ...shadowBolt.properties,
        isShadowBolt: true,
        criticalChance: shadowConfig.criticalChance,
        criticalMultiplier: shadowConfig.criticalMultiplier,
        phaseThrough: false,
        shadowStepOnHit: true
      };

      // Check if owner is stealthed for bonus damage
      if (owner.properties?.isStealthed) {
        shadowBolt.damage *= 1.5; // Stealth bonus damage
        shadowBolt.properties.guaranteedCritical = true;
      }

      world.entities.set(shadowBolt.id, shadowBolt);
    }

    this.lastUsed = Date.now();
  }
}

// Shadow Clone - Special ability
class ShadowClone extends BaseAbility {
  constructor() {
    super('shadow', 12000); // 12 second cooldown
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;

    const owner = world.entities.get(entityId);
    if (!owner) return;

    // Create shadow clone
    const clonePosition = {
      x: owner.position.x + direction.x * 80,
      y: owner.position.y + direction.y * 80
    };

    const clone = {
      id: `shadow_clone_${Date.now()}`,
      position: clonePosition,
      velocity: { x: 0, y: 0 },
      radius: owner.radius,
      mass: owner.mass,
      health: shadowConfig.cloneHealth,
      maxHealth: shadowConfig.cloneHealth,
      damage: owner.damage * shadowConfig.cloneDamageMultiplier,
      restitution: owner.restitution,
      friction: owner.friction,
      isStatic: false,
      type: 'player' as const,
      ownerId: owner.id,
      properties: {
        visualEffects: {
          color: shadowConfig.color,
          trail: {
            color: shadowConfig.bulletColor,
            opacity: 0.6,
            lifetime: 300
          },
          glow: {
            color: shadowConfig.color,
            strength: 0.8
          }
        },
        isShadowClone: true,
        masterCharacterId: owner.id,
        duration: shadowConfig.cloneDuration,
        creationTime: Date.now(),
        lastAttackTime: 0,
        attackCooldown: shadowConfig.firingRate,
        damageMultiplier: shadowConfig.cloneDamageMultiplier,
        canUseAbilities: false
      }
    };

    world.entities.set(clone.id, clone as unknown as CircleEntity);
    
    // Create clone spawn effect
    const spawnEffect = EntityUtils.createEffect({
      position: clonePosition,
      radius: 25,
      lifetime: 600,
      color: shadowConfig.bulletColor,
      opacity: 0.8
    });
    EntityUtils.addEffectToWorld(spawnEffect, world);
    
    // Enter stealth mode for owner
    this.activateStealth(owner, world);

    this.lastUsed = Date.now();
  }

  private activateStealth(owner: CircleEntity, world: PhysicsWorld): void {
    if (!owner.properties) {
      owner.properties = {
        visualEffects: {
          color: shadowConfig.color,
          trail: {
            color: shadowConfig.bulletColor,
            opacity: 0.6,
            lifetime: 300
          },
          glow: {
            color: shadowConfig.color,
            strength: 0.8
          }
        }
      };
    }
    
    owner.properties.isStealthed = true;
    owner.properties.stealthStartTime = Date.now();
    owner.properties.stealthDuration = shadowConfig.stealthDuration;
    owner.properties.originalOpacity = 1.0;
    owner.properties.stealthOpacity = 0.3;
    
    // Create stealth effect
    const stealthEffect = EntityUtils.createEffect({
      position: owner.position,
      radius: 20,
      lifetime: 500,
      color: shadowConfig.bulletColor,
      opacity: 0.6
    });
    EntityUtils.addEffectToWorld(stealthEffect, world);
  }
}

// Shadow projectile behavior
const shadowProjectileBehavior: ProjectileBehavior = {
  onUpdate: (projectile: ProjectileEntity, world: PhysicsWorld, deltaTime: number) => {
    if (!projectile.properties?.isShadowBolt) return;

    // Create shadow trail particles
    if (Math.random() < 0.6) {
      const particleEffect = EntityUtils.createEffect({
        position: {
          x: projectile.position.x + (Math.random() - 0.5) * 8,
          y: projectile.position.y + (Math.random() - 0.5) * 8
        },
        radius: 1 + Math.random() * 2,
        lifetime: 500,
        color: shadowConfig.bulletColor,
        opacity: 0.4
      });
      EntityUtils.addEffectToWorld(particleEffect, world);
    }

    // Create void distortion effect
    if (Math.random() < 0.2) {
      const distortionEffect = EntityUtils.createEffect({
        position: projectile.position,
        radius: projectile.radius * 2.5,
        lifetime: 300,
        color: 'rgba(139, 92, 246, 0.4)',
        opacity: 0.4
      });
      EntityUtils.addEffectToWorld(distortionEffect, world);
    }
  },

  onCollision: (projectile: ProjectileEntity, target: CircleEntity, world: PhysicsWorld) => {
    if (!projectile.properties?.isShadowBolt) return;
    
    if ((target.type === 'player' || target.type === 'pickup') && target.id !== projectile.ownerId) {
      let finalDamage = projectile.damage;
      
      // Check for critical hit
      const isCritical = projectile.properties.guaranteedCritical || 
                        Math.random() < (projectile.properties.criticalChance || 0);
      
      if (isCritical) {
        finalDamage *= (projectile.properties.criticalMultiplier || 1);
        
        // Create critical hit effect
        const criticalEffect = EntityUtils.createEffect({
          position: target.position,
          radius: 18,
          lifetime: 600,
          color: '#fbbf24',
          opacity: 0.9
        });
        EntityUtils.addEffectToWorld(criticalEffect, world);
      }
      
      // Apply damage
      target.health -= finalDamage;
      
      // Shadow step effect on hit
      if (projectile.properties.shadowStepOnHit) {
        createShadowStepEffect(projectile.position, world);
      }
      
      // Create impact effect
      const impactEffect = EntityUtils.createEffect({
        position: target.position,
        radius: 12,
        lifetime: 400,
        color: shadowConfig.bulletColor,
        opacity: 0.7
      });
      EntityUtils.addEffectToWorld(impactEffect, world);
    }
  }
};

// Helper function to create shadow step effect
function createShadowStepEffect(position: Vector, world: PhysicsWorld): void {
  const stepEffect = EntityUtils.createEffect({
    position: position,
    radius: 15,
    lifetime: 400,
    color: shadowConfig.bulletColor,
    opacity: 0.8
  });
  EntityUtils.addEffectToWorld(stepEffect, world);
  
  // Create void rift
  const riftEffect = EntityUtils.createEffect({
    position: position,
    radius: 8,
    lifetime: 800,
    color: '#4c1d95',
    opacity: 0.6
  });
  EntityUtils.addEffectToWorld(riftEffect, world);
}

// Shadow AI implementation
class ShadowAI extends BaseAI {
  private lastSpecialUse: number = 0;
  private specialCooldown: number = 12000;
  private lastShadowStep: number = 0;
  private shadowStepCooldown: number = shadowConfig.shadowStepCooldown;
  private stealthMode: boolean = false;

  constructor() {
    super();
  }

  findNearestEnemy(owner: CircleEntity, world: PhysicsWorld): CircleEntity | null {
    let nearestEnemy: CircleEntity | null = null;
    let nearestDistance = Infinity;

    for (const [id, entity] of Array.from(world.entities.entries())) {
      if ((entity.type === 'player' || entity.type === 'pickup') && 
          entity.id !== owner.id && 
          !entity.properties?.isShadowClone &&
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
    
    // Shadow prefers hit-and-run tactics
    const optimalDistance = shadowConfig.attackRange * 0.9;
    this.stealthMode = owner.properties?.isStealthed || false;
    
    if (this.stealthMode) {
      // Aggressive positioning when stealthed
      if (distance > 120) {
        return {
          x: (target.position.x - owner.position.x) / distance,
          y: (target.position.y - owner.position.y) / distance
        };
      }
    } else {
      // Hit and run when visible
      if (distance > optimalDistance + 30) {
        // Move closer
        return {
          x: (target.position.x - owner.position.x) / distance,
          y: (target.position.y - owner.position.y) / distance
        };
      } else if (distance < optimalDistance - 60) {
        // Move away to maintain distance
        return {
          x: (owner.position.x - target.position.x) / distance,
          y: (owner.position.y - target.position.y) / distance
        };
      }
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
    
    // Predict target movement for precise shots
    const leadTime = distance / shadowConfig.projectileSpeed;
    const prediction = {
      x: target.position.x + target.velocity.x * leadTime * 0.8,
      y: target.position.y + target.velocity.y * leadTime * 0.8
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

    // Use shadow clone when health is low or for tactical advantage
    const healthPercentage = owner.health / owner.maxHealth;
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    return healthPercentage < 0.6 || distance <= 200;
  }

  shouldUseShadowStep(owner: CircleEntity, target: CircleEntity): boolean {
    const currentTime = Date.now();
    if (currentTime - this.lastShadowStep < this.shadowStepCooldown) {
      return false;
    }

    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    // Use shadow step for positioning or escape
    const healthPercentage = owner.health / owner.maxHealth;
    return (distance > 250 && healthPercentage > 0.5) || (distance < 100 && healthPercentage < 0.4);
  }

  useShadowStep(owner: CircleEntity, target: CircleEntity, world: PhysicsWorld): void {
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    let stepDirection: Vector;
    
    if (distance < 100) {
      // Step away from target
      stepDirection = {
        x: (owner.position.x - target.position.x) / distance,
        y: (owner.position.y - target.position.y) / distance
      };
    } else {
      // Step towards target
      stepDirection = {
        x: (target.position.x - owner.position.x) / distance,
        y: (target.position.y - owner.position.y) / distance
      };
    }
    
    // Create shadow step effect at current position
    createShadowStepEffect(owner.position, world);
    
    // Teleport to new position
    const newPosition = {
      x: owner.position.x + stepDirection.x * shadowConfig.shadowStepDistance,
      y: owner.position.y + stepDirection.y * shadowConfig.shadowStepDistance
    };
    
    owner.position.x = newPosition.x;
    owner.position.y = newPosition.y;
    
    // Create shadow step effect at new position
    createShadowStepEffect(newPosition, world);
    
    this.lastShadowStep = Date.now();
  }

  useSpecialAbility(owner: CircleEntity, target: CircleEntity, world: PhysicsWorld): void {
    const shadow = Array.from(world.entities.values()).find(e => e.id === owner.id) as any;
    if (shadow?.specialAbility) {
      const direction = this.calculateAttackDirection(owner, target);
      shadow.specialAbility.execute(owner, direction, world);
      this.lastSpecialUse = Date.now();
    }
  }
}

// Main Shadow character class
export class Shadow extends BaseCharacter {
  private ai: ShadowAI;

  constructor() {
    super('shadow');
    
    // Initialize abilities
    this.primaryAttack = new ShadowBoltAttack();
    this.specialAbility = new ShadowClone();
    this.ai = new ShadowAI();
    
    // Register projectile behavior
    this.projectileBehaviors['shadow'] = shadowProjectileBehavior;
  }

  onUpdate(owner: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    const target = this.ai.findNearestEnemy(owner, world);
    
    // Update stealth effects
    this.updateStealthEffects(owner, world, deltaTime);
    
    // Update shadow clones
    this.updateShadowClones(world, deltaTime);
    
    if (!target) return;
    
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    // Movement (fast and agile)
    if (distance > 40) {
      const moveDirection = this.ai.calculateMovementDirection(owner, target);
      let moveSpeed = 160 * (deltaTime / 1000); // Fast movement
      
      // Speed bonus when stealthed
      if (owner.properties?.isStealthed) {
        moveSpeed *= shadowConfig.stealthSpeedBonus;
      }
      
      owner.velocity.x = moveDirection.x * moveSpeed;
      owner.velocity.y = moveDirection.y * moveSpeed;
    }
    
    // Shadow step ability
    if (this.ai.shouldUseShadowStep(owner, target)) {
      this.ai.useShadowStep(owner, target, world);
    }
    
    // Attack
    if (distance <= shadowConfig.attackRange) {
      if (this.ai.shouldUseSpecialAbility(owner, target)) {
        this.ai.useSpecialAbility(owner, target, world);
      } else if (!this.primaryAttack.isOnCooldown()) {
        const attackDirection = this.ai.calculateAttackDirection(owner, target);
        this.primaryAttack.execute(owner.id, attackDirection, world);
      }
    }
  }

  private updateStealthEffects(owner: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    if (!owner.properties?.isStealthed) return;
    
    const currentTime = Date.now();
    const elapsed = currentTime - (owner.properties.stealthStartTime || 0);
    
    // Remove stealth when duration expires
    if (elapsed > (owner.properties.stealthDuration || 0)) {
      owner.properties.isStealthed = false;
      
      // Create stealth end effect
      const endEffect = EntityUtils.createEffect({
        position: owner.position,
        radius: 20,
        lifetime: 400,
        color: shadowConfig.bulletColor,
        opacity: 0.7
      });
      EntityUtils.addEffectToWorld(endEffect, world);
      
      return;
    }
    
    // Create stealth particle effects
    if (Math.random() < 0.3) {
      const particleEffect = EntityUtils.createEffect({
        position: {
          x: owner.position.x + (Math.random() - 0.5) * owner.radius * 2,
          y: owner.position.y + (Math.random() - 0.5) * owner.radius * 2
        },
        radius: 1 + Math.random(),
        lifetime: 400,
        color: shadowConfig.bulletColor,
        opacity: 0.3
      });
      EntityUtils.addEffectToWorld(particleEffect, world);
    }
  }

  private updateShadowClones(world: PhysicsWorld, deltaTime: number): void {
    const currentTime = Date.now();
    
    for (const [id, entity] of Array.from(world.entities.entries())) {
      if (entity.properties?.isShadowClone) {
        const age = currentTime - (entity.properties.creationTime || 0);
        
        // Remove expired clones
        if (age > (entity.properties.duration || 0) || entity.health <= 0) {
          // Create clone death effect
        const deathEffect = EntityUtils.createEffect({
          position: entity.position,
          radius: 20,
          lifetime: 600,
          color: shadowConfig.bulletColor,
          opacity: 0.8
        });
        EntityUtils.addEffectToWorld(deathEffect, world);
          
          entity.health = 0;
          continue;
        }
        
        // Clone AI behavior
        this.updateCloneAI(entity, world, deltaTime);
        
        // Create clone particle effects
        if (Math.random() < 0.2) {
          const cloneParticleEffect = EntityUtils.createEffect({
            position: entity.position,
            radius: 1 + Math.random(),
            lifetime: 300,
            color: shadowConfig.bulletColor,
            opacity: 0.4
          });
          EntityUtils.addEffectToWorld(cloneParticleEffect, world);
        }
      }
    }
  }

  private updateCloneAI(clone: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    // Find nearest enemy for clone
    let nearestEnemy: CircleEntity | null = null;
    let nearestDistance = Infinity;
    
    for (const [id, entity] of Array.from(world.entities.entries())) {
      if ((entity.type === 'player' || entity.type === 'pickup') && 
          entity.id !== clone.ownerId && 
          entity.id !== clone.id &&
          !entity.properties?.isShadowClone &&
          entity.health > 0) {
        
        const distance = Math.sqrt(
          (entity.position.x - clone.position.x) ** 2 + 
          (entity.position.y - clone.position.y) ** 2
        );
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestEnemy = entity;
        }
      }
    }
    
    if (!nearestEnemy) return;
    
    // Clone movement
    if (nearestDistance > 40) {
      const moveDirection = {
        x: (nearestEnemy.position.x - clone.position.x) / nearestDistance,
        y: (nearestEnemy.position.y - clone.position.y) / nearestDistance
      };
      
      const moveSpeed = 140 * (deltaTime / 1000);
      clone.velocity.x = moveDirection.x * moveSpeed;
      clone.velocity.y = moveDirection.y * moveSpeed;
    }
    
    // Clone attack
    const currentTime = Date.now();
    if (nearestDistance <= shadowConfig.attackRange && 
         clone.properties && currentTime - (clone.properties.lastAttackTime || 0) > (clone.properties.attackCooldown || 1000)) {
      
      const attackDirection = {
        x: (nearestEnemy.position.x - clone.position.x) / nearestDistance,
        y: (nearestEnemy.position.y - clone.position.y) / nearestDistance
      };
      
      // Create clone projectile
      const cloneBolt = createProjectile(clone.id, clone, attackDirection, {
        projectileSpeed: shadowConfig.projectileSpeed * 0.8,
        baseDamage: shadowConfig.damage * (clone.properties.damageMultiplier || 1),
        radius: shadowConfig.bulletRadius,
        lifetime: 2000,
        piercing: 0,
        visualEffects: {
          color: shadowConfig.bulletColor,
          trail: {
            color: shadowConfig.bulletColor,
            opacity: 0.6,
            lifetime: 600
          }
        }
      });
      
      cloneBolt.properties = {
        ...cloneBolt.properties,
        isShadowBolt: true,
        isCloneProjectile: true,
        criticalChance: shadowConfig.criticalChance * 0.5,
        criticalMultiplier: shadowConfig.criticalMultiplier
      };
      
      world.entities.set(cloneBolt.id, cloneBolt);
      if (clone.properties) {
        clone.properties.lastAttackTime = currentTime;
      }
    }
  }

  onDamaged(entity: CircleEntity, damageAmount: number, source: CircleEntity | null): void {
    // Note: This method doesn't have access to world, so effects cannot be created
    // Break stealth when damaged
    if (entity.properties?.isStealthed) {
      entity.properties.isStealthed = false;
    }
  }

  onKill(entity: CircleEntity, target: CircleEntity): void {
    // Restore some health on kill
    const healAmount = Math.min(15, entity.maxHealth - entity.health);
    if (healAmount > 0) {
      entity.health += healAmount;
    }
  }
}

// Export configuration and implementation
export { shadowConfig, ShadowBoltAttack, ShadowClone, shadowProjectileBehavior, ShadowAI };
export default Shadow;