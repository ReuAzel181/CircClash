// Base character implementation with common functionality
import { Vector, CircleEntity, PhysicsWorld } from '../physics';
import { CharacterImplementation, CharacterAbility, ProjectileBehavior } from './characterInterface';
import { getCharacterConfig } from '../characterConfig';

// Base ability class that can be extended by specific abilities
export class BaseAbility implements CharacterAbility {
  protected cooldown: number;
  protected characterType: string;

  constructor(characterType: string, cooldown: number) {
    this.cooldown = cooldown;
    this.characterType = characterType;
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    // Base implementation does nothing - to be overridden
  }

  getCooldown(): number {
    return this.cooldown;
  }
}

// Base character implementation with common functionality
export abstract class BaseCharacter implements CharacterImplementation {
  type: string;
  name: string;
  primaryAttack: CharacterAbility;
  specialAbility?: CharacterAbility;
  passiveAbility?: CharacterAbility;
  projectileBehaviors: Record<string, ProjectileBehavior>;

  constructor(type: string) {
    this.type = type;
    const config = getCharacterConfig(type);
    this.name = config.name;
    this.projectileBehaviors = {};
    
    // Default implementations will be overridden by subclasses
    this.primaryAttack = new BaseAbility(type, config.firingRate);
  }

  // Common utility methods for all characters
  protected getEntity(entityId: string, world: PhysicsWorld): CircleEntity | null {
    return world.entities.get(entityId) || null;
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

// Helper function to create a projectile with common properties
export function createStandardProjectile(
  entityId: string,
  owner: CircleEntity,
  direction: Vector,
  config: any,
  additionalProps: Record<string, any> = {}
) {
  // This will be implemented when we extract the projectile creation code
  // from the physics.ts file
  return null;
}