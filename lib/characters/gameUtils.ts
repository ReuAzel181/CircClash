// Game utilities for character system
import { Vector, CircleEntity, PhysicsWorld } from '../physics';
import { getCharacterImplementation } from './characterFactory';
import { getEntityCharacterType } from './characterUtils';
import { createProjectile } from './projectileUtils';
import { getCharacterConfig } from '../characterConfig';

/**
 * Fire a character-specific attack
 * This is extracted from game.ts
 */
export function fireCharacterAttack(entityId: string, direction: Vector, world: PhysicsWorld): void {
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
    // Fallback to old system
    fireDefaultAttack(entityId, direction, characterType, world);
  }
}

/**
 * Default attack implementation
 * This is extracted from game.ts
 */
function fireDefaultAttack(entityId: string, direction: Vector, characterType: string, world: PhysicsWorld): void {
  const entity = world.entities.get(entityId);
  if (!entity) return;
  
  const config = getCharacterConfig(characterType);
  const normalizedDir = Vector.normalize(direction);
  
  // Store timeout IDs for cleanup
  const timeouts: NodeJS.Timeout[] = [];
  (entity as any).activeTimeouts = (entity as any).activeTimeouts || [];
  
  // Clear any existing timeouts for this entity
  (entity as any).activeTimeouts.forEach((timeout: NodeJS.Timeout) => clearTimeout(timeout));
  (entity as any).activeTimeouts = [];
  
  switch (characterType) {
    case 'vortex': // Plasma Vortex - Energy bullet that becomes a pulling vortex with stack system
      // Initialize stack system if not present
      if (!(entity as any).vortexStacks) {
        (entity as any).vortexStacks = 0;
      }
      
      // Check if we should trigger rapid fire
      const stacks = (entity as any).vortexStacks;
      const stacksToTrigger = config.stacksToTrigger || 5;
      
      if (stacks >= stacksToTrigger) {
        // Reset stacks and trigger rapid fire
        (entity as any).vortexStacks = 0;
        
        // Fire rapid consecutive shots
        const rapidFireCount = config.rapidFireCount || 3;
        const rapidFireDelay = config.rapidFireDelay || 150;
        
        for (let i = 0; i < rapidFireCount; i++) {
          const timeout = setTimeout(() => {
            if (!world.entities.has(entityId)) return;
            
            const projectile = createProjectile(entityId, entity, normalizedDir, { 
              baseDamage: config.damage, 
              projectileSpeed: config.projectileSpeed,
              radius: config.bulletRadius,
              isVortex: true,
              vortexStopDistance: config.vortexStopDistance || 250,
              vortexRadius: config.vortexRadius || 60,
              vortexPullStrength: config.vortexPullStrength || 1.2,
              vortexDuration: config.vortexDuration || 3000,
              vortexTouchedDuration: config.vortexTouchedDuration || 3000,
              vortexDamageRate: config.vortexDamageRate || 12
            });
            
            // Add projectile to world
            world.entities.set(projectile.id, projectile);
          }, i * rapidFireDelay);
          (entity as any).activeTimeouts.push(timeout);
        }
      } else {
        // Normal single shot
        const projectile = createProjectile(entityId, entity, normalizedDir, { 
          baseDamage: config.damage, 
          projectileSpeed: config.projectileSpeed,
          radius: config.bulletRadius,
          isVortex: true,
          vortexStopDistance: config.vortexStopDistance || 250,
          vortexRadius: config.vortexRadius || 60,
          vortexPullStrength: config.vortexPullStrength || 1.2,
          vortexDuration: config.vortexDuration || 3000,
          vortexTouchedDuration: config.vortexTouchedDuration || 3000,
          vortexDamageRate: config.vortexDamageRate || 12
        });
        
        // Add projectile to world
        world.entities.set(projectile.id, projectile);
      }
      break;
      
    case 'flame': // Fire Warrior - 3 shot burst
      for (let i = 0; i < 3; i++) {
        const timeout = setTimeout(() => {
          // Check if entity still exists before firing
          if (!world.entities.has(entityId)) return;
          
          const angle = (i - 1) * 0.2; // Fan pattern
          const spreadDir = {
            x: normalizedDir.x * Math.cos(angle) - normalizedDir.y * Math.sin(angle),
            y: normalizedDir.x * Math.sin(angle) + normalizedDir.y * Math.cos(angle)
          };
          
          const projectile = createProjectile(entityId, entity, spreadDir, { 
            baseDamage: config.damage * 0.6, 
            projectileSpeed: config.projectileSpeed * 0.8,
            radius: config.bulletRadius * 0.8
          });
          
          // Add projectile to world
          world.entities.set(projectile.id, projectile);
        }, i * 50); // Rapid burst with delay
        (entity as any).activeTimeouts.push(timeout);
      }
      break;
      
    case 'archer': // Wind Archer - Rapid arrow barrage
      for (let i = 0; i < 4; i++) {
        const timeout = setTimeout(() => {
          if (!world.entities.has(entityId)) return;
          
          const projectile = createProjectile(entityId, entity, normalizedDir, { 
            baseDamage: config.damage * 0.7, 
            projectileSpeed: config.projectileSpeed,
            radius: config.bulletRadius,
            piercing: 1 // Arrows pierce through
          });
          
          // Add projectile to world
          world.entities.set(projectile.id, projectile);
        }, i * 100); // Quick succession
        (entity as any).activeTimeouts.push(timeout);
      }
      break;
      
    default: // Default single shot
      const projectile = createProjectile(entityId, entity, normalizedDir, { 
        baseDamage: config.damage, 
        projectileSpeed: config.projectileSpeed,
        radius: config.bulletRadius
      });
      
      // Add projectile to world
      world.entities.set(projectile.id, projectile);
      break;
  }
}

/**
 * Create an electric field at a position
 * This is extracted from game.ts
 */
export function createElectricField(
  position: Vector, 
  opts: { 
    radius: number, 
    duration: number, 
    damage: number, 
    tickRate: number, 
    sourceId: string 
  },
  world: PhysicsWorld
): void {
  const fieldId = `electric_field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create field entity
  const field: CircleEntity = {
    id: fieldId,
    position: { ...position },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    radius: opts.radius,
    mass: Infinity,
    health: 1,
    maxHealth: 1,
    damage: 0,
    restitution: 0,
    friction: 0,
    isStatic: true,
    type: 'hazard'
  };
  
  // Add electric field properties
  (field as any).isElectricField = true;
  (field as any).sourceId = opts.sourceId;
  (field as any).tickRate = opts.tickRate;
  (field as any).fieldDamage = opts.damage;
  (field as any).spawnTime = Date.now();
  (field as any).lifetime = opts.duration;
  
  // Add field to world
  world.entities.set(fieldId, field);

  // Damage nearby enemies every tick
  const tick = () => {
    if (!world.entities.has(fieldId)) return;
    
    for (const [id, entity] of world.entities) {
      if (entity.type !== 'player' || entity.health <= 0 || id === opts.sourceId) continue;
      
      const dist = Math.sqrt(
        Math.pow(position.x - entity.position.x, 2) + 
        Math.pow(position.y - entity.position.y, 2)
      );
      
      if (dist <= opts.radius) {
        entity.health -= opts.damage;
      }
    }
    
    // Continue ticking if field still exists
    if (Date.now() - (field as any).spawnTime < opts.duration) {
      setTimeout(tick, opts.tickRate);
    } else {
      world.entities.delete(fieldId);
    }
  };
  
  setTimeout(tick, opts.tickRate);
}

/**
 * Stun a target for a duration
 * This is extracted from game.ts
 */
export function stunTarget(targetId: string, duration: number, world: PhysicsWorld): void {
  const entity = world.entities.get(targetId);
  if (!entity) return;
  
  const now = Date.now();
  (entity as any).isStunned = true;
  (entity as any).immobilized = true;
  (entity as any).immobilizedUntil = now + duration;
  
  // Save velocity before immobilizing
  if (!(entity as any).savedVelocity) {
    (entity as any).savedVelocity = { ...entity.velocity };
  }
  
  // Enable electric effect for visual feedback
  (entity as any).electricEffectActive = true;
  
  // Set a timeout to ensure immobilization is cleared after duration
  const clearStunTimeout = setTimeout(() => {
    const entityAfterTimeout = world.entities.get(targetId);
    if (entityAfterTimeout) {
      (entityAfterTimeout as any).immobilized = false;
      (entityAfterTimeout as any).isStunned = false;
      (entityAfterTimeout as any).electricEffectActive = false;
      
      // Restore saved velocity
      if ((entityAfterTimeout as any).savedVelocity) {
        entityAfterTimeout.velocity = {
          x: entityAfterTimeout.velocity.x * 0.3 + (entityAfterTimeout as any).savedVelocity.x * 0.7,
          y: entityAfterTimeout.velocity.y * 0.3 + (entityAfterTimeout as any).savedVelocity.y * 0.7
        };
        delete (entityAfterTimeout as any).savedVelocity;
      }
    }
  }, duration);
  
  // Store the timeout for cleanup
  (entity as any).activeTimeouts = (entity as any).activeTimeouts || [];
  (entity as any).activeTimeouts.push(clearStunTimeout);
}