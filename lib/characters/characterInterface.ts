// Character interface definitions for standardized implementation
import { Vector, PhysicsWorld, CircleEntity } from '../physics';
import { ProjectileEntity } from './projectileInterface';

// Base interface for all character abilities
export interface CharacterAbility {
  execute(entityId: string, direction: Vector, world: PhysicsWorld): void;
  getCooldown(): number;
  isOnCooldown(): boolean;
}

// Interface for character-specific projectile behaviors
export interface ProjectileBehavior {
  onUpdate?(projectile: ProjectileEntity, world: PhysicsWorld, deltaTime: number): void;
  onCollision?(projectile: ProjectileEntity, target: ProjectileEntity, world: PhysicsWorld): void;
  onCreation?(projectile: ProjectileEntity, owner: ProjectileEntity): void;
}

// Main character implementation interface
export interface CharacterImplementation {
  type: string;
  name: string;
  primaryAttack: CharacterAbility;
  specialAbility?: CharacterAbility;
  passiveAbility?: CharacterAbility;
  projectileBehaviors: Record<string, ProjectileBehavior>;
  
  // Optional lifecycle hooks
  onUpdate?(entity: CircleEntity, world: PhysicsWorld, deltaTime: number): void;
  onDamaged?(entity: CircleEntity, damageAmount: number, source: CircleEntity | null): void;
  onKill?(entity: CircleEntity, target: CircleEntity): void;
}

// Factory function to get character implementation by type
export function getCharacterImplementation(type: string): CharacterImplementation {
  try {
    // Dynamic import based on character type
    const implementation = require(`./${type}`).default;
    return implementation;
  } catch (error) {
    console.error(`Failed to load character implementation for type: ${type}`, error);
    // Return a default implementation or throw an error
    throw new Error(`Character implementation not found for type: ${type}`);
  }
}