// Projectile utilities for character system
import { Vector, CircleEntity, PhysicsWorld, Projectile } from '../physics';
import { getCharacterConfig } from '../characterConfig';
import { handleProjectileBehavior } from './characterUtils';

/**
 * Create a projectile with character-specific properties
 */
export function createProjectile(
  entityId: string,
  owner: CircleEntity,
  direction: Vector,
  options: {
    baseDamage?: number;
    projectileSpeed?: number;
    radius?: number;
    piercing?: number;
    bounces?: number;
    lifetime?: number;
    characterType?: string;
    [key: string]: any; // Allow additional character-specific properties
  } = {}
): Projectile {
  const characterType = options.characterType || entityId.split('_')[1] || 'default';
  const config = getCharacterConfig(characterType);
  
  // Create projectile ID
  const projectileId = `projectile_${characterType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Calculate position slightly away from owner to prevent self-collision
  const offset = 10 + (options.radius || config.bulletRadius || 5);
  const position = {
    x: owner.position.x + direction.x * offset,
    y: owner.position.y + direction.y * offset
  };
  
  // Create base projectile
  const projectile: Projectile = {
    id: projectileId,
    position,
    velocity: {
      x: direction.x * (options.projectileSpeed || config.projectileSpeed || 400),
      y: direction.y * (options.projectileSpeed || config.projectileSpeed || 400)
    },
    acceleration: { x: 0, y: 0 },
    radius: options.radius || config.bulletRadius || 5,
    mass: 1,
    health: 1,
    maxHealth: 1,
    damage: options.baseDamage || config.damage || 10,
    restitution: 0.8,
    friction: 0.1,
    isStatic: false,
    type: 'projectile',
    ownerId: owner.id,
    speed: options.projectileSpeed || config.projectileSpeed || 400,
    lifetime: options.lifetime || 5000, // Default 5 seconds
    piercing: options.piercing || 0,
    hitsRemaining: options.piercing || 0,
    characterType
  };
  
  // Add any additional properties from options
  Object.keys(options).forEach(key => {
    if (!['baseDamage', 'projectileSpeed', 'radius', 'piercing', 'bounces', 'lifetime', 'characterType'].includes(key)) {
      (projectile as any)[key] = options[key];
    }
  });
  
  // Call character-specific creation behavior
  handleProjectileBehavior(projectile, {} as PhysicsWorld, 'creation', undefined, owner);
  
  return projectile;
}

/**
 * Update a projectile with character-specific behavior
 */
export function updateProjectile(projectile: Projectile, world: PhysicsWorld, deltaTime: number): void {
  // Handle character-specific update behavior
  handleProjectileBehavior(projectile, world, 'update');
  
  // Handle special projectile types
  if ((projectile as any).isVortex) {
    handleVortexProjectile(projectile, world, deltaTime);
  }
  
  // Add other special projectile type handlers as needed
}

/**
 * Handle projectile collision with character-specific behavior
 */
export function handleProjectileCollision(projectile: Projectile, target: CircleEntity, world: PhysicsWorld): void {
  // Handle character-specific collision behavior
  handleProjectileBehavior(projectile, world, 'collision', target);
}

/**
 * Handle vortex projectile behavior
 * This is extracted from physics.ts
 */
function handleVortexProjectile(projectile: Projectile, world: PhysicsWorld, deltaTime: number): void {
  // If this is a vortex projectile that hasn't activated yet
  if ((projectile as any).isVortex && !(projectile as any).vortexActive) {
    // Check if it's traveled far enough to stop
    if (!(projectile as any).initialPosition) {
      (projectile as any).initialPosition = { ...projectile.position };
    }
    
    const distance = Vector.distance((projectile as any).initialPosition, projectile.position);
    if (distance >= ((projectile as any).vortexStopDistance || 250)) {
      // Stop and activate vortex mode
      projectile.velocity = { x: 0, y: 0 };
      (projectile as any).vortexActive = true;
      (projectile as any).lastDamageTime = Date.now();
      projectile.lifetime = (projectile as any).vortexDuration || 3000;
      projectile.isStatic = true;
    }
  }
}