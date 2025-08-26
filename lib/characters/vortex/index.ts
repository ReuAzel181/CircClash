// Vortex character implementation
import { Vector, CircleEntity, PhysicsWorld } from '../../physics';
import { BaseCharacter, BaseAbility, BaseAI } from '../baseCharacter';
import { CharacterAbility, ProjectileBehavior } from '../characterInterface';
import { createProjectile, EntityUtils } from '../characterUtils';
import { getCharacterConfigSync } from '../../characterConfig';

// Vortex character configuration
const vortexConfig = {
  name: 'Plasma Vortex',
  color: '#8b5cf6',
  bulletColor: '#8b5cf6',
  damage: 15,
  projectileSpeed: 400,
  bulletRadius: 3.5,
  firingRate: 800,
  attackRange: 500,
  multiShot: 1,
  spreadAngle: 0,
  vortexStopDistance: 250,
  vortexRadius: 60,
  vortexPullStrength: 1.2,
  vortexDuration: 5000,
  vortexTouchedDuration: 3000,
  vortexDamageRate: 8
};

// Plasma Vortex Attack - Primary ability
class PlasmaVortexAttack extends BaseAbility {
  constructor() {
    super('vortex', vortexConfig.firingRate);
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;

    const owner = Array.from(world.entities.values()).find(e => e.id === entityId);
    if (!owner) return;

    // Create vortex projectile
    const projectile = createProjectile(owner.id, owner, direction, {
      projectileSpeed: vortexConfig.projectileSpeed,
      baseDamage: vortexConfig.damage,
      radius: vortexConfig.bulletRadius,
      lifetime: 8000,
      piercing: 0,
      visualEffects: {
        color: vortexConfig.bulletColor,
        trail: {
          color: vortexConfig.bulletColor,
          opacity: 0.7,
          lifetime: 500
        },
        glow: {
          color: vortexConfig.bulletColor,
          strength: 0.8
        }
      }
    });

    // Add vortex-specific properties
    projectile.properties = {
      ...projectile.properties,
      vortexStopDistance: vortexConfig.vortexStopDistance,
      vortexRadius: vortexConfig.vortexRadius,
      vortexPullStrength: vortexConfig.vortexPullStrength,
      vortexDuration: vortexConfig.vortexDuration,
      vortexTouchedDuration: vortexConfig.vortexTouchedDuration,
      vortexDamageRate: vortexConfig.vortexDamageRate,
      distanceTraveled: 0,
      isVortex: false,
      vortexStartTime: 0,
      lastDamageTime: 0
    };

    world.entities.set(projectile.id, projectile);
    this.lastUsed = Date.now();
  }
}

// Vortex projectile behavior
const vortexBehavior: ProjectileBehavior = {
  onUpdate: (projectile: CircleEntity, world: PhysicsWorld, deltaTime: number) => {
    if (!projectile.properties) return;

    // Track distance traveled
    const speed = Math.sqrt(projectile.velocity.x ** 2 + projectile.velocity.y ** 2);
    (projectile.properties as any).distanceTraveled += speed * (deltaTime / 1000);

    // Check if projectile should become a vortex
    if (!(projectile.properties as any).isVortex && 
        (projectile.properties as any).distanceTraveled >= (projectile.properties as any).vortexStopDistance) {
      // Transform into vortex
      (projectile.properties as any).isVortex = true;
      (projectile.properties as any).vortexStartTime = Date.now();
      projectile.velocity = { x: 0, y: 0 }; // Stop moving
      projectile.radius = (projectile.properties as any).vortexRadius;
      
      // Create vortex visual effect
      const vortexEffect = EntityUtils.createEffect({
        position: projectile.position,
        color: vortexConfig.bulletColor,
        radius: (projectile.properties as any).vortexRadius || 50,
        lifetime: (projectile.properties as any).vortexDuration || 3000,
        opacity: 0.8
      });
      EntityUtils.addEffectToWorld(vortexEffect, world);
    }

    // Vortex behavior
    if ((projectile.properties as any).isVortex) {
      const currentTime = Date.now();
      const vortexAge = currentTime - (projectile.properties as any).vortexStartTime;
      
      // Check if vortex should expire
      const maxDuration = (projectile.properties as any).touchedByEnemy ? 
        (projectile.properties as any).vortexTouchedDuration : 
        (projectile.properties as any).vortexDuration;
      
      if (vortexAge > maxDuration) {
        projectile.health = 0; // Destroy vortex
        return;
      }

      // Pull nearby enemies
      world.entities.forEach(entity => {
        if (entity.type === 'player' && entity.id !== projectile.ownerId) {
          const distance = Math.sqrt(
            (entity.position.x - projectile.position.x) ** 2 + 
            (entity.position.y - projectile.position.y) ** 2
          );
          
          if (distance <= (projectile.properties as any).vortexRadius) {
            // Mark as touched by enemy
            (projectile.properties as any).touchedByEnemy = true;
            
            // Apply pull force
            const pullDirection = {
              x: (projectile.position.x - entity.position.x) / distance,
              y: (projectile.position.y - entity.position.y) / distance
            };
            
            const pullForce = (projectile.properties as any).vortexPullStrength * (deltaTime / 16.67);
            entity.velocity.x += pullDirection.x * pullForce;
            entity.velocity.y += pullDirection.y * pullForce;
            
            // Apply damage over time
            if (currentTime - (projectile.properties as any).lastDamageTime > 500) {
              entity.health -= (projectile.properties as any).vortexDamageRate;
              (projectile.properties as any).lastDamageTime = currentTime;
              
              // Create damage effect
              const damageEffect = EntityUtils.createEffect({
                position: entity.position,
                color: '#ff4444',
                radius: 10,
                lifetime: 300
              });
              EntityUtils.addEffectToWorld(damageEffect, world);
            }
          }
        }
      });
    }
  },

  onCollision: (projectile: CircleEntity, target: CircleEntity, world: PhysicsWorld) => {
    // Only handle collision if not yet a vortex
    if (!(projectile.properties as any)?.isVortex) {
      if (target.type === 'player' && target.id !== projectile.ownerId) {
        target.health -= projectile.damage;
        
        // Create impact effect
        const impactEffect = EntityUtils.createEffect({
          position: target.position,
          color: vortexConfig.bulletColor,
          radius: 15,
          lifetime: 200
        });
        EntityUtils.addEffectToWorld(impactEffect, world);
        
        // Transform into vortex at collision point
        (projectile.properties as any).isVortex = true;
        (projectile.properties as any).vortexStartTime = Date.now();
        projectile.velocity = { x: 0, y: 0 };
        projectile.radius = (projectile.properties as any).vortexRadius || 50;
        projectile.position = { ...target.position };
      }
    }
  }
};

// Vortex AI implementation
class VortexAI extends BaseAI {
  private lastSpecialUse: number = 0;
  private specialCooldown: number = 8000; // 8 seconds

  constructor() {
    super();
  }

  findNearestEnemy(owner: CircleEntity, world: PhysicsWorld): CircleEntity | null {
    let nearestEnemy: CircleEntity | null = null;
    let nearestDistance = Infinity;

    world.entities.forEach(entity => {
      if ((entity as any).isBot && entity.id !== owner.id && entity.health > 0) {
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
    
    // Maintain optimal distance for vortex attacks
    const optimalDistance = vortexConfig.vortexStopDistance * 0.8;
    
    if (distance > optimalDistance + 50) {
      // Move closer
      return {
        x: (target.position.x - owner.position.x) / distance,
        y: (target.position.y - owner.position.y) / distance
      };
    } else if (distance < optimalDistance - 50) {
      // Move away
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
    
    // Predict target movement
    const prediction = {
      x: target.position.x + target.velocity.x * 0.3,
      y: target.position.y + target.velocity.y * 0.3
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

    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    // Use special ability when target is at optimal vortex range
    return distance <= vortexConfig.vortexStopDistance + 100;
  }

  useSpecialAbility(owner: CircleEntity, target: CircleEntity, world: PhysicsWorld): void {
    // For vortex, special ability is the same as primary (enhanced vortex)
    const direction = this.calculateAttackDirection(owner, target);
    const vortex = Array.from(world.entities.values()).find(e => e.id === owner.id) as any;
    if (vortex?.primaryAttack) {
      vortex.primaryAttack.execute(owner, direction, world);
      this.lastSpecialUse = Date.now();
    }
  }
}

// Main Vortex character class
export class Vortex extends BaseCharacter {
  constructor() {
    super('vortex');
    
    // Initialize abilities
    this.primaryAttack = new PlasmaVortexAttack();
    
    // Register projectile behavior
    this.projectileBehaviors['vortex'] = vortexBehavior;
  }

  onUpdate(owner: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    const ai = new VortexAI();
    const target = ai.findNearestEnemy(owner, world);
    
    if (!target) return;
    
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    // Movement
    if (distance > 50) {
      const moveDirection = ai.calculateMovementDirection(owner, target);
      const moveSpeed = 150 * (deltaTime / 1000);
      owner.velocity.x = moveDirection.x * moveSpeed;
      owner.velocity.y = moveDirection.y * moveSpeed;
    }
    
    // Attack
    if (distance <= vortexConfig.attackRange) {
      if (ai.shouldUseSpecialAbility(owner, target)) {
        ai.useSpecialAbility(owner, target, world);
      } else if (!(this.primaryAttack as any).isOnCooldown || true) {
        const attackDirection = ai.calculateAttackDirection(owner, target);
        this.primaryAttack.execute(owner.id, attackDirection, world);
      }
    }
  }

  onDamaged(owner: CircleEntity, damage: number): void {
    // Create damage effect - handled by the game engine
    // EntityUtils.createEffect would need to be called with single object parameter
  }

  onKill(owner: CircleEntity, target: CircleEntity): void {
    // Create kill effect - would need world context to add effect
    // This is handled by the game engine when onKill is called
  }
}

// Export configuration and implementation
export { vortexConfig, PlasmaVortexAttack, vortexBehavior, VortexAI };
export default Vortex;