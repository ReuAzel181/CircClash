import { BaseCharacter, BaseAbility, BaseAI, createStandardProjectile } from '../baseCharacter';
import { getCharacterConfigSync, CharacterConfig } from '../../characterConfig';
import { Vector, CircleEntity, PhysicsWorld } from '../../physics';
import { CharacterAbility, ProjectileBehavior } from '../characterInterface';
import { createProjectile, EntityUtils } from '../characterUtils';

// Void Sniper character configuration
export const voidConfig: CharacterConfig = {
  projectileLifetime: 2500,
  piercing: 1,
  trailOpacity: 0.8,
  trailLifetime: 700,
  multiShot: 1,
  spreadAngle: 0,
  homingStrength: 0,
  name: 'Void Sniper',
  color: '#0f172a', // Dark Slate
  bulletColor: '#0f172a',
  damage: 22,
  projectileSpeed: 1000,
  bulletRadius: 1.96,
  firingRate: 800,
  attackRange: 650,
  bulletStyle: 'rift',
  bulletShape: 'ironhand',
  trailEffect: true,
  glowEffect: true,
  specialAbility: 'Void Rifts',
  abilityDescription: 'Opens dimensional rifts that allow attacks from unexpected angles'
};

// Void Rifts primary attack
export class VoidRiftsAttack extends BaseAbility {
  constructor() {
    super('void', 800);
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;

    const owner = world.entities.get(entityId);
    if (!owner) return;

    // Create void rift projectile
    const riftProjectile = createStandardProjectile(
      entityId,
      owner,
      direction,
      voidConfig,
      {}
    );

    if (riftProjectile) {
      // Add void rift properties
      const riftSpecial = riftProjectile as any;
      riftSpecial.isVoidRift = true;
      riftSpecial.riftPhase = 'traveling'; // traveling -> opening -> active -> closing
      riftSpecial.riftDuration = 2000;
      riftSpecial.riftRange = 100;
      riftSpecial.originalTarget = {
        x: owner.position.x + direction.x * 300,
        y: owner.position.y + direction.y * 300
      };
      riftSpecial.spawnTime = Date.now();

      world.addEntity(riftProjectile);
    }
    this.lastUsed = Date.now();
  }
}

// Void rift projectile behavior with dimensional mechanics
export function voidRiftProjectileBehavior(projectile: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
  const projectileSpecial = projectile as any;
  if (!projectileSpecial.isVoidRift) {
    // Standard projectile behavior for non-rift projectiles
    projectile.position.x += projectile.velocity.x * deltaTime;
    projectile.position.y += projectile.velocity.y * deltaTime;
    return;
  }

  const now = Date.now();
  const age = now - (projectileSpecial.createdAt || projectileSpecial.spawnTime || now);

  switch (projectileSpecial.riftPhase) {
    case 'traveling':
      // Move toward target
      projectile.position.x += projectile.velocity.x * deltaTime;
      projectile.position.y += projectile.velocity.y * deltaTime;

      // Check if reached target area or hit enemy
      const targetDistance = Math.sqrt(
        Math.pow(projectile.position.x - (projectileSpecial.originalTarget?.x || 0), 2) +
        Math.pow(projectile.position.y - (projectileSpecial.originalTarget?.y || 0), 2)
      );

      if (targetDistance < 50 || age > 1000) {
        // Open rift at current location
        openVoidRift(projectile, world);
      }

      // Check for direct hits during travel
      checkDirectHit(projectile, world);
      break;

    case 'opening':
      // Rift is opening - stop movement and grow
      projectile.velocity.x = 0;
      projectile.velocity.y = 0;
      projectile.radius = Math.min(projectile.radius * 1.1, 15);
      
      if (age > 1200) {
        projectileSpecial.riftPhase = 'active';
        createRiftAttacks(projectile, world);
      }
      break;

    case 'active':
      // Rift is active - continue attacking
      if (age > projectileSpecial.riftDuration) {
        projectileSpecial.riftPhase = 'closing';
      }
      break;

    case 'closing':
      // Rift is closing - shrink and disappear
      projectile.radius *= 0.9;
      if (projectile.radius < 1 || age > projectileSpecial.riftDuration + 500) {
        projectile.health = 0;
      }
      break;
  }

  // Remove if lifetime exceeded
  if (age > voidConfig.projectileLifetime + 2000) {
    projectile.health = 0;
  }
}

// Open void rift at projectile location
function openVoidRift(projectile: CircleEntity, world: PhysicsWorld): void {
  const projectileSpecial = projectile as any;
  projectileSpecial.riftPhase = 'opening';
  projectile.velocity.x = 0;
  projectile.velocity.y = 0;
  projectileSpecial.color = '#4c1d95'; // Deep purple for rift

  // Create rift opening effect
  const riftEffect = EntityUtils.createEffect({
    position: projectile.position,
    color: '#8b5cf6',
    radius: 20,
    lifetime: 800
  });
  world.entities.set(riftEffect.id, riftEffect);
}

// Create rift attacks targeting nearby enemies
function createRiftAttacks(rift: CircleEntity, world: PhysicsWorld): void {
  const riftSpecial = rift as any;
  const riftRange = riftSpecial.riftRange || 100;
  const nearbyEnemies: CircleEntity[] = [];

  // Find enemies within rift range
  world.entities.forEach(entity => {
    if ((entity.type === 'player' || entity.type === 'character') && entity.id !== rift.ownerId) {
      const dx = entity.position.x - rift.position.x;
      const dy = entity.position.y - rift.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= riftRange) {
        nearbyEnemies.push(entity);
      }
    }
  });

  // Attack up to 3 nearest enemies
  const targets = nearbyEnemies
    .sort((a, b) => {
      const distA = Math.sqrt(
        Math.pow(a.position.x - rift.position.x, 2) +
        Math.pow(a.position.y - rift.position.y, 2)
      );
      const distB = Math.sqrt(
        Math.pow(b.position.x - rift.position.x, 2) +
        Math.pow(b.position.y - rift.position.y, 2)
      );
      return distA - distB;
    })
    .slice(0, 3);

  // Create void strikes for each target
  targets.forEach((target, index) => {
    setTimeout(() => {
      createVoidStrike(rift, target, world);
    }, index * 200);
  });
}

// Create void strike from rift to target
function createVoidStrike(rift: CircleEntity, target: CircleEntity, world: PhysicsWorld): void {
  const targetExists = world.entities.has(target.id);
  if (!targetExists) return;

  // Deal damage
  if (target.health !== undefined) {
    const riftSpecial = rift as any;
    target.health -= (riftSpecial.damage || rift.damage || voidConfig.damage) * 1.2;
  }

  // Create void strike visual effect
  const strikeEffect = EntityUtils.createEffect({
    position: rift.position,
    color: '#1e1b4b',
    radius: 3,
    lifetime: 300
  });
  world.entities.set(strikeEffect.id, strikeEffect);

  // Create impact effect at target
  const impactEffect = EntityUtils.createEffect({
    position: target.position,
    color: '#6366f1',
    radius: 15,
    lifetime: 400
  });
  world.entities.set(impactEffect.id, impactEffect);
}

// Check for direct hits during travel phase
function checkDirectHit(projectile: CircleEntity, world: PhysicsWorld): void {
  world.entities.forEach(entity => {
    if ((entity.type === 'player' || entity.type === 'character') && entity.id !== projectile.ownerId) {
      const dx = entity.position.x - projectile.position.x;
      const dy = entity.position.y - projectile.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < entity.radius + projectile.radius) {
        // Deal direct hit damage
        if (entity.health !== undefined) {
          entity.health -= projectile.damage || voidConfig.damage;
        }

        // Open rift at hit location
        openVoidRift(projectile, world);
        return;
      }
    }
  });
}

// Void Sniper AI
export class VoidAI extends BaseAI {
  private lastRiftTime: number = 0;
  private riftCooldown: number = 1000;
  private preferredRange: number = 500;

  findNearestEnemy(owner: CircleEntity, world: PhysicsWorld): CircleEntity | null {
    let nearestEnemy: CircleEntity | null = null;
    let minDistance = Infinity;

    world.entities.forEach(entity => {
      if ((entity.type === 'player' || entity.type === 'character') && entity.id !== owner.id) {
        const distance = this.getDistance(owner.position, entity.position);
        if (distance < minDistance) {
          minDistance = distance;
          nearestEnemy = entity;
        }
      }
    });

    return nearestEnemy;
  }

  getDistance(pos1: Vector, pos2: Vector): number {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
  }

  getDirectionTo(from: Vector, to: Vector): Vector {
    const distance = this.getDistance(from, to);
    return {
      x: (to.x - from.x) / distance,
      y: (to.y - from.y) / distance
    };
  }

  update(character: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    const nearestEnemy = this.findNearestEnemy(character, world);
    if (!nearestEnemy) return;

    const distance = this.getDistance(character.position, nearestEnemy.position);
    const attackRange = voidConfig.attackRange;

    if (distance <= attackRange && distance >= this.preferredRange * 0.7) {
      // Optimal range - use Void Rifts
      const now = Date.now();
      if (now - this.lastRiftTime >= this.riftCooldown) {
        // Predict enemy movement for better accuracy
        const predictedPosition = {
          x: nearestEnemy.position.x + nearestEnemy.velocity.x * 0.8,
          y: nearestEnemy.position.y + nearestEnemy.velocity.y * 0.8
        };

        const voidRifts = new VoidRiftsAttack();
        const direction = this.getDirectionTo(character.position, predictedPosition);
        voidRifts.execute(character.id, direction, world);
        this.lastRiftTime = now;
      }
    } else if (distance < this.preferredRange * 0.7) {
      // Too close - maintain distance
      const direction = this.getDirectionTo(nearestEnemy.position, character.position);
      const speed = 120;
      character.velocity.x = direction.x * speed;
      character.velocity.y = direction.y * speed;
    } else if (distance > attackRange) {
      // Too far - move closer but maintain range
      const direction = this.getDirectionTo(character.position, nearestEnemy.position);
      const speed = 90;
      character.velocity.x = direction.x * speed;
      character.velocity.y = direction.y * speed;
    } else {
      // Good position - stop and aim
      character.velocity.x *= 0.8;
      character.velocity.y *= 0.8;
    }
  }
}

// Main Void Sniper character class
export default class Void extends BaseCharacter {
  private voidRifts: VoidRiftsAttack;
  private ai: VoidAI;

  constructor() {
    super('void');
    this.voidRifts = new VoidRiftsAttack();
    this.ai = new VoidAI();
    this.primaryAttack = this.voidRifts;
  }

  onUpdate(entity: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    super.onUpdate(entity, world, deltaTime);
    
    // AI behavior for NPCs
    if (entity.type === 'character') {
      this.ai.update(entity, world, deltaTime);
    }
  }

  // This will be handled by the primaryAttack ability

  getProjectileBehavior() {
    return voidRiftProjectileBehavior;
  }
}