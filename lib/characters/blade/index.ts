import { BaseCharacter, BaseAbility, BaseAI } from '../baseCharacter';
import { getCharacterConfigSync, CharacterConfig } from '../../characterConfig';
import { Vector, CircleEntity, PhysicsWorld, createProjectile } from '../../physics';
import { CharacterAbility, ProjectileBehavior } from '../characterInterface';
import { EntityUtils, stunTarget } from '../characterUtils';
import { ProjectileEntity } from '../projectileInterface';

// Blade Master character configuration
export const bladeConfig: CharacterConfig = {
  projectileLifetime: 1500,
  piercing: 1,
  trailOpacity: 0.7,
  trailLifetime: 500,
  multiShot: 1,
  spreadAngle: 0,
  homingStrength: 0,
  name: 'Blade Master',
  color: '#7c3aed', // Violet
  bulletColor: '#7c3aed',
  damage: 16,
  projectileSpeed: 400,
  bulletRadius: 3.92,
  firingRate: 350,
  attackRange: 200,
  bulletStyle: 'chain',
  bulletShape: 'arc',
  trailEffect: true,
  glowEffect: true,
  specialAbility: 'Lightning Edge',
  abilityDescription: 'Charges weapons with electrical energy that chains damage between nearby enemies',
  chainLightning: true,
  explosiveRadius: 25
};

// Lightning Edge primary attack
export class LightningEdgeAttack extends BaseAbility {
  constructor() {
    super('blade', 600);
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;

    const owner = world.entities.get(entityId);
    if (!owner) return;

    // Create arc projectile with chain lightning
    const projectile = createProjectile(
      `${entityId}_projectile_${Date.now()}`,
      owner.position.x,
      owner.position.y,
      direction,
      bladeConfig.projectileSpeed,
      entityId,
      bladeConfig.projectileLifetime,
      'blade'
    ) as ProjectileEntity & {
      chainLightning?: boolean;
      chainCount?: number;
      maxChains?: number;
      chainRange?: number;
      chainedTargets?: Set<string>;
      createdAt?: number;
    };

    // Add chain lightning behavior
    projectile.chainLightning = true;
    projectile.chainCount = 0;
    projectile.maxChains = 4;
    projectile.chainRange = 120;
    projectile.chainedTargets = new Set();
    projectile.createdAt = Date.now();
    projectile.damage = bladeConfig.damage;

    world.entities.set(projectile.id, projectile);
    // Cooldown is handled by BaseAbility
  }
}

// Blade projectile behavior with chain lightning
export function bladeProjectileBehavior(projectile: ProjectileEntity & {
  chainLightning?: boolean;
  chainCount?: number;
  maxChains?: number;
  chainRange?: number;
  chainedTargets?: Set<string>;
  createdAt?: number;
}, world: PhysicsWorld, deltaTime: number): void {
  // Physics integration handles movement - no manual position update needed

  // Check for collisions with enemies
  Array.from(world.entities.entries()).forEach(([entityId, entity]) => {
    if ((entity.type === 'player' || entity.type === 'hazard') && entity.id !== projectile.ownerId) {
      const dx = entity.position.x - projectile.position.x;
      const dy = entity.position.y - projectile.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < entity.radius + projectile.radius) {
        // Deal damage
        if (entity.health !== undefined) {
          entity.health -= projectile.damage || bladeConfig.damage;
        }

        // Chain lightning effect
        if (projectile.chainLightning && (projectile.chainCount || 0) < (projectile.maxChains || 3)) {
          chainLightningToNearbyEnemies(projectile, entity, world);
        }

        // Remove projectile after hit
        projectile.health = 0;
        return;
      }
    }
  });

  // Remove projectile if lifetime expired
  if (projectile.createdAt && Date.now() - projectile.createdAt > bladeConfig.projectileLifetime) {
    projectile.health = 0;
  }
}

// Chain lightning helper function
function chainLightningToNearbyEnemies(projectile: ProjectileEntity & {
  chainLightning?: boolean;
  chainCount?: number;
  maxChains?: number;
  chainRange?: number;
  chainedTargets?: Set<string>;
}, hitEnemy: CircleEntity, world: PhysicsWorld): void {
  const chainRange = projectile.chainRange || 120;
  let nearestEnemy: CircleEntity | null = null;
  let nearestDistance = Infinity;

  // Find nearest enemy within chain range
  Array.from(world.entities.entries()).forEach(([entityId, entity]) => {
    if ((entity.type === 'player' || entity.type === 'hazard') && 
        entity.id !== projectile.ownerId && 
        entity.id !== hitEnemy.id &&
        !projectile.chainedTargets?.has(entity.id)) {
      
      const dx = entity.position.x - hitEnemy.position.x;
      const dy = entity.position.y - hitEnemy.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= chainRange && distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = entity;
      }
    }
  });

  // Chain to nearest enemy
  if (nearestEnemy && 'health' in nearestEnemy) {
    // Deal chain damage (reduced) to enemy with health property
    const enemyWithHealth = nearestEnemy as CircleEntity & { health: number };
    if (enemyWithHealth.health !== undefined) {
      enemyWithHealth.health -= (projectile.damage || bladeConfig.damage) * 0.7;
    }

    // Apply brief electric stun for chain hit
    stunTarget(enemyWithHealth.id, 500, world);

    // Mark as chained
    if (!projectile.chainedTargets) {
      projectile.chainedTargets = new Set();
    }
    projectile.chainedTargets.add(enemyWithHealth.id);
    projectile.chainCount = (projectile.chainCount || 0) + 1;

    // Create visual chain effect
    createChainLightningEffect(hitEnemy.position, enemyWithHealth.position, world);

    // Continue chaining from new target
    if (projectile.chainCount < (projectile.maxChains || 3)) {
      setTimeout(() => {
        chainLightningToNearbyEnemies(projectile, enemyWithHealth, world);
      }, 100);
    }
  }
}

// Create visual chain lightning effect
function createChainLightningEffect(from: Vector, to: Vector, world: PhysicsWorld): void {
  const effect = EntityUtils.createEffect({
    position: from,
    color: bladeConfig.bulletColor,
    radius: 2,
    lifetime: 200
  });
  EntityUtils.addEffectToWorld(effect, world);
}

// Blade Master AI
export class BladeAI extends BaseAI {
  private lastChainTime: number = 0;
  private chainCooldown: number = 1000;

  findNearestEnemy(owner: CircleEntity, world: PhysicsWorld): CircleEntity | null {
    let nearestEnemy: CircleEntity | null = null;
    let nearestDistance = Infinity;

    Array.from(world.entities.values()).forEach(entity => {
      if ((entity.type === 'player' || entity.type === 'hazard') && entity.id !== owner.id) {
        const dx = entity.position.x - owner.position.x;
        const dy = entity.position.y - owner.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestEnemy = entity;
        }
      }
    });

    return nearestEnemy;
  }

  update(owner: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    const nearestEnemy = this.findNearestEnemy(owner, world);
    if (!nearestEnemy) return;

    const distance = Math.sqrt(
      (nearestEnemy.position.x - owner.position.x) ** 2 + 
      (nearestEnemy.position.y - owner.position.y) ** 2
    );
    const attackRange = bladeConfig.attackRange;

    if (distance <= attackRange) {
      // Close range - use Lightning Edge
      const now = Date.now();
      if (now - this.lastChainTime >= this.chainCooldown) {
        const direction = {
          x: (nearestEnemy.position.x - owner.position.x) / distance,
          y: (nearestEnemy.position.y - owner.position.y) / distance
        };
        const lightningEdge = new LightningEdgeAttack();
        lightningEdge.execute(owner.id, direction, world);
        this.lastChainTime = now;
      }
    } else {
      // Move closer to enemy
      const direction = {
        x: (nearestEnemy.position.x - owner.position.x) / distance,
        y: (nearestEnemy.position.y - owner.position.y) / distance
      };
      const speed = 100 * (deltaTime / 1000); // Moderate movement speed
      owner.velocity.x = direction.x * speed;
      owner.velocity.y = direction.y * speed;
    }
  }
}

// Main Blade Master character class
export default class Blade extends BaseCharacter {
  private ai: BladeAI;

  constructor() {
    super('blade');
    this.ai = new BladeAI();
    this.specialAbility = new LightningEdgeAttack();
    this.primaryAttack = this.specialAbility;
    this.projectileBehaviors = {
      blade: {
        onUpdate: bladeProjectileBehavior
      }
    };
  }

  onUpdate(entity: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    super.onUpdate(entity, world, deltaTime);
    
    // AI behavior for NPCs
    if (entity.type === 'hazard') {
      this.ai.update(entity, world, deltaTime);
    }
  }

  getProjectileBehavior() {
    return bladeProjectileBehavior;
  }
}