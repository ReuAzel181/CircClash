// Archer (Wind Archer) character implementation
import { Vector, PhysicsWorld, CircleEntity } from '../physics';
import { BaseCharacter, BaseAbility } from './baseCharacter';
import { CharacterAbility, ProjectileBehavior } from './characterInterface';
import { createProjectile } from './projectileUtils';
import { getCharacterConfig } from '../characterConfig';

/**
 * Archer (Wind Archer) primary attack
 * Fires a rapid 4-arrow barrage with piercing properties
 */
export class ArcherPrimaryAttack extends BaseAbility implements CharacterAbility {
  constructor(characterType: string) {
    const config = getCharacterConfig(characterType);
    super(characterType, config.firingRate);
  }
  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    const entity = world.entities.get(entityId);
    if (!entity) return;
    
    const config = getCharacterConfig('archer');
    const normalizedDir = Vector.normalize(direction);
    
    // Store timeout IDs for cleanup
    const timeouts: NodeJS.Timeout[] = [];
    (entity as any).activeTimeouts = (entity as any).activeTimeouts || [];
    
    // Clear any existing timeouts for this entity
    (entity as any).activeTimeouts.forEach((timeout: NodeJS.Timeout) => clearTimeout(timeout));
    (entity as any).activeTimeouts = [];
    
    // Fire 4 arrows in quick succession
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
  }
}

/**
 * Archer projectile behavior
 */
export const archerProjectileBehavior: ProjectileBehavior = {
  onUpdate: (projectile: CircleEntity, world: PhysicsWorld): void => {
    // Add wind trail effect
    if (Math.random() < 0.15) {
      const trailId = `wind_trail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const trail: CircleEntity = {
        id: trailId,
        position: { ...projectile.position },
        velocity: { x: 0, y: 0 },
        acceleration: { x: 0, y: 0 },
        radius: projectile.radius * 0.5,
        mass: 0,
        health: 1,
        maxHealth: 1,
        damage: 0,
        restitution: 0,
        friction: 0,
        isStatic: true,
        type: 'aura'
      };
      
      // Add wind trail properties
      (trail as any).isWindTrail = true;
      (trail as any).opacity = 0.5;
      (trail as any).spawnTime = Date.now();
      (trail as any).lifetime = 300; // Very short-lived trail
      
      // Add trail to world
      world.entities.set(trailId, trail);
      
      // Remove trail after lifetime
      setTimeout(() => {
        world.entities.delete(trailId);
      }, 300);
    }
  },
  
  onCollision: (projectile: CircleEntity, target: CircleEntity, world: PhysicsWorld): void => {
    // Apply knockback on hit
    if (target.type === 'player' && target.id !== (projectile as any).sourceId) {
      const config = getCharacterConfig('archer');
      const knockbackForce = config.knockbackForce || 5;
      
      // Calculate knockback direction (same as projectile direction)
      const knockbackDir = Vector.normalize(projectile.velocity);
      
      // Apply knockback force
      target.velocity.x += knockbackDir.x * knockbackForce;
      target.velocity.y += knockbackDir.y * knockbackForce;
      
      // If projectile has piercing property, don't destroy it on first hit
    if ((projectile as any).piercing > 0) {
      (projectile as any).piercing -= 1;
      // Don't destroy projectile
    }
  }
  },
  
  onCreation: (projectile: CircleEntity): void => {
    // Set arrow projectile properties
    (projectile as any).isArrowProjectile = true;
    
    // Adjust shape to be more arrow-like
    (projectile as any).isArrow = true;
    (projectile as any).length = projectile.radius * 2.5;
    (projectile as any).width = projectile.radius * 0.5;
  }
};

/**
 * Archer (Wind Archer) character implementation
 */
export class ArcherCharacter extends BaseCharacter {
  constructor() {
    super('archer');
    this.primaryAttack = new ArcherPrimaryAttack('archer');
    this.projectileBehaviors = {
      'default': archerProjectileBehavior
    };
  }
}

// Export default instance
export default new ArcherCharacter();