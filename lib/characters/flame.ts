// Flame (Fire Warrior) character implementation
import { Vector, PhysicsWorld, CircleEntity } from '../physics';
import { BaseCharacter, BaseAbility } from './baseCharacter';
import { CharacterAbility, ProjectileBehavior } from './characterInterface';
import { createProjectile } from './projectileUtils';
import { getCharacterConfig } from '../characterConfig';

/**
 * Flame (Fire Warrior) primary attack
 * Fires a 3-shot burst in a fan pattern
 */
export class FlamePrimaryAttack extends BaseAbility implements CharacterAbility {
  constructor(characterType: string) {
    const config = getCharacterConfig(characterType);
    super(characterType, config.firingRate);
  }
  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    const entity = world.entities.get(entityId);
    if (!entity) return;
    
    const config = getCharacterConfig('flame');
    const normalizedDir = Vector.normalize(direction);
    
    // Store timeout IDs for cleanup
    const timeouts: NodeJS.Timeout[] = [];
    (entity as any).activeTimeouts = (entity as any).activeTimeouts || [];
    
    // Clear any existing timeouts for this entity
    (entity as any).activeTimeouts.forEach((timeout: NodeJS.Timeout) => clearTimeout(timeout));
    (entity as any).activeTimeouts = [];
    
    // Fire 3 shots in a fan pattern
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
  }
}

/**
 * Flame projectile behavior
 */
export const flameProjectileBehavior: ProjectileBehavior = {
  onUpdate: (projectile: CircleEntity, world: PhysicsWorld): void => {
    // Add fire trail effect
    if (Math.random() < 0.2) {
      const trailId = `fire_trail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const trail: CircleEntity = {
        id: trailId,
        position: { ...projectile.position },
        velocity: { x: 0, y: 0 },
        acceleration: { x: 0, y: 0 },
        radius: projectile.radius * 0.7,
        mass: 0,
        health: 1,
        maxHealth: 1,
        damage: 0,
        restitution: 0,
        friction: 0,
        isStatic: true,
        type: 'aura'
      };
      
      // Add fire trail properties
      (trail as any).isFireTrail = true;
      (trail as any).opacity = 0.7;
      (trail as any).spawnTime = Date.now();
      (trail as any).lifetime = 500; // Short-lived trail
      
      // Add trail to world
      world.entities.set(trailId, trail);
      
      // Remove trail after lifetime
      setTimeout(() => {
        world.entities.delete(trailId);
      }, 500);
    }
  },
  
  onCollision: (projectile: CircleEntity, target: CircleEntity, world: PhysicsWorld): void => {
    // Apply burn effect on hit
    if (target.type === 'player' && target.id !== (projectile as any).sourceId) {
      const config = getCharacterConfig('flame');
      const burnDuration = config.burnDuration || 3000;
      const burnTickRate = config.burnTickRate || 500;
      const burnDamagePerTick = config.burnDamagePerTick || 2;
      
      // Apply burn status
      (target as any).isBurning = true;
      (target as any).burnUntil = Date.now() + burnDuration;
      
      // If not already burning, start burn damage ticks
      if (!(target as any).burnTickActive) {
        (target as any).burnTickActive = true;
        
        const burnTick = () => {
          const targetEntity = world.entities.get(target.id);
          if (!targetEntity) return;
          
          const now = Date.now();
          if (now < (targetEntity as any).burnUntil) {
            // Apply burn damage
            targetEntity.health -= burnDamagePerTick;
            
            // Visual effect
            (targetEntity as any).burnEffectActive = true;
            
            // Continue burn ticks
            setTimeout(burnTick, burnTickRate);
          } else {
            // Clear burn status
            (targetEntity as any).isBurning = false;
            (targetEntity as any).burnTickActive = false;
            (targetEntity as any).burnEffectActive = false;
          }
        };
        
        // Start burn tick
        setTimeout(burnTick, burnTickRate);
      }
    }
  },
  
  onCreation: (projectile: CircleEntity): void => {
    // Set fire projectile properties
    (projectile as any).isFireProjectile = true;
  }
};

/**
 * Flame (Fire Warrior) character implementation
 */
export class FlameCharacter extends BaseCharacter {
  constructor() {
    super('flame');
    this.primaryAttack = new FlamePrimaryAttack('flame');
    this.projectileBehaviors = {
      'default': flameProjectileBehavior
    };
  }
}

// Export default instance
export default new FlameCharacter();