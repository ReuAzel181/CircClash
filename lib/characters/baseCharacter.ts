// Base character implementation with common functionality
import { Vector, CircleEntity, PhysicsWorld } from '../physics';
import { CharacterImplementation, CharacterAbility, ProjectileBehavior } from './characterInterface';
import { getCharacterConfigSync } from '../characterConfig';
import { EntityUtils } from './characterUtils';

// Base ability class that can be extended by specific abilities
export class BaseAbility implements CharacterAbility {
  protected cooldown: number;
  protected characterType: string;
  protected lastUsed: number = 0;

  constructor(characterType: string, cooldown: number) {
    this.cooldown = cooldown;
    this.characterType = characterType;
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    const now = Date.now();
    if (now - this.lastUsed < this.cooldown) return;
    this.lastUsed = now;
    // Base implementation does nothing - to be overridden
  }

  getCooldown(): number {
    return this.cooldown;
  }

  isOnCooldown(): boolean {
    return Date.now() - this.lastUsed < this.cooldown;
  }

  getRemainingCooldown(): number {
    const remaining = this.cooldown - (Date.now() - this.lastUsed);
    return Math.max(0, remaining);
  }
}

// Base character implementation with common functionality
export abstract class BaseCharacter implements CharacterImplementation {
  readonly type: string;
  readonly name: string;
  primaryAttack: CharacterAbility;
  specialAbility?: CharacterAbility;
  passiveAbility?: CharacterAbility;
  projectileBehaviors: Record<string, ProjectileBehavior>;
  protected config: any;

  constructor(type: string) {
    this.type = type;
    this.config = getCharacterConfigSync(type);
    this.name = this.config.name;
    this.projectileBehaviors = {};
    
    // Default implementations will be overridden by subclasses
    this.primaryAttack = new BaseAbility(type, this.config.firingRate);
  }

  // Common utility methods for all characters
  protected getEntity(entityId: string, world: PhysicsWorld): CircleEntity | null {
    return world.entities.get(entityId) || null;
  }

  protected createEffect(params: {
    position: Vector,
    radius: number,
    lifetime: number,
    color: string,
    opacity?: number,
    glowStrength?: number,
    trailOptions?: {
      color: string,
      opacity: number,
      lifetime: number
    } | null
  }): CircleEntity {
    return EntityUtils.createEffect(params);
  }

  protected addEffectToWorld(effect: CircleEntity, world: PhysicsWorld): void {
    EntityUtils.addEffectToWorld(effect, world);
  }

  protected getDirectionFromAngle(angle: number, magnitude: number = 1): Vector {
    return EntityUtils.getDirectionFromAngle(angle, magnitude);
  }

  // Default implementations of lifecycle hooks
  onUpdate(entity: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    // Default implementation does nothing - to be overridden
  }

  onDamaged(entity: CircleEntity, damageAmount: number, source: CircleEntity | null): void {
    // Default implementation does nothing - to be overridden
  }

  onKill(entity: CircleEntity, target: CircleEntity): void {
    // Default implementation does nothing - to be overridden
  }
}

// Base AI class for character behavior
export abstract class BaseAI {
  constructor() {}

  abstract findNearestEnemy(owner: CircleEntity, world: PhysicsWorld): CircleEntity | null;
  
  calculateMovementDirection(owner: CircleEntity, target: CircleEntity): Vector {
    const distance = Math.sqrt(
      (target.position.x - owner.position.x) ** 2 + 
      (target.position.y - owner.position.y) ** 2
    );
    
    return {
      x: (target.position.x - owner.position.x) / distance,
      y: (target.position.y - owner.position.y) / distance
    };
  }
  
  calculateAttackDirection(owner: CircleEntity, target: CircleEntity): Vector {
    return this.calculateMovementDirection(owner, target);
  }
  
  shouldUseSpecialAbility(owner: CircleEntity, target: CircleEntity): boolean {
    // Base implementation - can be overridden
    return false;
  }
  
  useSpecialAbility(owner: CircleEntity, target: CircleEntity, world: PhysicsWorld): void {
    // Base implementation - can be overridden
  }
}

// Helper function to create a projectile with common properties
export function createStandardProjectile(
  entityId: string,
  owner: CircleEntity,
  direction: Vector,
  config: any,
  additionalProps: Record<string, any> = {}
) {
  // Import createProjectile dynamically to avoid circular dependency
  const { createProjectile } = require('./characterUtils');
  
  return createProjectile(entityId, owner, direction, {
    baseDamage: config.damage,
    projectileSpeed: config.projectileSpeed,
    radius: config.bulletRadius,
    piercing: config.piercing,
    lifetime: config.projectileLifetime,
    characterType: config.name?.toLowerCase() || entityId.split('_')[1] || 'default',
    ...additionalProps
  });
}