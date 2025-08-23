// Utility functions for character system
import { Vector, CircleEntity, PhysicsWorld } from '../physics';
import { getCharacterImplementation } from './characterFactory';
import { getCharacterType } from '../characterConfig';

/**
 * Extract character type from entity ID
 */
export function getEntityCharacterType(entityId: string): string {
  return getCharacterType(entityId);
}

/**
 * Handle character-specific attack
 * This is a bridge function to transition from the old system to the new character system
 */
export function handleCharacterAttack(entityId: string, direction: Vector, world: PhysicsWorld): void {
  const entity = world.entities.get(entityId);
  if (!entity) return;
  
  // Get character type from entity ID
  const characterType = getEntityCharacterType(entityId);
  
  try {
    // Get character implementation
    const characterImpl = getCharacterImplementation(characterType);
    
    // Execute primary attack
    characterImpl.primaryAttack.execute(entityId, direction, world);
  } catch (error) {
    console.error(`Error handling character attack for ${characterType}:`, error);
    // Fallback to old system if needed
  }
}

/**
 * Handle character-specific update
 * This is called every frame for each character entity
 */
export function handleCharacterUpdate(entity: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
  // Get character type from entity ID
  const characterType = getEntityCharacterType(entity.id);
  
  try {
    // Get character implementation
    const characterImpl = getCharacterImplementation(characterType);
    
    // Execute update if implemented
    if (characterImpl.onUpdate) {
      characterImpl.onUpdate(entity, world, deltaTime);
    }
  } catch (error) {
    // Silently fail for update - not critical
  }
}

/**
 * Handle character-specific projectile behavior
 * This is called for projectile updates, collisions, and creation
 */
export function handleProjectileBehavior(
  projectile: any,
  world: PhysicsWorld,
  eventType: 'update' | 'collision' | 'creation',
  target?: CircleEntity,
  owner?: CircleEntity
): void {
  // Get character type from owner ID or projectile properties
  const characterType = projectile.characterType || 
    (projectile.ownerId ? getEntityCharacterType(projectile.ownerId) : 'default');
  
  try {
    // Get character implementation
    const characterImpl = getCharacterImplementation(characterType);
    
    // Get behavior handler (default or specific)
    const behaviorKey = (projectile as any).behaviorKey || 'default';
    const behavior = characterImpl.projectileBehaviors[behaviorKey] || 
      characterImpl.projectileBehaviors['default'];
    
    if (!behavior) return;
    
    // Execute appropriate behavior method
    switch (eventType) {
      case 'update':
        if (behavior.onUpdate) {
          behavior.onUpdate(projectile, world, 1/60); // Assume 60fps if deltaTime not provided
        }
        break;
      case 'collision':
        if (behavior.onCollision && target) {
          behavior.onCollision(projectile, target, world);
        }
        break;
      case 'creation':
        if (behavior.onCreation && owner) {
          behavior.onCreation(projectile, owner);
        }
        break;
    }
  } catch (error) {
    // Silently fail for projectile behavior - not critical
  }
}