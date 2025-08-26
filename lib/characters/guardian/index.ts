// Guardian character implementation
import { Vector, CircleEntity, PhysicsWorld } from '../../physics';
import { BaseCharacter, BaseAbility, BaseAI } from '../baseCharacter';
import { CharacterAbility, ProjectileBehavior } from '../characterInterface';
import { createProjectile, EntityUtils } from '../characterUtils';
import { getCharacterConfigSync } from '../../characterConfig';

// Guardian character configuration
const guardianConfig = {
  name: 'Steel Guardian',
  color: '#10b981',
  bulletColor: '#10b981',
  damage: 18,
  projectileSpeed: 350,
  bulletRadius: 4.0,
  firingRate: 1000,
  attackRange: 400,
  multiShot: 1,
  spreadAngle: 0,
  tankHealth: 150,
  damageReduction: 0.25,
  knockbackResistance: 0.8,
  selfHeal: 2,
  chargeTime: 1000,
  waveGrowthRate: 1.8,
  damageOverTime: 15,
  dotDuration: 3000,
  slowEffectStrength: 0.4,
  slowDuration: 4000,
  barrierDuration: 5000,
  barrierRadius: 60
};

// Energy Wave Attack - Primary ability
class EnergyWaveAttack extends BaseAbility {
  private isCharging: boolean = false;
  private chargeStartTime: number = 0;

  constructor() {
    super('guardian', guardianConfig.firingRate);
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;

    const owner = world.entities.get(entityId) as CircleEntity;
    if (!owner) return;

    if (!this.isCharging) {
      // Start charging
      this.isCharging = true;
      this.chargeStartTime = Date.now();
      
      // Create charging effect
      const chargingEffect = EntityUtils.createEffect({
        position: owner.position,
        radius: 30,
        lifetime: guardianConfig.chargeTime,
        color: guardianConfig.bulletColor,
        opacity: 0.8
      });
      
      // Schedule wave release
      setTimeout(() => {
        this.releaseEnergyWave(owner, direction, world);
        this.isCharging = false;
        this.lastUsed = Date.now();
      }, guardianConfig.chargeTime);
    }
  }

  private releaseEnergyWave(owner: CircleEntity, direction: Vector, world: PhysicsWorld): void {
    // Create expanding energy wave
    const wave = createProjectile(owner.id, owner, direction, {
      projectileSpeed: guardianConfig.projectileSpeed,
      baseDamage: guardianConfig.damage,
      radius: 10, // Starting radius
      lifetime: 3000,
      piercing: 999, // Pierces through all enemies
      characterType: 'guardian'
    });

    // Add energy wave properties
    wave.properties = {
      ...wave.properties,
      visualEffects: {
        color: guardianConfig.bulletColor,
        trail: {
          color: guardianConfig.bulletColor,
          opacity: 0.6,
          lifetime: 800
        },
        glow: {
          color: guardianConfig.bulletColor,
          strength: 1.0
        }
      },
      ...({} as any)
    };
    
    // Add custom properties using type assertion
    (wave.properties as any).isEnergyWave = true;
    (wave.properties as any).waveGrowthRate = guardianConfig.waveGrowthRate;
    (wave.properties as any).damageOverTime = guardianConfig.damageOverTime;
    (wave.properties as any).dotDuration = guardianConfig.dotDuration;
    (wave.properties as any).slowEffectStrength = guardianConfig.slowEffectStrength;
    (wave.properties as any).slowDuration = guardianConfig.slowDuration;
    (wave.properties as any).hitTargets = new Set();
    (wave.properties as any).creationTime = Date.now();

    world.entities.set(wave.id, wave);
  }
}

// Barrier Shield - Special ability
class BarrierShield extends BaseAbility {
  constructor() {
    super('guardian', 8000); // 8 second cooldown
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;

    const owner = world.entities.get(entityId) as CircleEntity;
    if (!owner) return;

    // Create protective barrier around guardian
    const barrier: CircleEntity = {
      id: `barrier_${Date.now()}`,
      position: { ...owner.position },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      radius: 60,
      mass: 1,
      health: 100,
      maxHealth: 100,
      damage: 0,
      restitution: 0.8,
      friction: 0.1,
      isStatic: true,
      type: 'hazard' as const,
      ownerId: owner.id,
      properties: {
        visualEffects: {
          color: guardianConfig.bulletColor,
          trail: {
            color: guardianConfig.bulletColor,
            opacity: 0.3,
            lifetime: 500
          },
          glow: {
            color: guardianConfig.bulletColor,
            strength: 0.6
          }
        }
      }
    };

    // Add custom barrier properties
    (barrier.properties as any).isBarrier = true;
    (barrier.properties as any).duration = guardianConfig.barrierDuration;
    (barrier.properties as any).creationTime = Date.now();
    (barrier.properties as any).reflectProjectiles = true;
    (barrier.properties as any).damageReduction = 0.5;

    world.entities.set(barrier.id, barrier);
    
    // Create barrier effect
    const barrierEffect = EntityUtils.createEffect({
      position: owner.position,
      radius: 60,
      lifetime: 5000,
      color: guardianConfig.bulletColor,
      opacity: 0.6
    });

    this.lastUsed = Date.now();
  }
}

// Energy wave projectile behavior
const energyWaveBehavior: ProjectileBehavior = {
  onUpdate: (projectile: CircleEntity, world: PhysicsWorld, deltaTime: number) => {
    if (!(projectile.properties as any)?.isEnergyWave) return;

    const currentTime = Date.now();
    const age = currentTime - (projectile.properties as any).creationTime;
    
    // Expand the wave over time
    const growthFactor = 1 + (age / 1000) * (projectile.properties as any).waveGrowthRate;
    projectile.radius = Math.min(10 * growthFactor, 80); // Max radius of 80
    
    // Check for enemy hits
    world.entities.forEach(entity => {
      if (entity.id !== projectile.ownerId && (entity as any).type === 'character' &&
              !(projectile.properties as any).hitTargets.has(entity.id)) {
        
        const distance = Math.sqrt(
          (entity.position.x - projectile.position.x) ** 2 + 
          (entity.position.y - projectile.position.y) ** 2
        );
        
        if (distance <= projectile.radius + entity.radius) {
          // Mark as hit
          (projectile.properties as any).hitTargets.add(entity.id);
          
          // Apply immediate damage
          entity.health -= projectile.damage;
          
          // Apply DoT effect
           if (!entity.properties) entity.properties = {
             visualEffects: {
               color: guardianConfig.bulletColor,
               trail: {
                 color: guardianConfig.bulletColor,
                 opacity: 0.5,
                 lifetime: 500
               },
               glow: {
                 color: guardianConfig.bulletColor,
                 strength: 0.5
               }
             }
           };
           (entity.properties as any).dotEffect = {
            damage: (projectile.properties as any).damageOverTime,
            duration: (projectile.properties as any).dotDuration,
            tickRate: 500,
            startTime: currentTime,
            lastTick: currentTime
          };
          
          // Apply slow effect
          (entity.properties as any).slowEffect = {
            strength: (projectile.properties as any).slowEffectStrength,
            duration: (projectile.properties as any).slowDuration,
            startTime: currentTime
          };
          
          // Create hit effect
          const hitEffect = EntityUtils.createEffect({
            position: entity.position,
            radius: 20,
            lifetime: 400,
            color: guardianConfig.bulletColor
          });
        }
      }
    });
  },

  onCollision: (projectile: CircleEntity, target: CircleEntity, world: PhysicsWorld) => {
    // Energy waves don't stop on collision, they pass through
    if ((projectile.properties as any)?.isEnergyWave) {
      return; // Don't destroy the wave
    }
  }
};

// Guardian AI implementation
class GuardianAI extends BaseAI {
  private lastSpecialUse: number = 0;
  private specialCooldown: number = 8000;
  private lastHealTime: number = 0;

  constructor() {
    super();
  }

  findNearestEnemy(owner: CircleEntity, world: PhysicsWorld): CircleEntity | null {
    let nearestEnemy: CircleEntity | null = null;
    let nearestDistance = Infinity;

    world.entities.forEach(entity => {
      if (entity.id !== owner.id && (entity as any).type === 'character' && entity.health > 0) {
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
    
    // Guardian prefers medium range for energy waves
    const optimalDistance = guardianConfig.attackRange * 0.7;
    
    if (distance > optimalDistance + 30) {
      // Move closer
      return {
        x: (target.position.x - owner.position.x) / distance,
        y: (target.position.y - owner.position.y) / distance
      };
    } else if (distance < optimalDistance - 30) {
      // Move away slightly
      return {
        x: (owner.position.x - target.position.x) / distance * 0.5,
        y: (owner.position.y - target.position.y) / distance * 0.5
      };
    }
    
    // Hold position
    return { x: 0, y: 0 };
  }

  calculateAttackDirection(owner: CircleEntity, target: CircleEntity): Vector {
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
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

    // Use barrier when health is low or multiple enemies nearby
    const healthPercentage = owner.health / owner.maxHealth;
    return healthPercentage < 0.5;
  }

  useSpecialAbility(owner: CircleEntity, target: CircleEntity, world: PhysicsWorld): void {
    // Find the guardian character from the owner
    const guardian = owner as unknown as Guardian;
    if (guardian.specialAbility) {
      guardian.specialAbility.execute(owner.id, { x: 0, y: 0 }, world);
    }
    this.lastSpecialUse = Date.now();
  }

  handleSelfHeal(owner: CircleEntity, deltaTime: number): void {
    const currentTime = Date.now();
    if (currentTime - this.lastHealTime > 1000) { // Heal every second
      if (owner.health < owner.maxHealth) {
        owner.health = Math.min(owner.maxHealth, owner.health + guardianConfig.selfHeal);
        this.lastHealTime = currentTime;
      }
    }
  }
}

// Main Guardian character class
export class Guardian extends BaseCharacter {
  private ai: GuardianAI;

  constructor() {
    super('guardian');
    
    // Initialize abilities
    this.primaryAttack = new EnergyWaveAttack();
    this.specialAbility = new BarrierShield();
    this.ai = new GuardianAI();
    
    // Register projectile behavior
    this.projectileBehaviors['guardian'] = energyWaveBehavior;
  }

  onUpdate(owner: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    const target = this.ai.findNearestEnemy(owner, world);
    
    // Handle self-healing
    this.ai.handleSelfHeal(owner, deltaTime);
    
    // Apply tank properties
    if (!owner.properties) owner.properties = {
      visualEffects: {
        color: guardianConfig.bulletColor,
        trail: {
          color: guardianConfig.bulletColor,
          opacity: 0.5,
          lifetime: 500
        },
        glow: {
          color: guardianConfig.bulletColor,
          strength: 0.5
        }
      }
    };
    (owner.properties as any).damageReduction = guardianConfig.damageReduction;
    (owner.properties as any).knockbackResistance = guardianConfig.knockbackResistance;
    
    if (!target) return;
    
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    // Movement (slower for tank)
    if (distance > 50) {
      const moveDirection = this.ai.calculateMovementDirection(owner, target);
      const moveSpeed = 100 * (deltaTime / 1000); // Slower than other characters
      owner.velocity.x = moveDirection.x * moveSpeed;
      owner.velocity.y = moveDirection.y * moveSpeed;
    }
    
    // Attack
    if (distance <= guardianConfig.attackRange) {
      if (this.ai.shouldUseSpecialAbility(owner, target)) {
      this.ai.useSpecialAbility(owner, target, world);
    } else if (!this.primaryAttack.isOnCooldown()) {
        const attackDirection = this.ai.calculateAttackDirection(owner, target);
        this.primaryAttack.execute(owner.id, attackDirection, world);
      }
    }
  }

  onDamaged(entity: CircleEntity, damageAmount: number, source: CircleEntity | null): void {
    // Apply damage reduction
    const reducedDamage = damageAmount * (1 - guardianConfig.damageReduction);
    entity.health += damageAmount - reducedDamage; // Restore the difference
    
    // Create damage effect
    const effect = EntityUtils.createEffect({
      position: entity.position,
      radius: 15,
      lifetime: 300,
      color: '#ff4444'
    });
  }

  onKill(entity: CircleEntity, target: CircleEntity): void {
    // Create kill effect
    const effect = EntityUtils.createEffect({
      position: target.position,
      radius: 25,
      lifetime: 600,
      color: guardianConfig.bulletColor
    });
  }
}

// Export configuration and implementation
export { guardianConfig, EnergyWaveAttack, BarrierShield, energyWaveBehavior, GuardianAI };
export default Guardian;