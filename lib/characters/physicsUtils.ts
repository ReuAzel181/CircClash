// Physics utilities for character system
import { Vector, CircleEntity, PhysicsWorld, Projectile } from '../physics';
import { getCharacterImplementation } from './characterFactory';
import { getEntityCharacterType } from './characterUtils';
import { stunTarget } from '../game';
import { getCharacterConfig } from '../characterConfig';

/**
 * Handle collision between entities with character-specific behavior
 */
export function handleCollision(entityA: CircleEntity, entityB: CircleEntity, world: PhysicsWorld): void {
  // Handle projectile hits
  if (entityA.type === 'projectile' || entityB.type === 'projectile') {
    const projectile = entityA.type === 'projectile' ? entityA as Projectile : entityB as Projectile;
    const target = entityA.type === 'projectile' ? entityB : entityA;
    
    // Prevent friendly fire - projectiles don't hurt their owner
    if (projectile.ownerId === target.id) {
      return; // Skip damage if projectile hits its owner
    }
    
    // Get character type from projectile
    const characterType = projectile.characterType || 
      (projectile.ownerId ? getEntityCharacterType(projectile.ownerId) : 'default');
    
    try {
      // Get character implementation
      const characterImpl = getCharacterImplementation(characterType);
      
      // Get behavior handler
      const behaviorKey = (projectile as any).behaviorKey || 'default';
      const behavior = characterImpl.projectileBehaviors[behaviorKey] || 
        characterImpl.projectileBehaviors['default'];
      
      // Execute collision behavior if implemented
      if (behavior && behavior.onCollision) {
        behavior.onCollision(projectile, target, world);
      }
    } catch (error) {
      // Fallback to default collision handling
      handleDefaultProjectileCollision(projectile, target, world);
    }
  }
}

/**
 * Default projectile collision handling
 * This is extracted from physics.ts
 */
function handleDefaultProjectileCollision(projectile: Projectile, target: CircleEntity, world: PhysicsWorld): void {
  // Apply damage to target
  if (target.type === 'player' && target.health > 0) {
    // Lightning Striker spear immobilization
    if ((projectile as any).style === 'spear') {
      // Get the character config for the striker to use the correct stun duration
      const strikerConfig = getCharacterConfig('striker');
      stunTarget(target.id, strikerConfig.stunDuration || 500); // Use config duration or fallback to 0.5 seconds
    }
    
    // Check for combo invulnerability (Iron Titan during grab combo)
    const currentTime = Date.now();
    if ((target as any).comboInvulnerableUntil > currentTime) {
      // Target is invulnerable during combo, skip damage
      projectile.health = 0; // Still remove the projectile
      return;
    }
    
    // Check for charging invulnerability (Steel Guardian during energy wave charge)
    if ((target as any).isCharging) {
      // Target is invulnerable while charging, skip damage
      projectile.health = 0; // Still remove the projectile
      return;
    }
    
    let projectileDamage = projectile.damage || 10;
    // Apply damage reduction if target has it (for tanks)
    if ((target as any).damageReduction) {
      projectileDamage *= (1 - (target as any).damageReduction);
    }
    target.health = Math.max(0, target.health - projectileDamage);
    
    // Apply slow effect if projectile has it
    if ((projectile as any).slowEffect) {
      (target as any).slowEffectUntil = Date.now() + ((projectile as any).slowDuration || 2000);
      (target as any).slowEffectStrength = (projectile as any).slowEffectStrength || 0.4;
    }
    
    // Apply damage over time effect if projectile has it
    if ((projectile as any).damageOverTime) {
      (target as any).dotDamage = (projectile as any).damageOverTime || 5;
      (target as any).dotDuration = (projectile as any).dotDuration || 3000;
      (target as any).dotStartTime = Date.now();
      (target as any).dotSourceId = projectile.ownerId;
    }
  }
  
  // Handle projectile destruction
  if (projectile.hitsRemaining <= 0) {
    projectile.health = 0; // Mark for removal
  } else {
    projectile.hitsRemaining--;
  }
}

/**
 * Update entities with character-specific behavior
 */
export function updateEntities(world: PhysicsWorld, deltaTime: number): void {
  for (const [id, entity] of world.entities) {
    // Skip dead entities
    if (entity.health <= 0) continue;
    
    // Handle character-specific updates for players
    if (entity.type === 'player') {
      const characterType = getEntityCharacterType(id);
      
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
    
    // Handle projectile updates
    if (entity.type === 'projectile') {
      const projectile = entity as Projectile;
      const characterType = projectile.characterType || 
        (projectile.ownerId ? getEntityCharacterType(projectile.ownerId) : 'default');
      
      try {
        // Get character implementation
        const characterImpl = getCharacterImplementation(characterType);
        
        // Get behavior handler
        const behaviorKey = (projectile as any).behaviorKey || 'default';
        const behavior = characterImpl.projectileBehaviors[behaviorKey] || 
          characterImpl.projectileBehaviors['default'];
        
        // Execute update behavior if implemented
        if (behavior && behavior.onUpdate) {
          behavior.onUpdate(projectile, world, deltaTime);
        }
      } catch (error) {
        // Silently fail for update - not critical
      }
    }
  }
}