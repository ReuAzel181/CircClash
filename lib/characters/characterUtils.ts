// Unified character system utilities
import { Vector, PhysicsWorld, CircleEntity } from '../physics';
import { ProjectileEntity, ProjectileProperties } from './projectileInterface';
import { ProjectileBehavior } from './characterInterface';
import { CharacterFactory } from './characterFactory';
import { getCharacterType, getCharacterConfigSync } from '../characterConfig';

/**
 * Character system manager class for handling character-specific behaviors
 */
export class CharacterSystem {
  private characterFactory: CharacterFactory;

  constructor(characterFactory: CharacterFactory) {
    this.characterFactory = characterFactory;
  }

  /**
   * Extract character type from entity ID
   */
  private getEntityCharacterType(entityId: string): string {
    return getCharacterType(entityId);
  }

  /**
   * Handle character-specific attack
   */
  async handleCharacterAttack(entityId: string, direction: Vector, world: PhysicsWorld): Promise<void> {
    const entity = world.entities.get(entityId);
    if (!entity) return;
    
    const characterType = this.getEntityCharacterType(entityId);
    
    try {
      const characterImpl = await this.characterFactory.getImplementation(characterType);
      await characterImpl.primaryAttack.execute(entityId, direction, world);
    } catch (error) {
      console.error(`Error handling character attack for ${characterType}:`, error);
    }
  }

  /**
   * Handle character-specific special ability
   */
  async handleCharacterSpecialAbility(entityId: string, direction: Vector, world: PhysicsWorld): Promise<void> {
    const entity = world.entities.get(entityId);
    if (!entity) return;
    
    const characterType = this.getEntityCharacterType(entityId);
    
    try {
      const characterImpl = await this.characterFactory.getImplementation(characterType);
      if (characterImpl.specialAbility && !characterImpl.specialAbility.isOnCooldown()) {
        await characterImpl.specialAbility.execute(entityId, direction, world);
      }
    } catch (error) {
      console.error(`Error handling character special ability for ${characterType}:`, error);
    }
  }

  /**
   * Handle character-specific update
   */
  async handleCharacterUpdate(entity: CircleEntity, world: PhysicsWorld, deltaTime: number): Promise<void> {
    const characterType = this.getEntityCharacterType(entity.id);
    
    try {
      const characterImpl = await this.characterFactory.getImplementation(characterType);
      if (characterImpl.onUpdate) {
        await characterImpl.onUpdate(entity, world, deltaTime);
      }
    } catch (error) {
      // Silently fail for update - not critical
    }
  }

  /**
   * Handle character-specific projectile behavior
   */
  async handleProjectileBehavior(
    projectile: ProjectileEntity,
    world: PhysicsWorld,
    eventType: 'update' | 'collision' | 'creation',
    target?: CircleEntity,
    owner?: CircleEntity
  ): Promise<void> {
    const characterType = (projectile.properties as any).characterType ||
      (projectile.ownerId ? this.getEntityCharacterType(projectile.ownerId) : 'default');
    
    try {
      const characterImpl = await this.characterFactory.getImplementation(characterType);
      const behaviorKey = (projectile.properties as any).behaviorKey || 'default';
      const behavior: any = characterImpl.projectileBehaviors[behaviorKey] ||
        characterImpl.projectileBehaviors['default'];
      
      if (!behavior) return;
      
      switch (eventType) {
        case 'update':
          if (behavior.onUpdate) {
            await behavior.onUpdate(projectile, world, 1/60);
          }
          break;
        case 'collision':
          if (behavior.onCollision && target) {
            await behavior.onCollision(projectile, target as ProjectileEntity, world);
          }
          break;
        case 'creation':
          if (behavior.onCreation && owner) {
            await behavior.onCreation(projectile, owner as ProjectileEntity);
          }
          break;
      }
    } catch (error) {
      // Silently fail for projectile behavior - not critical
    }
  }
}

/**
 * Common utility functions for effects and entities
 */
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
): ProjectileEntity {
  const characterType = options.characterType || entityId.split('_')[1] || 'default';
  const config = getCharacterConfigSync(characterType);
  
  // Create projectile ID
  const projectileId = `projectile_${characterType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Calculate position slightly away from owner to prevent self-collision
  // Account for both owner radius and bullet radius
  const bulletRadius = options.radius || config.bulletRadius || 5;
  const offset = owner.radius + bulletRadius + 5;
  const position = {
    x: owner.position.x + direction.x * offset,
    y: owner.position.y + direction.y * offset
  };
  
  // Normalize direction vector to ensure consistent speed
  const normalizedDirection = Vector.normalize(direction);
  const speed = options.projectileSpeed || config.projectileSpeed || 400;
  
  // Create base projectile
  
  // Calculate realistic ballistic trajectory with slight upward angle
  const ballisticAngle = -0.03 // Slight upward angle for ballistic arc
  const ballisticDirection = {
    x: normalizedDirection.x * Math.cos(ballisticAngle) - normalizedDirection.y * Math.sin(ballisticAngle),
    y: normalizedDirection.x * Math.sin(ballisticAngle) + normalizedDirection.y * Math.cos(ballisticAngle)
  }
  
  // Determine projectile mass based on character config or default calculation
  const projectileMass = (config as any).projectileMass || Math.max(0.1, 2.0 - (speed / 1000))
  
  const projectile: ProjectileEntity = {
    id: projectileId,
    position,
    velocity: {
      x: ballisticDirection.x * speed,
      y: ballisticDirection.y * speed
    },
    acceleration: { x: 0, y: 0 },
    radius: options.radius || config.bulletRadius || 5,
    mass: projectileMass, // Realistic mass affects ballistic behavior
    health: 1,
    maxHealth: 1,
    damage: options.baseDamage || config.damage || 10,
    restitution: 0.1, // Lower restitution for realistic bouncing
    friction: 0.02, // Minimal friction for projectiles
    isStatic: false,
    type: 'projectile',
    ownerId: owner.id,
    speed: options.projectileSpeed || config.projectileSpeed || 400,
    lifetime: options.lifetime || config.projectileLifetime || 5000,
    piercing: options.piercing || config.piercing || 0,
    hitsRemaining: (options.piercing || config.piercing || 0) + 1,
    properties: {
      characterType,
      muzzleVelocity: (config as any).muzzleVelocity || speed,
      ballisticCoefficient: (config as any).ballisticCoefficient || 0.3,
      ...options,
      visualEffects: options.visualEffects || {
        color: config.bulletColor || '#FFFFFF',
        trail: {
          color: config.bulletColor || '#FFFFFF',
          opacity: config.trailOpacity || 0.5,
          lifetime: config.trailLifetime || 500
        },
        glow: {
          color: config.bulletColor || '#FFFFFF',
          strength: 0.5
        }
      }
    }
  };
  ;(projectile as any).spawnTime = Date.now();
  
  // Call character-specific creation behavior
  const characterSystem = new CharacterSystem(new CharacterFactory());
  characterSystem.handleProjectileBehavior(projectile, {} as PhysicsWorld, 'creation', undefined, owner);
  
  return projectile;
}

/**
 * Update a projectile with character-specific behavior
 */
export async function updateProjectile(projectile: ProjectileEntity, world: PhysicsWorld, deltaTime: number): Promise<void> {
  // Handle character-specific update behavior
  const characterSystem = new CharacterSystem(new CharacterFactory());
  await characterSystem.handleProjectileBehavior(projectile, world, 'update');
  
  // Handle special projectile types
  if ((projectile as any).isVortex) {
    handleVortexProjectile(projectile, world, deltaTime);
  }
}

/**
 * Handle projectile collision with character-specific behavior
 */
export function handleProjectileCollision(projectile: ProjectileEntity, target: CircleEntity, world: PhysicsWorld): void {
  // Handle character-specific collision behavior
  const characterSystem = new CharacterSystem(new CharacterFactory());
  characterSystem.handleProjectileBehavior(projectile, world, 'collision', target);
}

/**
 * Handle vortex projectile behavior
 */
function handleVortexProjectile(projectile: ProjectileEntity, world: PhysicsWorld, deltaTime: number): void {
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

/**
 * Handle collision between entities with character-specific behavior
 */
export async function handleCollision(entityA: CircleEntity, entityB: CircleEntity, world: PhysicsWorld): Promise<void> {
  // Handle projectile hits
  if (entityA.type === 'projectile' || entityB.type === 'projectile') {
    const projectile = entityA.type === 'projectile' ? entityA as ProjectileEntity : entityB as ProjectileEntity;
    const target = entityA.type === 'projectile' ? entityB : entityA;
    
    // Prevent friendly fire - projectiles don't hurt their owner
    if (projectile.ownerId === target.id) {
      return; // Skip damage if projectile hits its owner
    }
    
    // Get character type from projectile
    const characterType = (projectile.properties as any).characterType ||
      (projectile.ownerId ? getCharacterType(projectile.ownerId) : 'default');
    
    try {
      // Get character implementation
      const characterFactory = new CharacterFactory();
      const impl = await characterFactory.getImplementation(characterType);
      
      // Get behavior handler
      const behaviorKey = (projectile.properties as any).behaviorKey || 'default';
      const behavior: ProjectileBehavior | undefined = impl.projectileBehaviors[behaviorKey] ||
        impl.projectileBehaviors['default'];
      
      // Execute collision behavior if implemented
      if (behavior && behavior.onCollision) {
behavior.onCollision(projectile, target as ProjectileEntity, world);
      }
    } catch (error) {
      // Fallback to default collision handling
      handleDefaultProjectileCollision(projectile, target, world);
    }
  }
}

/**
 * Default projectile collision handling
 */
function handleDefaultProjectileCollision(projectile: ProjectileEntity, target: CircleEntity, world: PhysicsWorld): void {
  // Apply damage to target
  if (target.type === 'player' && target.health > 0) {
    // Lightning Striker spear immobilization
    if ((projectile as any).style === 'spear') {
      // Get the character config for the striker to use the correct stun duration
      const strikerConfig = getCharacterConfigSync('striker');
      stunTarget(target.id, strikerConfig.stunDuration || 500, world); // Use config duration or fallback to 0.5 seconds
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
export async function updateEntities(world: PhysicsWorld, deltaTime: number): Promise<void> {
  for (const [id, entity] of world.entities) {
    // Skip dead entities
    if (entity.health <= 0) continue;
    
    // Handle character-specific updates for players
    if (entity.type === 'player') {
      const characterType = getCharacterType(id);
      
      // Delegate to CharacterSystem which handles async/await internally
      const characterSystem = new CharacterSystem(new CharacterFactory());
      characterSystem.handleCharacterUpdate(entity, world, deltaTime);
    }
    
    // Handle projectile updates
    if (entity.type === 'projectile') {
      const projectile = entity as ProjectileEntity;
      await updateProjectile(projectile, world, deltaTime);
    }
  }
}

/**
 * Fire a character-specific attack
 */
export async function fireCharacterAttack(entityId: string, direction: Vector, world: PhysicsWorld): Promise<void> {
  const entity = world.entities.get(entityId);
  if (!entity) return;
  
  // Get character type from entity ID
  const characterType = getCharacterType(entityId);
  
  try {
    // Use the proper character system for character-specific attacks
    const characterSystem = new CharacterSystem(new CharacterFactory());
    await characterSystem.handleCharacterAttack(entityId, direction, world);
  } catch (error) {
    console.error(`Error handling character attack for ${characterType}:`, error);
    // Fallback to default attack if character-specific attack fails
    fireDefaultAttack(entityId, direction, characterType, world);
  }
}

/**
 * Fire a character-specific special ability
 */
export async function fireCharacterSpecialAbility(entityId: string, direction: Vector, world: PhysicsWorld): Promise<void> {
  const entity = world.entities.get(entityId);
  if (!entity) return;
  
  // Get character type from entity ID
  const characterType = getCharacterType(entityId);
  
  try {
    const characterSystem = new CharacterSystem(new CharacterFactory());
    await characterSystem.handleCharacterSpecialAbility(entityId, direction, world);
  } catch (error) {
    console.error(`Error handling character special ability for ${characterType}:`, error);
  }
}

/**
 * Default attack implementation
 */
function fireDefaultAttack(entityId: string, direction: Vector, characterType: string, world: PhysicsWorld): void {
  const entity = world.entities.get(entityId);
  if (!entity) {
    console.log('🚫 fireDefaultAttack: Entity not found:', entityId);
    return;
  }
  
  const config = getCharacterConfigSync(characterType);
  const normalizedDir = Vector.normalize(direction);
  
  console.log('🔫 fireDefaultAttack called:', {
    entityId,
    characterType,
    configName: config.name,
    damage: config.damage,
    projectileSpeed: config.projectileSpeed
  });
  
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
      
      console.log('🌍 Adding projectile to world:', {
        projectileId: projectile.id,
        characterType,
        damage: projectile.damage,
        speed: projectile.speed,
        worldEntityCount: world.entities.size
      });
      
      // Add projectile to world
      world.entities.set(projectile.id, projectile);
      
      console.log('✅ Projectile added. New world entity count:', world.entities.size);
      break;
  }
}

/**
 * Create an electric field at a position
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

export const EntityUtils = {
  /**
   * Creates an effect entity with common properties
   */
  createEffect({
    position,
    radius,
    lifetime,
    color,
    opacity = 0.5,
    glowStrength = 0.5,
    trailOptions = null
  }: {
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
    return {
      id: `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: { ...position },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      radius,
      mass: 0,
      health: 1,
      maxHealth: 1,
      damage: 0,
      restitution: 0,
      friction: 0,
      isStatic: true,
      type: 'aura',
      lifetime,
      properties: {
        visualEffects: {
          color,
          trail: trailOptions || {
            color,
            opacity: opacity ?? 0.5,
            lifetime: 500
          },
          glow: {
            color,
            strength: glowStrength ?? 0.5
          }
        }
      }
    };
  },

  /**
   * Safely adds an entity to the world with automatic cleanup
   */
  addEffectToWorld(effect: CircleEntity, world: PhysicsWorld): void {
    world.entities.set(effect.id, effect);
    if (effect.lifetime) {
      setTimeout(() => world.entities.delete(effect.id), effect.lifetime);
    }
  },

  /**
   * Creates a directional vector from an angle
   */
  getDirectionFromAngle(angle: number, magnitude: number = 1): Vector {
    return {
      x: Math.cos(angle) * magnitude,
      y: Math.sin(angle) * magnitude
    };
  },

  /**
   * Safely initializes entity properties
   */
  initializeEntityProperties(entity: CircleEntity): void {
    entity.properties = entity.properties || { visualEffects: { color: '#FFFFFF', trail: { color: '#FFFFFF', opacity: 0.5, lifetime: 500 }, glow: { color: '#FFFFFF', strength: 0.5 } } };
  },

  /**
   * Calculates remaining lifetime ratio (0 to 1)
   */
  getRemainingLifetimeRatio(spawnTime: number, lifetime: number): number {
    const remainingTime = lifetime - (Date.now() - spawnTime);
    return Math.max(0, Math.min(1, remainingTime / lifetime));
  },

  /**
   * Creates a pulsing update function for effects
   */
  createPulsingEffect({
    baseRadius,
    pulseSpeed = 3,
    pulseScale = 0.2,
    fadeOut = true
  }: {
    baseRadius: number,
    pulseSpeed?: number,
    pulseScale?: number,
    fadeOut?: boolean
  }) {
    const baseTime = Date.now();
    return (entity: CircleEntity) => {
      const time = (Date.now() - baseTime) / 1000;
      entity.radius = baseRadius * (1 + Math.sin(time * pulseSpeed) * pulseScale);

      if (fadeOut && entity.lifetime) {
        const remainingRatio = this.getRemainingLifetimeRatio(baseTime, entity.lifetime);
        if (entity.properties?.visualEffects) {
          entity.properties.visualEffects.trail.opacity *= remainingRatio;
        }
      }
    };
  },

  /**
   * Creates a spiral movement update function
   */
  createSpiralMovement({
    center,
    radius,
    speed = 2
  }: {
    center: Vector,
    radius: number,
    speed?: number
  }) {
    const baseTime = Date.now();
    return (entity: CircleEntity) => {
      const time = (Date.now() - baseTime) / 1000;
      const spiralX = Math.cos(time * speed) * radius;
      const spiralY = Math.sin(time * speed) * radius;
      entity.position = Vector.add(center, { x: spiralX, y: spiralY });
    };
  }
};