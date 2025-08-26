// Mystic character implementation
import { Vector, CircleEntity, PhysicsWorld } from '../../physics';
import { BaseCharacter, BaseAbility, BaseAI } from '../baseCharacter';
import { CharacterAbility, ProjectileBehavior } from '../characterInterface';
import { createProjectile, EntityUtils } from '../characterUtils';
import { getCharacterConfigSync } from '../../characterConfig';

// Mystic character configuration
const mysticConfig = {
  name: 'Mystic Orb',
  color: '#a855f7',
  bulletColor: '#a855f7',
  damage: 14,
  projectileSpeed: 320,
  bulletRadius: 2.5,
  firingRate: 750,
  attackRange: 380,
  multiShot: 3,
  spreadAngle: 25,
  homingStrength: 0.8,
  webRadius: 100,
  webDuration: 6000,
  webSlowStrength: 0.6,
  threadLifetime: 4000,
  healAmount: 25,
  healCooldown: 8000
};

// Mystic Thread Attack - Primary ability
class MysticThreadAttack extends BaseAbility {
  constructor() {
    super('mystic', mysticConfig.firingRate);
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;

    const owner = world.entities.get(entityId) as CircleEntity;
    if (!owner) return;

    // Create multiple thread projectiles
    for (let i = 0; i < mysticConfig.multiShot; i++) {
      const angleOffset = (i - (mysticConfig.multiShot - 1) / 2) * (mysticConfig.spreadAngle * Math.PI / 180);
      const threadDirection = {
        x: direction.x * Math.cos(angleOffset) - direction.y * Math.sin(angleOffset),
        y: direction.x * Math.sin(angleOffset) + direction.y * Math.cos(angleOffset)
      };

      const thread = createProjectile(`${entityId}_thread_${i}`, owner, threadDirection, {
        projectileSpeed: mysticConfig.projectileSpeed,
        baseDamage: mysticConfig.damage,
        radius: mysticConfig.bulletRadius,
        lifetime: mysticConfig.threadLifetime,
        piercing: 0,
        visualEffects: {
          color: mysticConfig.bulletColor,
          trail: {
            color: mysticConfig.bulletColor,
            opacity: 0.6,
            lifetime: 800
          },
          glow: {
            color: mysticConfig.bulletColor,
            strength: 0.7
          }
        }
      });

      // Add mystic thread properties
      thread.properties = {
        ...thread.properties,
        isMysticThread: true,
        homingStrength: mysticConfig.homingStrength,
        webRadius: mysticConfig.webRadius,
        webDuration: mysticConfig.webDuration,
        webSlowStrength: mysticConfig.webSlowStrength,
        hasHomed: false,
        targetId: null
      };

      world.entities.set(thread.id, thread);
    }

    this.lastUsed = Date.now();
  }
}

// Mystic Web - Special ability
class MysticWeb extends BaseAbility {
  constructor() {
    super('mystic', mysticConfig.healCooldown);
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;

    const owner = world.entities.get(entityId) as CircleEntity;
    if (!owner) return;

    // Create web at target location
    const webDistance = 200;
    const webPosition = {
      x: owner.position.x + direction.x * webDistance,
      y: owner.position.y + direction.y * webDistance
    };

    // Create web entity
    const web: CircleEntity = {
      id: `mystic_web_${Date.now()}`,
      position: webPosition,
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      radius: mysticConfig.webRadius,
      mass: 1,
      health: 50,
      maxHealth: 50,
      damage: 0,
      restitution: 0,
      friction: 0,
      isStatic: true,
      type: 'hazard',
      ownerId: owner.id,
      lifetime: mysticConfig.webDuration,
      invulnerableUntil: 0,
      properties: {
        visualEffects: {
          color: mysticConfig.bulletColor,
          trail: {
            color: mysticConfig.bulletColor,
            opacity: 0.6,
            lifetime: 500
          },
          glow: {
            color: mysticConfig.bulletColor,
            strength: 0.8
          }
        },
        isMysticWeb: true,
        duration: mysticConfig.webDuration,
        slowStrength: mysticConfig.webSlowStrength,
        creationTime: Date.now(),
        trappedEnemies: new Set(),
        healAmount: mysticConfig.healAmount,
        lastHealTime: 0
      }
    };

    world.entities.set(web.id, web);
    
    // Create web visual effect
    const webEffect = EntityUtils.createEffect({
      position: webPosition,
      color: mysticConfig.bulletColor,
      radius: mysticConfig.webRadius,
      lifetime: mysticConfig.webDuration,
      opacity: 0.7
    });
    world.entities.set(webEffect.id, webEffect);

    this.lastUsed = Date.now();
  }
}

// Mystic thread projectile behavior
const mysticThreadBehavior: ProjectileBehavior = {
  onUpdate: (projectile: CircleEntity, world: PhysicsWorld, deltaTime: number) => {
    if (!projectile.properties?.isMysticThread) return;

    // Homing behavior
    if (!projectile.properties.hasHomed && (projectile.properties.homingStrength || 0) > 0) {
      let nearestEnemy: CircleEntity | null = null;
      let nearestDistance = Infinity;
      const homingRange = 150;

      for (const entity of world.entities.values()) {
        if (entity.type === 'player' && 
            entity.id !== projectile.ownerId && 
            entity.health > 0) {
          
          const distance = Math.sqrt(
            (entity.position.x - projectile.position.x) ** 2 + 
            (entity.position.y - projectile.position.y) ** 2
          );
          
          if (distance < nearestDistance && distance <= homingRange) {
            nearestDistance = distance;
            nearestEnemy = entity;
          }
        }
      }

      if (nearestEnemy) {
        projectile.properties.targetId = nearestEnemy.id;
        projectile.properties.hasHomed = true;
        
        // Adjust velocity towards target
        const direction = {
          x: (nearestEnemy.position.x - projectile.position.x) / nearestDistance,
          y: (nearestEnemy.position.y - projectile.position.y) / nearestDistance
        };
        
        const currentSpeed = Math.sqrt(projectile.velocity.x ** 2 + projectile.velocity.y ** 2);
        const homingFactor = (projectile.properties.homingStrength || 0) * (deltaTime / 16.67);
        
        projectile.velocity.x += direction.x * currentSpeed * homingFactor;
        projectile.velocity.y += direction.y * currentSpeed * homingFactor;
        
        // Normalize velocity to maintain speed
        const newSpeed = Math.sqrt(projectile.velocity.x ** 2 + projectile.velocity.y ** 2);
        if (newSpeed > 0) {
          projectile.velocity.x = (projectile.velocity.x / newSpeed) * currentSpeed;
          projectile.velocity.y = (projectile.velocity.y / newSpeed) * currentSpeed;
        }
      }
    }

    // Continue homing if target exists
    if (projectile.properties.hasHomed && projectile.properties.targetId) {
      const target = world.entities.get(projectile.properties.targetId);
      if (target && target.health > 0) {
        const distance = Math.sqrt(
          (target.position.x - projectile.position.x) ** 2 + 
          (target.position.y - projectile.position.y) ** 2
        );
        
        const direction = {
          x: (target.position.x - projectile.position.x) / distance,
          y: (target.position.y - projectile.position.y) / distance
        };
        
        const currentSpeed = Math.sqrt(projectile.velocity.x ** 2 + projectile.velocity.y ** 2);
        const homingFactor = (projectile.properties.homingStrength || 0) * (deltaTime / 16.67);
        
        projectile.velocity.x += direction.x * currentSpeed * homingFactor * 0.1;
        projectile.velocity.y += direction.y * currentSpeed * homingFactor * 0.1;
      }
    }

    // Create magical trail particles
    if (Math.random() < 0.4) {
      const sparkEffect = EntityUtils.createEffect({
        position: projectile.position,
        color: mysticConfig.bulletColor,
        radius: 3,
        lifetime: 300
      });
      world.entities.set(sparkEffect.id, sparkEffect);
    }
  },

  onCollision: (projectile: CircleEntity, target: CircleEntity, world: PhysicsWorld) => {
    if (!projectile.properties?.isMysticThread) return;
    
    if (target.type === 'player' && target.id !== projectile.ownerId) {
      // Apply damage
      target.health -= projectile.damage;
      
      // Create web at impact location
      createMysticWebAt(target.position, world, projectile.ownerId || '');
      
      // Create impact effect
      const impactEffect = EntityUtils.createEffect({
        position: target.position,
        color: mysticConfig.bulletColor,
        radius: 20,
        lifetime: 400
      });
      world.entities.set(impactEffect.id, impactEffect);
    }
  }
};

// Helper function to create web at location
function createMysticWebAt(position: Vector, world: PhysicsWorld, ownerId: string): void {
  const web: CircleEntity = {
    id: `impact_web_${Date.now()}_${Math.random()}`,
    position: { ...position },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    radius: mysticConfig.webRadius * 0.7, // Smaller impact web
    mass: 1,
    health: 30,
    maxHealth: 30,
    damage: 0,
    restitution: 0,
    friction: 0,
    isStatic: true,
    type: 'hazard',
    ownerId: ownerId,
    lifetime: mysticConfig.webDuration * 0.6,
    invulnerableUntil: 0,
    properties: {
      visualEffects: {
        color: '#a855f7',
        trail: {
          color: '#a855f7',
          opacity: 0.8,
          lifetime: 1000
        },
        glow: {
          color: '#a855f7',
          strength: 1.0
        }
      },
      isMysticWeb: true,
      duration: mysticConfig.webDuration * 0.6,
      slowStrength: mysticConfig.webSlowStrength,
      creationTime: Date.now(),
      trappedEnemies: new Set(),
      isImpactWeb: true
    }
  };

  world.entities.set(web.id, web);
}

// Mystic AI implementation
class MysticAI extends BaseAI {
  private lastSpecialUse: number = 0;
  private specialCooldown: number = mysticConfig.healCooldown;
  private lastHealTime: number = 0;

  constructor() {
    super();
  }

  findNearestEnemy(owner: CircleEntity, world: PhysicsWorld): CircleEntity | null {
    let nearestEnemy: CircleEntity | null = null;
    let nearestDistance = Infinity;

    for (const entity of world.entities.values()) {
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
    
    // Mystic prefers medium to long range
    const optimalDistance = mysticConfig.attackRange * 0.9;
    
    if (distance > optimalDistance + 40) {
      // Move closer
      return {
        x: (target.position.x - owner.position.x) / distance,
        y: (target.position.y - owner.position.y) / distance
      };
    } else if (distance < optimalDistance - 40) {
      // Move away to maintain distance
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
    
    // Predict target movement for homing projectiles
    const prediction = {
      x: target.position.x + target.velocity.x * 0.4,
      y: target.position.y + target.velocity.y * 0.4
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

    // Use web when health is low or target is close
    const healthPercentage = owner.health / owner.maxHealth;
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    return healthPercentage < 0.6 || distance <= 250;
  }

  useSpecialAbility(owner: CircleEntity, target: CircleEntity, world: PhysicsWorld): void {
    const mystic = world.entities.get(owner.id) as any;
    if (mystic?.specialAbility) {
      const direction = this.calculateAttackDirection(owner, target);
      mystic.specialAbility.execute(owner.id, direction, world);
      this.lastSpecialUse = Date.now();
    }
  }

  handleSelfHeal(owner: CircleEntity): void {
    const currentTime = Date.now();
    if (currentTime - this.lastHealTime > 3000) { // Heal every 3 seconds
      if (owner.health < owner.maxHealth) {
        const healAmount = Math.min(5, owner.maxHealth - owner.health);
        owner.health += healAmount;
        this.lastHealTime = currentTime;
      }
    }
  }
}

// Main Mystic character class
export class Mystic extends BaseCharacter {
  private ai: MysticAI;

  constructor() {
    super('mystic');
    
    // Initialize abilities
    this.primaryAttack = new MysticThreadAttack();
    this.specialAbility = new MysticWeb();
    this.ai = new MysticAI();
    
    // Register projectile behavior
    this.projectileBehaviors['mystic'] = mysticThreadBehavior;
  }

  onUpdate(owner: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    const target = this.ai.findNearestEnemy(owner, world);
    
    // Handle self-healing
    this.ai.handleSelfHeal(owner);
    
    // Update web effects
    this.updateWebEffects(world, deltaTime);
    
    if (!target) return;
    
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    // Movement (moderate speed)
    if (distance > 40) {
      const moveDirection = this.ai.calculateMovementDirection(owner, target);
      const moveSpeed = 130 * (deltaTime / 1000);
      owner.velocity.x = moveDirection.x * moveSpeed;
      owner.velocity.y = moveDirection.y * moveSpeed;
    }
    
    // Attack
    if (distance <= mysticConfig.attackRange) {
      if (this.ai.shouldUseSpecialAbility(owner, target)) {
        this.ai.useSpecialAbility(owner, target, world);
      } else if (!this.primaryAttack.isOnCooldown()) {
        const attackDirection = this.ai.calculateAttackDirection(owner, target);
        this.primaryAttack.execute(owner.id, attackDirection, world);
      }
    }
  }

  private updateWebEffects(world: PhysicsWorld, deltaTime: number): void {
    for (const entity of world.entities.values()) {
      if (entity.properties?.isMysticWeb) {
        const currentTime = Date.now();
        const age = currentTime - (entity.properties.creationTime || 0);
        
        // Remove expired webs
        if (entity.properties.creationTime && entity.properties.duration && age > entity.properties.duration) {
          entity.health = 0;
          return;
        }
        
        // Apply slow effect to enemies in web
        for (const target of world.entities.values()) {
          if (target.type === 'player' && 
              target.id !== entity.ownerId && 
              target.health > 0) {
            
            const distance = Math.sqrt(
              (target.position.x - entity.position.x) ** 2 + 
              (target.position.y - entity.position.y) ** 2
            );
            
            if (distance <= entity.radius) {
              // Apply slow effect
              if (!target.properties) {
                target.properties = {
                  visualEffects: {
                    color: '#ffffff',
                    trail: { color: '#ffffff', opacity: 0.5, lifetime: 500 },
                    glow: { color: '#ffffff', strength: 0.5 }
                  }
                };
              }
              target.properties.webSlow = {
                  strength: entity.properties.slowStrength || 0.6,
                  startTime: currentTime
                };
              
              if (!entity.properties.trappedEnemies) {
                  entity.properties.trappedEnemies = new Set();
                }
                entity.properties.trappedEnemies.add(target.id);
            }
          }
        }
        
        // Heal allies in web (if not impact web)
        if (!entity.properties.isImpactWeb && 
            currentTime - (entity.properties.lastHealTime || 0) > 2000) {
          
          for (const ally of world.entities.values()) {
            if (entity.properties.trappedEnemies?.has(ally.id)) continue;
            
            if (ally.type === 'player' && 
                ally.id === entity.ownerId && 
                ally.health < ally.maxHealth) {
              
              const distance = Math.sqrt(
                (ally.position.x - entity.position.x) ** 2 + 
                (ally.position.y - entity.position.y) ** 2
              );
              
              if (distance <= entity.radius) {
                ally.health = Math.min(ally.maxHealth, ally.health + (entity.properties.healAmount || 0));
                entity.properties.lastHealTime = currentTime;
                
                // Create heal effect
                const healEffect = EntityUtils.createEffect({
                  position: ally.position,
                  color: '#22c55e',
                  radius: 15,
                  lifetime: 500
                });
                world.entities.set(healEffect.id, healEffect);
              }
            }
          }
        }
      }
    }
  }

  onDamaged(entity: CircleEntity, damageAmount: number, source: CircleEntity | null): void {
    // Create magical damage effect
    const damageEffect = EntityUtils.createEffect({
      position: entity.position,
      color: mysticConfig.bulletColor,
      radius: 16,
      lifetime: 350
    });
    // Note: world parameter not available in this signature, effect creation may need to be handled differently
  }

  onKill(entity: CircleEntity, target: CircleEntity): void {
    // Create magical explosion on kill
    const explosionEffect = EntityUtils.createEffect({
      position: target.position,
      color: mysticConfig.bulletColor,
      radius: 30,
      lifetime: 700
    });
    // Note: world parameter not available in this signature, effect creation may need to be handled differently
    
    // Create healing web at kill location would need world parameter
    // createMysticWebAt(target.position, world, entity.id);
  }
}

// Export configuration and implementation
export { mysticConfig, MysticThreadAttack, MysticWeb, mysticThreadBehavior, MysticAI };
export default Mystic;