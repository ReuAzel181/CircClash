// Consolidated Archer character implementation
import { CircleEntity, PhysicsWorld, Vector } from '../../physics';
import { BaseCharacter, BaseAbility } from '../baseCharacter';
import { CharacterAbility, ProjectileBehavior } from '../characterInterface';
import { ProjectileEntity } from '../projectileInterface';
import { createProjectile } from '../characterUtils';
import { EntityUtils } from '../characterUtils';

// Archer configuration
const archerConfig = {
  name: 'Wind Archer',
  color: '#4ade80',
  bulletColor: '#4ade80',
  damage: 35,
  projectileSpeed: 450,
  bulletRadius: 3,
  firingRate: 600,
  attackRange: 600,
  projectileLifetime: 2000,
  piercing: 1,
  trailOpacity: 0.7,
  trailLifetime: 400,
  multiShot: 3,
  spreadAngle: 15,
  homingStrength: 0.2,
  bulletStyle: 'piercing',
  bulletShape: 'arrow',
  trailEffect: true,
  glowEffect: true,
  specialAbility: 'Wind Tunnel',
  abilityDescription: 'Creates a wind tunnel that accelerates friendly projectiles and deflects enemy projectiles',
  tunnelDuration: 3000,
  tunnelWidth: 40,
  tunnelLength: 300,
  projectileSpeedBoost: 1.5,
  deflectionAngle: 45,
};

// Primary attack - Triple Arrow Shot
class TripleArrowAttack extends BaseAbility {
  constructor() {
    super('archer', archerConfig.firingRate);
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;
    super.execute(entityId, direction, world);

    const entity = world.entities.get(entityId);
    if (!entity) return;

    const angles = [-archerConfig.spreadAngle, 0, archerConfig.spreadAngle];
    
    angles.forEach(angle => {
      const spreadDirection = EntityUtils.getDirectionFromAngle(
        Math.atan2(direction.y, direction.x) + (angle * Math.PI / 180)
      );

      const projectile = createProjectile(
        `${entityId}_arrow_${Date.now()}`,
        entity,
        spreadDirection,
        {
          projectileSpeed: archerConfig.projectileSpeed,
          baseDamage: archerConfig.damage,
          radius: archerConfig.bulletRadius,
          lifetime: archerConfig.projectileLifetime,
          piercing: archerConfig.piercing,
          characterType: 'archer',
          visualEffects: {
            color: archerConfig.bulletColor,
            trail: {
              color: archerConfig.bulletColor,
              opacity: archerConfig.trailOpacity,
              lifetime: archerConfig.trailLifetime
            },
            glow: {
              color: archerConfig.bulletColor,
              strength: 0.5
            }
          },
          homingStrength: archerConfig.homingStrength
        }
      );
      world.entities.set(projectile.id, projectile);
    });
  }
}

// Special ability - Wind Tunnel
class WindTunnelAbility extends BaseAbility {
  private static readonly COOLDOWN = 8000;

  constructor() {
    super('archer', WindTunnelAbility.COOLDOWN);
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    if (this.isOnCooldown()) return;
    super.execute(entityId, direction, world);

    const entity = world.entities.get(entityId);
    if (!entity) return;

    const tunnel = {
      position: { x: entity.position.x, y: entity.position.y },
      direction,
      width: archerConfig.tunnelWidth,
      length: archerConfig.tunnelLength,
      duration: archerConfig.tunnelDuration,
      speedBoost: archerConfig.projectileSpeedBoost,
      deflectionAngle: archerConfig.deflectionAngle
    };

    const windTunnelEffect = {
      type: 'windTunnel',
      ...tunnel,
      createdAt: Date.now(),
      ownerId: entityId
    };
    (world as any).effects = (world as any).effects || [];
    (world as any).effects.push(windTunnelEffect);

    const visualEffect = EntityUtils.createEffect({
      position: entity.position,
      radius: tunnel.width / 2,
      color: archerConfig.color,
      opacity: 0.3,
      lifetime: tunnel.duration,
      glowStrength: 0.3,
      trailOptions: {
        color: archerConfig.color,
        opacity: 0.2,
        lifetime: tunnel.duration / 2
      }
    });

    (visualEffect as any).properties = {
      ...(visualEffect as any).properties,
      direction,
      length: tunnel.length,
      type: 'windTunnel'
    };

    EntityUtils.addEffectToWorld(visualEffect, world);
  }
}

// Arrow projectile behavior
const arrowBehavior: ProjectileBehavior = {
  onUpdate(projectile: ProjectileEntity, world: PhysicsWorld, deltaTime: number): void {
    const effect: any = projectile;
    if (archerConfig.homingStrength > 0) {
      const nearestTarget = findNearestTarget(projectile, world);
      if (nearestTarget) {
        const toTarget = Vector.subtract(nearestTarget.position, projectile.position);
        const normalizedToTarget = Vector.normalize(toTarget);
        
        projectile.velocity = Vector.lerp(
          projectile.velocity,
          Vector.multiply(normalizedToTarget, projectile.speed),
          archerConfig.homingStrength * deltaTime
        );
      }
    }

    const windTunnels = ((world as any).effects || []).filter((effect: any) => effect.type === 'windTunnel');
    for (const tunnel of windTunnels) {
      if (isInWindTunnel(projectile, tunnel)) {
        if (projectile.ownerId === tunnel.ownerId) {
          projectile.velocity = Vector.multiply(
            projectile.velocity,
            tunnel.speedBoost
          );
        } else {
          deflectProjectile(projectile, tunnel);
        }
      }
    }
  },

  onCollision(projectile: ProjectileEntity, target: ProjectileEntity, world: PhysicsWorld): void {
    const impactEffect = EntityUtils.createEffect({
      position: projectile.position,
      radius: projectile.radius * 2,
      color: archerConfig.bulletColor,
      opacity: 0.5,
      lifetime: 200,
      glowStrength: 0.5
    });
    EntityUtils.addEffectToWorld(impactEffect, world);
  }
};

// AI behavior
class ArcherAI {
  private static readonly PREFERRED_DISTANCE = archerConfig.attackRange * 0.7;
  private static readonly MIN_DISTANCE = archerConfig.attackRange * 0.3;
  private static readonly DODGE_THRESHOLD = 150;
  private static readonly REPOSITION_TIME = 2000;

  private lastRepositionTime: number = 0;

  update(entity: CircleEntity, world: PhysicsWorld, deltaTime: number): { moveDirection: Vector | null; attackDirection: Vector | null; useSpecial: boolean } {
    const nearestEnemy = this.findNearestEnemy(entity, world);
    if (!nearestEnemy) return { moveDirection: null, attackDirection: null, useSpecial: false };

    const toEnemy = Vector.subtract(nearestEnemy.position, entity.position);
    const distanceToEnemy = Vector.magnitude(toEnemy);

    const moveDirection = this.calculateMovementDirection(entity, nearestEnemy, world);
    const attackDirection = this.calculateAttackDirection(entity, nearestEnemy, world);
    const useSpecial = this.shouldUseSpecialAbility(entity, nearestEnemy, world);

    return { moveDirection, attackDirection, useSpecial };
  }

  private findNearestEnemy(entity: CircleEntity, world: PhysicsWorld): CircleEntity | null {
    let nearest = null;
    let minDistance = Infinity;

    for (const other of world.entities.values()) {
      if (other === entity || (other as any).team === (entity as any).team) continue;

      const distance = Vector.distance(entity.position, other.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = other;
      }
    }

    return nearest;
  }

  private calculateMovementDirection(entity: CircleEntity, enemy: CircleEntity, world: PhysicsWorld): Vector | null {
    const toEnemy = Vector.subtract(enemy.position, entity.position);
    const distanceToEnemy = Vector.magnitude(toEnemy);
    const normalizedToEnemy = Vector.normalize(toEnemy);

    const incomingProjectile = this.findDangerousProjectile(entity, world);
    if (incomingProjectile) {
      return this.calculateDodgeDirection(entity, incomingProjectile, world);
    }

    if (distanceToEnemy < ArcherAI.MIN_DISTANCE) {
      return Vector.multiply(normalizedToEnemy, -1);
    } else if (distanceToEnemy > ArcherAI.PREFERRED_DISTANCE) {
      return normalizedToEnemy;
    }

    if (Date.now() - this.lastRepositionTime > ArcherAI.REPOSITION_TIME) {
      this.lastRepositionTime = Date.now();
      return this.calculateRepositionDirection(entity, enemy, world);
    }

    return null;
  }

  private calculateAttackDirection(entity: CircleEntity, enemy: CircleEntity, world: PhysicsWorld): Vector {
    const toEnemy = Vector.subtract(enemy.position, entity.position);
    
    const predictedPosition = Vector.add(
      enemy.position,
      Vector.multiply(enemy.velocity, Vector.magnitude(toEnemy) / archerConfig.projectileSpeed)
    );
    
    return Vector.normalize(Vector.subtract(predictedPosition, entity.position));
  }

  private shouldUseSpecialAbility(entity: CircleEntity, enemy: CircleEntity, world: PhysicsWorld): boolean {
    const enemiesInLine = this.countEnemiesInLine(entity, enemy, world);
    const enemyEscaping = Vector.magnitude(enemy.velocity) > 0 && 
                         Vector.dot(Vector.normalize(enemy.velocity), 
                                   Vector.normalize(Vector.subtract(enemy.position, entity.position))) > 0.7;
    const incomingProjectiles = this.countIncomingProjectiles(entity, world) > 1;

    return enemiesInLine >= 2 || enemyEscaping || incomingProjectiles;
  }

  private findDangerousProjectile(entity: CircleEntity, world: PhysicsWorld): ProjectileEntity | null {
    for (const projectile of world.entities.values()) {
      if (projectile.type !== 'projectile') continue;
      const projEntity = projectile as unknown as ProjectileEntity;
      if (projEntity.ownerId === entity.id || (entity as any).team === (projEntity as any).team) continue;

      const toProjectile = Vector.subtract(projEntity.position, entity.position);
      const distance = Vector.magnitude(toProjectile);

      if (distance < ArcherAI.DODGE_THRESHOLD && 
          Vector.dot(Vector.normalize(projEntity.velocity), Vector.normalize(toProjectile)) < -0.7) {
        return projEntity;
      }
    }

    return null;
  }

  private calculateDodgeDirection(entity: CircleEntity, projectile: CircleEntity, world: PhysicsWorld): Vector {
    const toProjectile = Vector.subtract(projectile.position, entity.position);
    const perpendicular = { x: -toProjectile.y, y: toProjectile.x };
    return Vector.normalize(perpendicular);
  }

  private calculateRepositionDirection(entity: CircleEntity, enemy: CircleEntity, world: PhysicsWorld): Vector {
    const toEnemy = Vector.subtract(enemy.position, entity.position);
    const perpendicular = { x: -toEnemy.y, y: toEnemy.x };
    return Vector.normalize(perpendicular);
  }

  private countEnemiesInLine(entity: CircleEntity, mainEnemy: CircleEntity, world: PhysicsWorld): number {
    const direction = Vector.normalize(Vector.subtract(mainEnemy.position, entity.position));
    let count = 0;

    for (const other of world.entities.values()) {
      if (other === entity || other === mainEnemy || (other as any).team === (entity as any).team) continue;

      const toOther = Vector.normalize(Vector.subtract(other.position, entity.position));
      if (Vector.dot(direction, toOther) > 0.9) {
        count++;
      }
    }

    return count;
  }

  private countIncomingProjectiles(entity: CircleEntity, world: PhysicsWorld): number {
    let count = 0;

    for (const projectile of world.entities.values()) {
      if (projectile.type !== 'projectile') continue;
      const projEntity = projectile as unknown as ProjectileEntity;
      if (projEntity.ownerId === entity.id || (entity as any).team === (projEntity as any).team) continue;

      const toProjectile = Vector.subtract(projEntity.position, entity.position);
      const distance = Vector.magnitude(toProjectile);
      if (distance < ArcherAI.DODGE_THRESHOLD && 
          Vector.dot(Vector.normalize(projEntity.velocity), Vector.normalize(toProjectile)) < -0.5) {
        count++;
      }
    }

    return count;
  }
}

// Helper functions
function findNearestTarget(projectile: ProjectileEntity, world: PhysicsWorld): CircleEntity | null {
  let nearestDist = Infinity;
  let nearestTarget = null;

  for (const entity of world.entities.values()) {
    if (entity.id === projectile.ownerId) continue;
    
    const dist = Vector.distance(projectile.position, entity.position);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestTarget = entity;
    }
  }

  return nearestTarget;
}

function isInWindTunnel(projectile: ProjectileEntity, tunnel: any): boolean {
  const toProjectile = Vector.subtract(projectile.position, tunnel.position);
  const projectedDist = Vector.dot(toProjectile, tunnel.direction);
  const perpDist = toProjectile.x * tunnel.direction.y - toProjectile.y * tunnel.direction.x;

  return projectedDist >= 0 && 
         projectedDist <= tunnel.length && 
         Math.abs(perpDist) <= tunnel.width / 2;
}

function deflectProjectile(projectile: ProjectileEntity, tunnel: any): void {
  const currentAngle = Math.atan2(projectile.velocity.y, projectile.velocity.x);
  const tunnelAngle = Math.atan2(tunnel.direction.y, tunnel.direction.x);
  const deflectionAngle = tunnelAngle + (tunnel.deflectionAngle * Math.PI / 180);

  const speed = projectile.speed;
  projectile.velocity = {
    x: Math.cos(deflectionAngle) * speed,
    y: Math.sin(deflectionAngle) * speed
  };
}

// Main Archer class
export class Archer extends BaseCharacter {
  private ai: ArcherAI;

  constructor() {
    super('archer');
    
    this.primaryAttack = new TripleArrowAttack();
    this.specialAbility = new WindTunnelAbility();
    this.ai = new ArcherAI();
    
    this.projectileBehaviors = {
      arrow: arrowBehavior
    };
  }

  onUpdate(entity: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    super.onUpdate(entity, world, deltaTime);

    const windTunnels = ((world as any).effects || []).filter((effect: any) => 
      effect.type === 'windTunnel' && 
      effect.owner === entity.id
    );

    for (const tunnel of windTunnels) {
      if (Date.now() - tunnel.createdAt >= tunnel.duration) {
        const index = (world as any).effects.indexOf(tunnel);
        if (index !== -1) {
          (world as any).effects.splice(index, 1);
        }
      }
    }

    // Update AI behavior
    const aiDecision = this.ai.update(entity, world, deltaTime);
    if (aiDecision.moveDirection) {
      entity.velocity = Vector.multiply(aiDecision.moveDirection, (entity as any).speed || 200);
    }
    if (aiDecision.attackDirection && !(this.primaryAttack as BaseAbility).isOnCooldown()) {
      this.primaryAttack.execute(entity.id, aiDecision.attackDirection, world);
    }
    if (aiDecision.useSpecial && this.specialAbility && !(this.specialAbility as BaseAbility).isOnCooldown() && aiDecision.attackDirection) {
      this.specialAbility.execute(entity.id, aiDecision.attackDirection, world);
    }
  }

  onDamaged(entity: CircleEntity, damageAmount: number, source: CircleEntity | null): void {
    super.onDamaged(entity, damageAmount, source);

    if ((entity as any).world) {
      const damageEffect: any = EntityUtils.createEffect({
        position: entity.position,
        radius: entity.radius * 1.5,
        color: '#ff4444',
        opacity: 0.5,
        lifetime: 200,
        glowStrength: 0.5
      });
      EntityUtils.addEffectToWorld(damageEffect, (entity as any).world);
    }
  }

  onKill(entity: CircleEntity, target: CircleEntity): void {
    super.onKill(entity, target);

    if ((entity as any).world) {
      const eliminationEffect = EntityUtils.createEffect({
        position: target.position,
        radius: target.radius * 3,
        color: archerConfig.color,
        opacity: 0.7,
        lifetime: 500,
        glowStrength: 0.7
      });
      EntityUtils.addEffectToWorld(eliminationEffect, (entity as any).world);
    }
  }
}

// Export default instance
export default new Archer();