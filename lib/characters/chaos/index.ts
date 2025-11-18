import { BaseCharacter, BaseAbility, BaseAI } from '../baseCharacter';
import { CharacterConfig, getCharacterConfigSync } from '../../characterConfig';
import { Vector, CircleEntity, PhysicsWorld } from '../../physics';
import { CharacterAbility, ProjectileBehavior } from '../characterInterface';
import { createProjectile, EntityUtils } from '../characterUtils';

// Chaos Bomber character configuration
export const chaosConfig: CharacterConfig = getCharacterConfigSync('bomber');

// Mine Field primary attack
export class MineFieldAttack extends BaseAbility {
  constructor() {
    super('chaos', 500);
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;

    const owner = world.entities.get(entityId);
    if (!owner) return;

    // Create mine projectile
    const mine = createProjectile(
      entityId,
      owner,
      direction,
      {
        baseDamage: chaosConfig.damage,
        projectileSpeed: chaosConfig.projectileSpeed,
        radius: chaosConfig.bulletRadius,
        lifetime: chaosConfig.projectileLifetime,
        characterType: 'chaos'
      }
    );

    // Convert to mine after short travel
    (mine as any).isMine = true;
    (mine as any).armingTime = 800; // Time before mine becomes active
    (mine as any).detectionRadius = 60; // Range to detect enemies
    (mine as any).explosiveRadius = chaosConfig.explosiveRadius || 40;
    (mine as any).armed = false;
    (mine as any).createdAt = Date.now();

    // Arm the mine after travel time
    setTimeout(() => {
      const existingMine = world.entities.get(mine.id);
      if (existingMine) {
        (existingMine as any).armed = true;
        existingMine.velocity.x = 0;
        existingMine.velocity.y = 0;
        // Visual indicator that mine is armed
        (existingMine as any).color = '#ff4444'; // Red when armed
      }
    }, (mine as any).armingTime);

    world.entities.set(mine.id, mine);
    // Cooldown is handled by BaseAbility
  }
}

// Chaos mine behavior with proximity detection
export function chaosMineProjectileBehavior(projectile: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
  const mineProps = projectile as any;
  
  // Physics integration handles movement - no manual position update needed

  // Check for proximity detonation if mine is armed
  if (mineProps.isMine && mineProps.armed) {
    world.entities.forEach(entity => {
      if ((entity as any).isBot && entity.id !== projectile.ownerId) {
        const dx = entity.position.x - projectile.position.x;
        const dy = entity.position.y - projectile.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= (mineProps.detectionRadius || 60)) {
          // Detonate mine
          explodeMine(projectile, world);
          return;
        }
      }
    });
  }

  // Direct collision check for unarmed mines
  if (!mineProps.armed) {
    world.entities.forEach(entity => {
      if ((entity as any).isBot && entity.id !== projectile.ownerId) {
        const dx = entity.position.x - projectile.position.x;
        const dy = entity.position.y - projectile.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < entity.radius + projectile.radius) {
          // Direct hit - explode immediately
          explodeMine(projectile, world);
          return;
        }
      }
    });
  }

  // Remove mine if lifetime expired
  if (mineProps.createdAt && Date.now() - mineProps.createdAt > chaosConfig.projectileLifetime) {
    projectile.health = 0;
  }
}

// Mine explosion function
function explodeMine(mine: CircleEntity, world: PhysicsWorld): void {
  const mineProps = mine as any;
  const explosionRadius = mineProps.explosiveRadius || 40;
  const explosionDamage = (mine.damage || chaosConfig.damage) * 1.5;

  // Damage all enemies in explosion radius
  Array.from(world.entities.values()).forEach(entity => {
    if ((entity as any).isBot && entity.id !== mine.ownerId) {
      const dx = entity.position.x - mine.position.x;
      const dy = entity.position.y - mine.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= explosionRadius) {
        // Apply damage with falloff
        const damageMultiplier = 1 - (distance / explosionRadius) * 0.5;
        if (entity.health !== undefined) {
          entity.health -= explosionDamage * damageMultiplier;
        }

        // Apply knockback
        if (distance > 0) {
          const knockbackForce = 200 * damageMultiplier;
          const knockbackDir = {
            x: dx / distance,
            y: dy / distance
          };
          entity.velocity.x += knockbackDir.x * knockbackForce;
          entity.velocity.y += knockbackDir.y * knockbackForce;
        }
      }
    }
  });

  // Create explosion visual effect
  createExplosionEffect(mine.position, explosionRadius, world);

  // Chain reaction - detonate nearby mines
  world.entities.forEach(entity => {
    const entityProps = entity as any;
    if (entityProps.isMine && entityProps.armed && entity.id !== mine.id) {
      const dx = entity.position.x - mine.position.x;
      const dy = entity.position.y - mine.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= explosionRadius * 0.8) {
        // Chain detonate after short delay
        setTimeout(() => {
          const existingEntity = world.entities.get(entity.id);
          if (existingEntity) {
            explodeMine(existingEntity, world);
          }
        }, 100);
      }
    }
  });

  // Remove the exploded mine
  mine.health = 0;
}

// Create explosion visual effect
function createExplosionEffect(position: Vector, radius: number, world: PhysicsWorld): void {
  const effect = EntityUtils.createEffect({
    position: position,
    radius: radius,
    color: '#ff6600',
    lifetime: 300
  });
  world.entities.set(effect.id, effect);

  // Create multiple explosion particles
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const particle: CircleEntity = {
      id: `particle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'aura' as const,
      position: {
        x: position.x + Math.cos(angle) * 20,
        y: position.y + Math.sin(angle) * 20
      },
      velocity: {
        x: Math.cos(angle) * 150,
        y: Math.sin(angle) * 150
      },
      acceleration: { x: 0, y: 0 },
      radius: 3,
      mass: 0,
      health: 1,
      maxHealth: 1,
      damage: 0,
      restitution: 0,
      friction: 0,
      isStatic: false,
      invulnerableUntil: 0,
      lifetime: 400,
      properties: {
        visualEffects: {
          color: chaosConfig.bulletColor,
          trail: {
            color: chaosConfig.bulletColor,
            opacity: 0.5,
            lifetime: 400
          },
          glow: {
            color: chaosConfig.bulletColor,
            strength: 0.5
          }
        }
      }
    };
    world.entities.set(particle.id, particle);
  }
}

// Chaos Bomber AI
export class ChaosAI extends BaseAI {
  private lastMineTime: number = 0;
  private mineCooldown: number = 600;
  private mineCount: number = 0;
  private maxMines: number = 5;

  findNearestEnemy(owner: CircleEntity, world: PhysicsWorld): CircleEntity | null {
    let nearestEnemy: CircleEntity | null = null;
    let nearestDistance = Infinity;

    Array.from(world.entities.values()).forEach(entity => {
      if ((entity as any).isBot && entity.id !== owner.id && entity.health > 0) {
        const distance = this.getDistance(owner.position, entity.position);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestEnemy = entity;
        }
      }
    });

    return nearestEnemy;
  }

  getDistance(pos1: Vector, pos2: Vector): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getDirectionTo(from: Vector, to: Vector): Vector {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    return length > 0 ? { x: dx / length, y: dy / length } : { x: 0, y: 0 };
  }

  update(character: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    const nearestEnemy = this.findNearestEnemy(character, world);
    if (!nearestEnemy) return;

    const distance = this.getDistance(character.position, nearestEnemy.position);
    const attackRange = chaosConfig.attackRange;

    // Count active mines
    this.mineCount = 0;
    Array.from(world.entities.values()).forEach(entity => {
      const entityProps = entity as any;
      if (entityProps.isMine && entity.ownerId === character.id) {
        this.mineCount++;
      }
    });

    if (distance <= attackRange && this.mineCount < this.maxMines) {
      // Deploy mines strategically
      const now = Date.now();
      if (now - this.lastMineTime >= this.mineCooldown) {
        // Predict enemy movement and place mine ahead
        const predictedPosition = {
          x: nearestEnemy.position.x + nearestEnemy.velocity.x * 0.5,
          y: nearestEnemy.position.y + nearestEnemy.velocity.y * 0.5
        };

        const mineField = new MineFieldAttack();
        const direction = this.getDirectionTo(character.position, predictedPosition);
        mineField.execute(character.id, direction, world);
        this.lastMineTime = now;
      }
    } else if (distance > attackRange * 1.2) {
      // Move closer but maintain safe distance
      const direction = this.getDirectionTo(character.position, nearestEnemy.position);
      const speed = 80; // Slower movement for strategic positioning
      character.velocity.x = direction.x * speed;
      character.velocity.y = direction.y * speed;
    } else {
      // Maintain distance - kite enemies
      const direction = this.getDirectionTo(nearestEnemy.position, character.position);
      const speed = 60;
      character.velocity.x = direction.x * speed;
      character.velocity.y = direction.y * speed;
    }
  }
}

// Main Chaos Bomber character class
export default class Chaos extends BaseCharacter {
  private ai: ChaosAI;

  constructor() {
    super('chaos');
    this.primaryAttack = new MineFieldAttack();
    this.ai = new ChaosAI();
    
    // Set up projectile behaviors
    this.projectileBehaviors = {
      default: {
        onUpdate: chaosMineProjectileBehavior
      }
    };
  }

  onUpdate(entity: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    super.onUpdate(entity, world, deltaTime);
    
    // AI behavior for NPCs
    if ((entity as any).isBot) {
      this.ai.update(entity, world, deltaTime);
    }
  }

  getProjectileBehavior() {
    return chaosMineProjectileBehavior;
  }
}