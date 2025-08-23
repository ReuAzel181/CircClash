// Compiled version of projectileUtils.ts for direct execution with Node.js
const { getCharacterConfig } = require('../characterConfig');

/**
 * Create a projectile with character-specific properties
 */
function createProjectile(
  entityId,
  owner,
  direction,
  options = {}
) {
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
  const projectile = {
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
    lifetime: options.lifetime || config.projectileLifetime || 2000,
    piercing: options.piercing || config.piercing || 0,
    hitsRemaining: options.piercing || config.piercing || 0,
    characterType,
    distanceTraveled: 0
  };
  
  // Add any additional properties from options
  for (const key in options) {
    if (key !== 'baseDamage' && key !== 'projectileSpeed' && key !== 'radius' && 
        key !== 'piercing' && key !== 'lifetime' && key !== 'characterType') {
      projectile[key] = options[key];
    }
  }
  
  return projectile;
}

/**
 * Update a projectile with character-specific behavior
 */
function updateProjectile(projectile, world, deltaTime) {
  // Update distance traveled
  const speed = Math.sqrt(projectile.velocity.x * projectile.velocity.x + projectile.velocity.y * projectile.velocity.y);
  projectile.distanceTraveled += speed * deltaTime;
  
  // Update lifetime
  projectile.lifetime -= deltaTime * 1000;
  if (projectile.lifetime <= 0) {
    world.entities.delete(projectile.id);
    return;
  }
  
  // Get character type
  const characterType = projectile.characterType || 'default';
  
  try {
    // Get character implementation
    const characterImpl = require('./characterFactory').getCharacterImplementation(characterType);
    
    // Get projectile behavior
    const behavior = characterImpl.projectileBehaviors['default'];
    
    // Execute update if implemented
    if (behavior && behavior.onUpdate) {
      behavior.onUpdate(projectile, world, deltaTime);
    }
  } catch (error) {
    console.error(`Error updating projectile for ${characterType}:`, error);
  }
}

/**
 * Handle projectile collision with character-specific behavior
 */
function handleProjectileCollision(projectile, target, world) {
  // Get character type
  const characterType = projectile.characterType || 'default';
  
  try {
    // Get character implementation
    const characterImpl = require('./characterFactory').getCharacterImplementation(characterType);
    
    // Get projectile behavior
    const behavior = characterImpl.projectileBehaviors['default'];
    
    // Execute collision if implemented
    if (behavior && behavior.onCollision) {
      behavior.onCollision(projectile, target, world);
    }
  } catch (error) {
    console.error(`Error handling projectile collision for ${characterType}:`, error);
  }
  
  // Handle piercing
  if (projectile.hitsRemaining > 0) {
    projectile.hitsRemaining--;
  } else {
    world.entities.delete(projectile.id);
  }
}

module.exports = {
  createProjectile,
  updateProjectile,
  handleProjectileCollision
};