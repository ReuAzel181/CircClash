// Core physics types and functions for deterministic circle-based gameplay
import { getCharacterConfigSync } from './characterConfig';
import { handleCollision, stunTarget, updateProjectile } from './characters/characterUtils';

export interface Vector {
  x: number
  y: number
}

export interface VisualEffects {
  color: string;
  trail: {
    color: string;
    opacity: number;
    lifetime: number;
  };
  glow: {
    color: string;
    strength: number;
  };
}

export interface CircleEntity {
  properties?: {
    visualEffects: VisualEffects;
    activeTimeouts?: NodeJS.Timeout[];
    // Charging properties for special abilities
    isCharging?: boolean;
    chargeStartTime?: number;
    chargeDuration?: number;
    chargeDirection?: Vector;
    chargeSpeed?: number;
    chargeDamage?: number;
    chargeStartPos?: Vector;
    chargeEndPos?: Vector;
    // Ice shard properties
    isIceShard?: boolean;
    shatterOnImpact?: boolean;
    shardCount?: number;
    freezeDuration?: number;
    slowStrength?: number;
    // Freeze effect properties
    freezeEffect?: {
      duration: number;
      slowStrength: number;
      startTime: number;
    };
    // Slow effect properties
    slowDuration?: number;
    slowStartTime?: number;
    
    // Mystic-specific properties
    isMysticThread?: boolean;
    webRadius?: number;
    webDuration?: number;
    webSlowStrength?: number;
    hasHomed?: boolean;
    targetId?: string | null;
    isMysticWeb?: boolean;
    creationTime?: number;
    trappedEnemies?: Set<string>;
    healAmount?: number;
    lastHealTime?: number;
    isImpactWeb?: boolean;
    webSlow?: {
       strength: number;
       startTime: number;
     };
     homingStrength?: number;
      duration?: number;
    // Shadow-specific properties
    isStealthed?: boolean;
    stealthOpacity?: number;
    stealthStartTime?: number;
    stealthDuration?: number;
    shadowCloneId?: string;
    isClone?: boolean;
    cloneOwnerId?: string;
    cloneCreationTime?: number;
    cloneDuration?: number;
    lastAttackTime?: number;
    attackCooldown?: number;
    damageMultiplier?: number;
    originalOpacity?: number;
    isShadowClone?: boolean;
    // Titan-specific properties
    isGrabbed?: boolean;
    grabberId?: string;
    grabStartTime?: number;
    grabDuration?: number;
    isStunned?: boolean;
    stunStartTime?: number;
    stunDuration?: number;
    // Projectile-specific properties
    isIronShot?: boolean;
    knockbackForce?: number;
    armorPiercing?: boolean;
    heavyImpact?: boolean;
    shockwaveOnHit?: boolean;
  };
  id: string
  position: Vector
  velocity: Vector
  acceleration: Vector
  radius: number
  mass: number
  health: number
  maxHealth: number
  damage: number
  weaponId?: string
  restitution: number // Bounce coefficient (0-1)
  friction: number // Movement friction (0-1)
  isStatic: boolean // Immovable objects
  type: 'player' | 'projectile' | 'pickup' | 'hazard' | 'aura' | 'character'
  ownerId?: string // For projectiles
  lifetime?: number // For temporary entities
  invulnerableUntil?: number // Immunity frames
  // Weapon system
  equippedWeapon?: string
  weaponCooldowns?: Map<string, number>
  energy?: number
  maxEnergy?: number
  special?: string[] // Special behavior flags
  // AI system
  lastAttackTime?: number
}

export interface WeaponProjectile extends CircleEntity {
  type: 'projectile'
  weaponId: string
  speed: number
  lifetime: number
  piercing: number // How many entities it can hit
  hitsRemaining: number
  bounces: number
  bouncesRemaining: number
  special: string[]
}

export interface WeaponAura extends CircleEntity {
  type: 'aura'
  weaponId: string
  duration: number
  special: string[]
  affectedEntities: Set<string> // Track which entities are in range
}

import { ProjectileEntity, ProjectileProperties } from './characters/projectileInterface';

// Re-export ProjectileEntity and ProjectileProperties for backwards compatibility
export type { ProjectileEntity, ProjectileProperties };

export interface Collision {
  entityA: CircleEntity
  entityB: CircleEntity
  normal: Vector
  penetration: number
  relativeVelocity: number
}

export interface PhysicsWorld {
  entities: Map<string, CircleEntity>
  gravity: Vector
  airFriction: number
  timeAccumulator: number
  fixedTimeStep: number // 1/60 for 60fps physics
  bounds: { width: number; height: number }
  
  // Helper method to add entities
  addEntity(entity: CircleEntity): void
}

// Vector math utilities
export const Vector = {
  create: (x: number = 0, y: number = 0): Vector => ({ x, y }),
  
  add: (a: Vector, b: Vector): Vector => ({
    x: a.x + b.x,
    y: a.y + b.y
  }),
  
  subtract: (a: Vector, b: Vector): Vector => ({
    x: a.x - b.x,
    y: a.y - b.y
  }),
  
  multiply: (v: Vector, scalar: number): Vector => ({
    x: v.x * scalar,
    y: v.y * scalar
  }),
  
  dot: (a: Vector, b: Vector): number => a.x * b.x + a.y * b.y,
  
  magnitude: (v: Vector): number => Math.sqrt(v.x * v.x + v.y * v.y),
  
  normalize: (v: Vector): Vector => {
    const mag = Vector.magnitude(v)
    if (mag === 0) return Vector.create()
    return Vector.multiply(v, 1 / mag)
  },
  
  distance: (a: Vector, b: Vector): number => {
    const diff = Vector.subtract(a, b)
    return Vector.magnitude(diff)
  },
  
  lerp: (a: Vector, b: Vector, t: number): Vector => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t
  }),
  
  rotate: (v: Vector, angle: number): Vector => {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return {
      x: v.x * cos - v.y * sin,
      y: v.x * sin + v.y * cos
    }
  }
}

// Physics simulation functions
export function createPhysicsWorld(width: number, height: number): PhysicsWorld {
  const entities = new Map<string, CircleEntity>();
  
  return {
    entities,
    gravity: Vector.create(0, 98), // Realistic gravity (9.8 m/s² scaled for game units)
    airFriction: 0.998, // Slight air resistance for realistic ballistics
    timeAccumulator: 0,
    fixedTimeStep: 1 / 60, // 60 FPS physics
    bounds: { width, height },
    addEntity(entity: CircleEntity): void {
      entities.set(entity.id, entity);
    }
  }
}

// Update physics world bounds for arena resizing
export function updateWorldBounds(world: PhysicsWorld, width: number, height: number): void {
  world.bounds.width = width
  world.bounds.height = height
  
  // Ensure all entities stay within new bounds
  for (const entity of world.entities.values()) {
    entity.position.x = Math.max(entity.radius, Math.min(width - entity.radius, entity.position.x))
    entity.position.y = Math.max(entity.radius, Math.min(height - entity.radius, entity.position.y))
  }
}

export function createCircleEntity(
  id: string,
  x: number,
  y: number,
  radius: number,
  type: CircleEntity['type'] = 'player',
  visualEffects?: VisualEffects
): CircleEntity {
  return {
    id,
    position: Vector.create(x, y),
    velocity: Vector.create(),
    acceleration: Vector.create(),
    radius,
    mass: Math.PI * radius * radius,
    health: 100,
    maxHealth: 100,
    damage: 20,
    restitution: 1.0,
    friction: 1.0,
    isStatic: false,
    type,
    invulnerableUntil: 0,
    ...(visualEffects && { properties: { visualEffects } })
  }
}

// Original function preserved for backwards compatibility
export function _createCircleEntity(
  id: string,
  x: number,
  y: number,
  radius: number,
  type: CircleEntity['type'] = 'player'
): CircleEntity {
  return {
    id,
    position: Vector.create(x, y),
    velocity: Vector.create(),
    acceleration: Vector.create(),
    radius,
    mass: Math.PI * radius * radius, // Area-based mass
    health: 100,
    maxHealth: 100,
    damage: 20,
    restitution: 1.0, // Perfect bouncing for constant movement
    friction: 1.0, // No friction - let the speed maintenance handle this
    isStatic: false,
    type,
    invulnerableUntil: 0
  }
}

export function createProjectile(
  id: string,
  x: number,
  y: number,
  direction: Vector,
  speed: number,
  ownerId: string,
  lifetime: number = 3000,
  characterType?: string
): ProjectileEntity {
  const normalizedDirection = Vector.normalize(direction)
  
  // Calculate realistic muzzle velocity with slight upward angle for ballistic trajectory
  const ballisticAngle = -0.05 // Slight upward angle in radians (~3 degrees)
  const ballisticDirection = {
    x: normalizedDirection.x * Math.cos(ballisticAngle) - normalizedDirection.y * Math.sin(ballisticAngle),
    y: normalizedDirection.x * Math.sin(ballisticAngle) + normalizedDirection.y * Math.cos(ballisticAngle)
  }
  
  const velocity = Vector.multiply(ballisticDirection, speed)
  
  // Determine projectile mass based on type and speed (heavier bullets for slower speeds)
  const projectileMass = Math.max(0.1, 2.0 - (speed / 1000)) // Mass inversely related to speed
  
  return {
    id,
    position: Vector.create(x, y),
    velocity,
    acceleration: Vector.create(),
    radius: 5,
    mass: projectileMass, // Realistic mass affects physics
    health: 1,
    maxHealth: 1,
    damage: 10,
    restitution: 0.1, // Lower restitution for more realistic bouncing
    friction: 0.02, // Minimal friction for projectiles
    isStatic: false,
    type: 'projectile',
    ownerId,
    speed,
    lifetime,
    piercing: 0,
    hitsRemaining: 1,
    properties: {
      characterType: characterType || 'default',
      muzzleVelocity: speed, // Store initial muzzle velocity
      ballisticCoefficient: 0.3, // Aerodynamic efficiency
      visualEffects: {
        color: '#FFFFFF',
        trail: {
          color: '#FFFFFF',
          opacity: 0.5,
          lifetime: 500
        },
        glow: {
          color: '#FFFFFF',
          strength: 0.5
        }
      }
    }
  }
}

// Collision detection - aggressive detection for consistent bouncing
export function detectCollision(a: CircleEntity, b: CircleEntity): Collision | null {
  const distance = Vector.distance(a.position, b.position)
  const minDistance = a.radius + b.radius
  
  // Very sensitive collision detection - catch all potential collisions
  const tolerance = 3.0 // High tolerance to ensure no collisions are missed
  if (distance >= minDistance + tolerance) {
    return null // No collision
  }
  
  // Prevent division by zero for overlapping entities
  const normal = distance > 0.001 
    ? Vector.normalize(Vector.subtract(b.position, a.position))
    : Vector.create(1, 0) // Default normal if entities are exactly on top of each other
    
  const penetration = Math.max(0.5, minDistance - distance) // Higher minimum penetration
  const relativeVelocity = Vector.magnitude(Vector.subtract(a.velocity, b.velocity))
  
  return {
    entityA: a,
    entityB: b,
    normal,
    penetration,
    relativeVelocity
  }
}

// Collision response with momentum-based damage
export function resolveCollision(collision: Collision, world: PhysicsWorld): void {
  const { entityA, entityB, normal, penetration, relativeVelocity } = collision
  
  // Special case: Ice Wall handling
  if ((entityA as any).isIceWall || (entityB as any).isIceWall) {
    const iceWall = (entityA as any).isIceWall ? entityA : entityB
    const otherEntity = (entityA as any).isIceWall ? entityB : entityA
    
    // Allow the Ice Knight owner to pass through their own ice wall
    if (otherEntity.id === (iceWall as any).ownerBot && (iceWall as any).ownerCanPass) {
      return // Skip collision resolution
    }
    
    // For projectiles, destroy them on hit if not owned by the ice wall creator
    if (otherEntity.type === 'projectile') {
      if (otherEntity.ownerId !== (iceWall as any).ownerBot) {
        otherEntity.health = 0 // Mark projectile for removal
      }
      return
    }
    
    // For player entities colliding with ice wall, block movement (no bounce)
    if (otherEntity.type === 'player') {
      const away = Vector.normalize(Vector.subtract(otherEntity.position, iceWall.position))
      const separation = Vector.multiply(away, Math.max(1, 4))
      otherEntity.position = Vector.add(otherEntity.position, separation)
      // Remove velocity component toward the wall
      const vel = otherEntity.velocity
      const velAlongAway = Vector.dot(vel, away)
      if (velAlongAway < 0) {
        const correction = Vector.multiply(away, velAlongAway)
        otherEntity.velocity = Vector.subtract(vel, correction)
      }
      return
    }
  }
  
  // Skip if either entity is static and the other is a projectile
  if ((entityA.isStatic || entityB.isStatic) && 
      (entityA.type === 'projectile' || entityB.type === 'projectile')) {
    return
  }
  
  // Play bounce sound if the collision is significant
  if (relativeVelocity > 50) {
    // Import from audio utility
    const { playBounceSound } = require('./audio')
    playBounceSound(relativeVelocity / 300) // Normalize volume based on velocity
  }
  
  // Aggressive positional correction to prevent overlap and sliding
  const correctionPercent = 1.0 // Complete correction
  const correctionMagnitude = penetration * correctionPercent
  const correction = Vector.multiply(normal, correctionMagnitude)
  
  if (!entityA.isStatic && !entityB.isStatic) {
    const totalMass = entityA.mass + entityB.mass
    const massRatioA = entityB.mass / totalMass
    const massRatioB = entityA.mass / totalMass
    
    // Apply strong separation with extra push
    const extraSeparation = 1.2 // 20% extra separation
    entityA.position = Vector.subtract(entityA.position, Vector.multiply(correction, massRatioA * extraSeparation))
    entityB.position = Vector.add(entityB.position, Vector.multiply(correction, massRatioB * extraSeparation))
  } else if (!entityA.isStatic) {
    entityA.position = Vector.subtract(entityA.position, Vector.multiply(correction, 1.2))
  } else if (!entityB.isStatic) {
    entityB.position = Vector.add(entityB.position, Vector.multiply(correction, 1.2))
  }
  
  // Calculate momentum-based damage (reduced for longer battles)
  const baseDamage = Math.max(entityA.damage, entityB.damage)
  const momentumDamage = baseDamage * 0.3 * (1 + Math.min(relativeVelocity / 600, 1)) // Reduced by 70%
  
  // Apply damage with invulnerability frames
  const currentTime = Date.now()
  
  if (entityA.type !== 'projectile' && entityB.type !== 'pickup' && 
      entityA.invulnerableUntil! < currentTime &&
      !((entityA as any).comboInvulnerableUntil > currentTime)) { // Check combo invulnerability
    let damageToA = momentumDamage
    // Apply damage reduction if entity has it (for tanks)
    if ((entityA as any).damageReduction) {
      damageToA *= (1 - (entityA as any).damageReduction)
    }
    entityA.health = Math.max(0, entityA.health - damageToA)
    entityA.invulnerableUntil = currentTime + 500 // 500ms immunity
  }
  
  if (entityB.type !== 'projectile' && entityA.type !== 'pickup' && 
      entityB.invulnerableUntil! < currentTime &&
      !((entityB as any).comboInvulnerableUntil > currentTime)) { // Check combo invulnerability
    let damageToB = momentumDamage
    // Apply damage reduction if entity has it (for tanks)
    if ((entityB as any).damageReduction) {
      damageToB *= (1 - (entityB as any).damageReduction)
    }
    entityB.health = Math.max(0, entityB.health - damageToB)
    entityB.invulnerableUntil = currentTime + 500
  }
  
  // ALWAYS bounce - real world physics where objects always deflect when they hit
  if (!entityA.isStatic && !entityB.isStatic && 
      entityA.type !== 'projectile' && entityB.type !== 'projectile') {
    
    // Get velocities and masses
    const v1 = entityA.velocity
    const v2 = entityB.velocity
    const m1 = entityA.mass
    const m2 = entityB.mass
    
    // Calculate relative velocity to understand collision dynamics
    const relativeVel = Vector.subtract(v1, v2)
    const velAlongNormal = Vector.dot(relativeVel, normal)
    
    // ALWAYS BOUNCE - remove restrictive conditions for consistent physics
    // In real physics, objects always interact when they collide
    
    // Simple but effective elastic collision with energy boost
    const restitution = 1.3 // High restitution for energetic bouncing
    
    // Calculate impulse based on conservation of momentum
    const impulse = 2 * velAlongNormal / (m1 + m2)
    
    // Apply collision response - swap velocity components along collision normal
    const impulseA = impulse * m2
    const impulseB = impulse * m1
    
    // Update velocities with bouncing effect
    entityA.velocity = Vector.subtract(v1, Vector.multiply(normal, impulseA * restitution))
    entityB.velocity = Vector.add(v2, Vector.multiply(normal, impulseB * restitution))
    
    // Ensure strong bouncing with minimum speeds - real objects maintain energy
    const minSpeed = 200
    const speedA = Vector.magnitude(entityA.velocity)
    const speedB = Vector.magnitude(entityB.velocity)
    
    if (speedA < minSpeed) {
      const direction = speedA > 0 ? Vector.normalize(entityA.velocity) : 
        Vector.create((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2)
      entityA.velocity = Vector.multiply(Vector.normalize(direction), minSpeed)
    }
    if (speedB < minSpeed) {
      const direction = speedB > 0 ? Vector.normalize(entityB.velocity) : 
        Vector.create((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2)
      entityB.velocity = Vector.multiply(Vector.normalize(direction), minSpeed)
    }
    
    // Add separation force to prevent sticking
    const separationForce = 50
    entityA.velocity = Vector.subtract(entityA.velocity, Vector.multiply(normal, separationForce / m1))
    entityB.velocity = Vector.add(entityB.velocity, Vector.multiply(normal, separationForce / m2))
    
    // Small random variation for natural movement
    const randomStrength = 30
    entityA.velocity = Vector.add(entityA.velocity, Vector.create(
      (Math.random() - 0.5) * randomStrength,
      (Math.random() - 0.5) * randomStrength
    ))
    entityB.velocity = Vector.add(entityB.velocity, Vector.create(
      (Math.random() - 0.5) * randomStrength,
      (Math.random() - 0.5) * randomStrength
    ))
  }
  
  // Handle projectile hits
  if (entityA.type === 'projectile' || entityB.type === 'projectile') {
    const projectile = entityA.type === 'projectile' ? entityA as ProjectileEntity : entityB as ProjectileEntity
    const target = entityA.type === 'projectile' ? entityB : entityA
    
    try {
      // Use the new character system for collision handling
      handleCollision(projectile, target, world);
    } catch (error) {
      console.error('Error in character collision system:', error);
      // Continue with fallback collision handling
    }
    
    // Special handling for formed vortexes - allow players to pass through
    const projectileSpecial = projectile as any
    if (projectileSpecial.isVortex && projectileSpecial.hasFormedVortex && target.type === 'player') {
      // Don't apply collision physics to vortex-player collisions
      // The vortex pull force is handled separately in the vortex behavior section
      return
    }
    
    // Prevent friendly fire - projectiles don't hurt their owner
    if (projectile.ownerId === target.id) {
      return // Skip damage if projectile hits its owner
    }
    
    // VORTEX FORMATION - Handle this FIRST before any other logic
    if (projectileSpecial.isVortex && !projectileSpecial.hasFormedVortex) {
      // Form vortex at collision point instead of removing projectile
      projectileSpecial.hasFormedVortex = true
      projectileSpecial.vortexFormTime = Date.now()
      projectile.velocity = Vector.create(0, 0) // Stop the bullet
      projectile.radius = projectileSpecial.vortexRadius || 60 // Expand to vortex size
      projectile.hitsRemaining = Infinity // Don't remove the vortex on further collisions
      projectile.isStatic = true // Make vortex completely immovable
      projectile.mass = Infinity // Prevent any movement from collisions
      
      // Set vortex duration
      projectileSpecial.vortexStartTime = Date.now()
      projectileSpecial.vortexDuration = 3000
      
      // Initialize damage tracking for vortex
      if (!projectileSpecial.lastDamageTime) {
        projectileSpecial.lastDamageTime = new Map()
      }
      
      return // Don't remove the projectile, let it become a vortex
    }
    
    // If vortex has already formed, don't delete it on further collisions
    if (projectileSpecial.isVortex && projectileSpecial.hasFormedVortex) {
      return // Keep the vortex alive
    }
    
    // Special case: Iron hand should never damage its owner even indirectly
    if (projectileSpecial.isIronHand && projectile.ownerId === target.id) {
      return // Extra protection for iron hand
    }
    
    // Additional safety: Iron hand should never damage anyone with combo invulnerability
    if (projectileSpecial.isIronHand) {
      const currentTime = Date.now()
      if ((target as any).comboInvulnerableUntil > currentTime) {
        return // Iron hand can't damage invulnerable targets
      }
    }
    
    // Apply damage to target
    if (target.type === 'player' && target.health > 0) {
      // Lightning Striker spear immobilization
      if ((projectile as any).style === 'spear') {
        // Get the character config for the striker to use the correct stun duration
        const strikerConfig = getCharacterConfigSync('striker')
        stunTarget(target.id, strikerConfig.stunDuration || 500, world) // Use config duration or fallback to 0.5 seconds
      }
      // Check for combo invulnerability (Iron Titan during grab combo)
      const currentTime = Date.now()
      if ((target as any).comboInvulnerableUntil > currentTime) {
        // Target is invulnerable during combo, skip damage
        projectile.health = 0 // Still remove the projectile
        return
      }
      
      // Check for charging invulnerability (Steel Guardian during energy wave charge)
      if ((target as any).isCharging) {
        // Target is invulnerable while charging, skip damage
        projectile.health = 0 // Still remove the projectile
        return
      }
      
      let projectileDamage = projectile.damage || 10
      // Apply damage reduction if target has it (for tanks)
      if ((target as any).damageReduction) {
        projectileDamage *= (1 - (target as any).damageReduction)
      }
      target.health = Math.max(0, target.health - projectileDamage)
      
      // Execute onHit callback if it exists
      if (typeof (projectile as any).onHit === 'function') {
        try {
          (projectile as any).onHit(target.id, { ...target.position });
        } catch (error) {
          console.error('Error executing onHit callback:', error);
        }
      }
      
      // Track stacks for vortex characters when they hit enemies
      if (projectile.ownerId && world.entities.has(projectile.ownerId)) {
        const owner = world.entities.get(projectile.ownerId)
        if (owner && (owner as any).characterType === 'vortex') {
          if (!(owner as any).vortexStacks) {
            ;(owner as any).vortexStacks = 0
          }
          ;(owner as any).vortexStacks++
        }
      }
      
      // Handle special projectile effects
      const projectileSpecial = projectile as any
      
      // Explosive effect - area damage
      if (projectileSpecial.explosive) {
        const explosionRadius = 80
        const maxExplosionTargets = 5 // Limit explosion targets to prevent chain reactions
        let explosionTargets = 0
        
        for (const [id, entity] of world.entities) {
          if (explosionTargets >= maxExplosionTargets) break
          
          if (entity.id !== projectile.id && entity.id !== projectile.ownerId && entity.type === 'player') {
            const distance = Vector.distance(target.position, entity.position)
            if (distance <= explosionRadius) {
              const explosionDamage = Math.max(1, projectileDamage * (1 - distance / explosionRadius) * 0.7)
              entity.health = Math.max(0, entity.health - explosionDamage)
              
              // Explosion knockback with safety limits
              const knockbackDir = Vector.normalize(Vector.subtract(entity.position, target.position))
              const knockbackForce = Math.min(500, 300 * (1 - distance / explosionRadius)) // Cap knockback
              if (!entity.isStatic) {
                const currentSpeed = Vector.magnitude(entity.velocity)
                const newVelocity = Vector.add(entity.velocity, Vector.multiply(knockbackDir, knockbackForce))
                // Prevent excessive speeds
                if (Vector.magnitude(newVelocity) > currentSpeed * 2) {
                  entity.velocity = Vector.multiply(Vector.normalize(newVelocity), currentSpeed * 1.5)
                } else {
                  entity.velocity = newVelocity
                }
              }
              explosionTargets++
            }
          }
        }
      }
      
      // Electric chaining effect
      if (projectileSpecial.electric) {
        const chainRadius = 60
        const chainDamage = projectileDamage * 0.6
        for (const [id, entity] of world.entities) {
          if (entity.id !== target.id && entity.id !== projectile.ownerId && entity.type === 'player') {
            const distance = Vector.distance(target.position, entity.position)
            if (distance <= chainRadius) {
              entity.health = Math.max(0, entity.health - chainDamage)
            }
          }
        }
      }
      
      // Freezing effect - slow down target
      if (projectileSpecial.freezing) {
        (target as any).frozenUntil = Date.now() + 2000 // 2 seconds freeze
      }
      
      // Check for critical hit (high velocity impact)
      const isCriticalHit = relativeVelocity > 400
      
      if (isCriticalHit && target.weaponId && target.type === 'player') {
        // Weapon swap on critical hit - drop weapon as pickup
        spawnWeaponPickup(world, target.position, target.weaponId)
        target.weaponId = undefined
      }
    }
    
    // Remove projectile or reduce piercing (but not for vortexes)
    if (projectile.hitsRemaining <= 1) {
      world.entities.delete(projectile.id)
    } else {
      projectile.hitsRemaining--
    }
  }
}

// Chain knockback - when moving circle forces another into a third
export function applyChainKnockback(world: PhysicsWorld, collision: Collision): void {
  const { entityA, entityB } = collision
  const pushingEntity = Vector.magnitude(entityA.velocity) > Vector.magnitude(entityB.velocity) ? entityA : entityB
  const pushedEntity = pushingEntity === entityA ? entityB : entityA
  
  // Find entities that might be hit by the pushed entity
  const chainRadius = pushedEntity.radius + 50 // Detection range
  
  for (const [id, entity] of world.entities) {
    if (entity.id === pushedEntity.id || entity.id === pushingEntity.id) continue
    
    const distance = Vector.distance(pushedEntity.position, entity.position)
    if (distance <= chainRadius) {
      // Apply reduced knockback
      const knockbackDirection = Vector.normalize(Vector.subtract(entity.position, pushedEntity.position))
      const knockbackForce = Vector.magnitude(pushedEntity.velocity) * 0.3 // Reduced force
      
      if (!entity.isStatic) {
        entity.velocity = Vector.add(entity.velocity, Vector.multiply(knockbackDirection, knockbackForce))
      }
    }
  }
}

function spawnWeaponPickup(world: PhysicsWorld, position: Vector, weaponId: string): void {
  const pickup = createCircleEntity(
    `pickup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    position.x,
    position.y,
    15,
    'pickup'
  )
  pickup.weaponId = weaponId
  pickup.isStatic = true
  pickup.lifetime = 15000 // 15 seconds
  
  world.entities.set(pickup.id, pickup)
}

// Apply friction to all entities
export function applyFriction(world: PhysicsWorld): void {
  for (const [id, entity] of world.entities) {
    if (!entity.isStatic && entity.type !== 'projectile') {
      // No friction for players - they should maintain constant movement like bouncing balls
      if (entity.type === 'player') {
        // Maintain constant speed for bouncing ball physics
        const currentSpeed = Vector.magnitude(entity.velocity)
        let targetSpeed = 250 // Base constant bouncing speed
        
        // Apply slow effect if active
        const currentTime = Date.now()
        if ((entity as any).slowedUntil && (entity as any).slowedUntil > currentTime) {
          const slowStrength = (entity as any).slowStrength || 0.4
          targetSpeed = targetSpeed * (1 - slowStrength) // Reduce speed by slow percentage
        }
        
        if (currentSpeed > 5) { // Only normalize if moving
          const direction = Vector.normalize(entity.velocity)
          entity.velocity = Vector.multiply(direction, targetSpeed)
        }
      } else {
        // Apply normal friction to other entities
        entity.velocity = Vector.multiply(entity.velocity, entity.friction)
        
        // Stop very slow movement to prevent jitter
        if (Vector.magnitude(entity.velocity) < 0.1) {
          entity.velocity = Vector.create()
        }
      }
    }
  }
}

// Integrate position and velocity using Verlet integration
export function integrate(entity: CircleEntity, dt: number): void {
  if (entity.isStatic) return
  
  // Apply gravity (only to projectiles for realistic ballistics)
  if (entity.type === 'projectile') {
    // Apply gravity for realistic trajectory
    entity.acceleration = Vector.add(entity.acceleration, Vector.create(0, 98)) // 9.8 m/s² scaled
    
    // Apply air resistance based on velocity
    const velocityMagnitude = Vector.magnitude(entity.velocity)
    if (velocityMagnitude > 0) {
      const airResistance = Vector.multiply(
        Vector.normalize(entity.velocity),
        -0.02 * velocityMagnitude * velocityMagnitude // Quadratic air resistance
      )
      entity.acceleration = Vector.add(entity.acceleration, airResistance)
    }
  }
  
  // Apply acceleration to velocity
  entity.velocity = Vector.add(entity.velocity, Vector.multiply(entity.acceleration, dt))
  
  // Update position
  entity.position = Vector.add(entity.position, Vector.multiply(entity.velocity, dt))
  
  // Reset acceleration for next frame
  entity.acceleration = Vector.create()
}

// Boundary collision
export function handleBoundaryCollision(entity: CircleEntity, bounds: { width: number; height: number }): void {
  if (entity.isStatic || entity.type === 'projectile') return // Skip projectiles - handled separately
  
  const bounceFactor = entity.restitution * 1.0 // Perfect bounce to maintain constant movement
  
  // Import audio utility
  const { playBounceSound } = require('./audio')
  
  // Left boundary
  if (entity.position.x - entity.radius < 0) {
    entity.position.x = entity.radius
    entity.velocity.x = -entity.velocity.x * bounceFactor
    // Small random component for variety but maintain overall speed
    entity.velocity.y += (Math.random() - 0.5) * 20
    // Play bounce sound with volume based on velocity
    playBounceSound(Math.abs(entity.velocity.x) / 300)
  }
  
  // Right boundary
  if (entity.position.x + entity.radius > bounds.width) {
    entity.position.x = bounds.width - entity.radius
    entity.velocity.x = -entity.velocity.x * bounceFactor
    // Small random component for variety but maintain overall speed
    entity.velocity.y += (Math.random() - 0.5) * 20
    // Play bounce sound with volume based on velocity
    playBounceSound(Math.abs(entity.velocity.x) / 300)
  }
  
  // Top boundary
  if (entity.position.y - entity.radius < 0) {
    entity.position.y = entity.radius
    entity.velocity.y = -entity.velocity.y * bounceFactor
    // Small random component for variety but maintain overall speed
    entity.velocity.x += (Math.random() - 0.5) * 20
    // Play bounce sound with volume based on velocity
    playBounceSound(Math.abs(entity.velocity.y) / 300)
  }
  
  // Bottom boundary
  if (entity.position.y + entity.radius > bounds.height) {
    entity.position.y = bounds.height - entity.radius
    entity.velocity.y = -entity.velocity.y * bounceFactor
    // Small random component for variety but maintain overall speed
    entity.velocity.x += (Math.random() - 0.5) * 20
    // Play bounce sound with volume based on velocity
    playBounceSound(Math.abs(entity.velocity.y) / 300)
  }
}

// Main physics simulation step
export async function simulateStep(world: PhysicsWorld, deltaTime: number): Promise<void> {
  // Harden immobilization: temporarily disable movement but preserve momentum
  const now = Date.now();
  for (const [id, entity] of world.entities) {
    // Safety check: Clear stuck grab states after 10 seconds
    if ((entity as any).isGrabbed && (entity as any).grabStartTime && 
        now - (entity as any).grabStartTime > 10000) {
      console.warn(`Clearing stuck grab state for entity ${id}`);
      delete (entity as any).isGrabbed;
      delete (entity as any).grabberId;
      delete (entity as any).grabStartTime;
      delete (entity as any).grabCooldownUntil;
    }
    
    if ((entity as any).immobilized && (entity as any).immobilizedUntil > now) {
      // Save original velocity before immobilization if not already saved
      if (!(entity as any).savedVelocity) {
        (entity as any).savedVelocity = { ...entity.velocity };
      }
      
      // Only zero out acceleration to prevent additional movement
      // but keep velocity stored for collision responses
      entity.acceleration = { x: 0, y: 0 };
      
      // Allow entity to still be pushed by collisions
      // but reduce their ability to move on their own
      const dampingFactor = 0.2; // Allow some movement from collisions
      entity.velocity.x *= dampingFactor;
      entity.velocity.y *= dampingFactor;
    } else if ((entity as any).immobilized && (entity as any).immobilizedUntil <= now) {
      (entity as any).immobilized = false;
      (entity as any).isStunned = false;
      if ((entity as any).electricEffectActive) {
        (entity as any).electricEffectActive = false;
      }
      // Restore saved velocity when immobilization ends
      if ((entity as any).savedVelocity) {
        // Blend current velocity with saved velocity to ensure smooth transition
        entity.velocity = {
          x: entity.velocity.x * 0.3 + (entity as any).savedVelocity.x * 0.7,
          y: entity.velocity.y * 0.3 + (entity as any).savedVelocity.y * 0.7
        };
        delete (entity as any).savedVelocity; // Clean up
      }
    }
  }
  world.timeAccumulator += deltaTime
  
  // Fixed timestep with accumulator pattern for determinism
  while (world.timeAccumulator >= world.fixedTimeStep) {
    const currentTime = Date.now()
    
    // Collect entities to remove (avoid modifying map during iteration)
    const entitiesToRemove: string[] = []
    
    // Remove expired entities
    for (const [id, entity] of world.entities) {
      if (entity.lifetime && currentTime > ((entity as any).spawnTime || 0) + entity.lifetime) {
        entitiesToRemove.push(id)
        continue
      }
      
      // Check projectile lifetime and mark expired ones for removal
      if (entity.type === 'projectile' && (entity as any).spawnTime) {
        const age = Date.now() - (entity as any).spawnTime
        if (age > (entity.lifetime || 3000)) {
          entity.health = 0 // Mark for removal
        }
      }
      
      // Remove dead entities
      if (entity.health <= 0) {
        entitiesToRemove.push(id)
        continue
      }
    }
    
    // Safe removal after iteration
    entitiesToRemove.forEach(id => {
      const entity = world.entities.get(id)
      if (entity) {
        // Clean up grab flags when entity is removed
        if ((entity as any).isGrabbed) {
          delete (entity as any).isGrabbed
        }
        if ((entity as any).grabCooldownUntil) {
          delete (entity as any).grabCooldownUntil
        }
        
        // Clean up any timeouts for this entity
        if ((entity as any).activeTimeouts) {
          (entity as any).activeTimeouts.forEach((timeout: NodeJS.Timeout) => clearTimeout(timeout))
        }
        world.entities.delete(id)
      }
    })
    
    // Update weapon systems and energy
    for (const [id, entity] of world.entities) {
      updateWeaponCooldowns(entity, currentTime)
      regenerateEnergy(entity, world.fixedTimeStep)
      
      // Handle self-healing for tank characters
      if ((entity as any).selfHeal && entity.health > 0 && entity.health < entity.maxHealth) {
        const lastHealTime = (entity as any).lastHealTime || currentTime
        if (currentTime - lastHealTime >= 1000) { // Heal every second
          const healAmount = (entity as any).selfHeal
          entity.health = Math.min(entity.maxHealth, entity.health + healAmount)
          ;(entity as any).lastHealTime = currentTime
        }
      }
    }
    
    // Update AI (will be called with weapons from outside)
    if ((world as any).weapons) {
      for (const [id, entity] of world.entities) {
        if (entity.health > 0) {
          updateAI(entity, world, world.fixedTimeStep, (world as any).weapons)
        }
      }
    }
    
    // Integration step - handle projectiles separately
    for (const [id, entity] of world.entities) {
      if (entity.type === 'projectile') {
        const projectileSpecial = entity as any
        
        // Homing behavior
        if (projectileSpecial.homing) {
          // Limit homing search to prevent infinite loops
          if (!projectileSpecial.homingSearchAttempts) {
            projectileSpecial.homingSearchAttempts = 0
          }
          
          if (!projectileSpecial.homingTarget || !world.entities.has(projectileSpecial.homingTarget)) {
            projectileSpecial.homingSearchAttempts++
            
            // Give up homing after too many failed attempts
            if (projectileSpecial.homingSearchAttempts > 10) {
              projectileSpecial.homing = false
            } else {
              // Find nearest enemy
              let nearestDistance = 200 // Maximum homing range
              let nearestTarget = null
              
              for (const [targetId, targetEntity] of world.entities) {
                if (targetEntity.type === 'player' && 
                    targetEntity.id !== (entity as ProjectileEntity).ownerId &&
                    targetEntity.health > 0) {
                  const distance = Vector.distance(entity.position, targetEntity.position)
                  if (distance < nearestDistance) {
                    nearestDistance = distance
                    nearestTarget = targetId
                  }
                }
              }
              projectileSpecial.homingTarget = nearestTarget
            }
          }
          
          // Apply homing force toward target
          if (projectileSpecial.homingTarget && projectileSpecial.homing) {
            const target = world.entities.get(projectileSpecial.homingTarget)
            if (target && target.health > 0) {
              const dirToTarget = Vector.normalize(Vector.subtract(target.position, entity.position))
              const currentDir = Vector.normalize(entity.velocity)
              const homingStrength = Math.min(0.15, projectileSpecial.homingStrength || 0.1) // Cap homing strength
              const homingForce = Vector.multiply(dirToTarget, homingStrength)
              
              // Blend current direction with homing direction
              const newDirection = Vector.normalize(Vector.add(currentDir, homingForce))
              const speed = Vector.magnitude(entity.velocity)
              entity.velocity = Vector.multiply(newDirection, speed)
            } else {
              // Target died, clear it
              projectileSpecial.homingTarget = null
            }
          }
        }
        
        // Call character-specific projectile update behavior
        await updateProjectile(entity as any, world, world.fixedTimeStep);
        
        // Apply physics integration to projectiles
        integrate(entity, world.fixedTimeStep);
        
        // Special projectile behaviors for new abilities
        
        // Shockwave behavior (Steel Guardian)
        if (projectileSpecial.isShockwave) {
          // Expand the shockwave radius over time
          if (!projectileSpecial.initialRadius) {
            projectileSpecial.initialRadius = entity.radius
            projectileSpecial.expansionRate = 400 // pixels per second expansion rate
            projectileSpecial.maxRadius = projectileSpecial.explosiveRadius || 80
          }
          
          // Expand the radius
          entity.radius += projectileSpecial.expansionRate * world.fixedTimeStep
          
          // When it reaches max size, mark for removal
          if (entity.radius >= projectileSpecial.maxRadius) {
            entity.health = 0 // Mark for removal
          }
          
          // Static shockwave - doesn't move
          entity.velocity.x = 0
          entity.velocity.y = 0
        }
        
        // Earthquake behavior (Iron Titan)
        if (projectileSpecial.isEarthquake) {
          // Expand the earthquake radius over time (faster than shockwave)
          if (!projectileSpecial.initialRadius) {
            projectileSpecial.initialRadius = entity.radius
            projectileSpecial.expansionRate = 600 // Faster expansion for earthquake
            projectileSpecial.maxRadius = projectileSpecial.explosiveRadius || 120
          }
          
          // Expand the radius
          entity.radius += projectileSpecial.expansionRate * world.fixedTimeStep
          
          // When it reaches max size, mark for removal
          if (entity.radius >= projectileSpecial.maxRadius) {
            entity.health = 0 // Mark for removal
          }
          
          // Static earthquake - doesn't move
          entity.velocity.x = 0
          entity.velocity.y = 0
        }
        
        // Fissure behavior (Iron Titan - new ground crack system)
        if (projectileSpecial.isFissure) {
          // Track distance traveled
          if (!projectileSpecial.traveledDistance) {
            projectileSpecial.traveledDistance = 0
            projectileSpecial.maxDistance = projectileSpecial.fissureLength || 350
          }
          
          // Calculate distance traveled this frame
          const speed = Vector.magnitude(entity.velocity)
          const distanceThisFrame = speed * world.fixedTimeStep
          projectileSpecial.traveledDistance += distanceThisFrame
          
          // When fissure reaches max length, mark for removal
          if (projectileSpecial.traveledDistance >= projectileSpecial.maxDistance) {
            entity.health = 0 // Mark for removal
          }
          
          // Create damage zone along the fissure path
          const fissureWidth = projectileSpecial.fissureWidth || 25
          // Check for entities within fissure width perpendicular to movement direction
          for (const [targetId, targetEntity] of world.entities) {
            if (targetEntity.type === 'player' && 
                targetEntity.id !== (entity as any).ownerId &&
                targetEntity.health > 0) {
              
              // Calculate perpendicular distance from fissure line
              const dirToTarget = Vector.subtract(targetEntity.position, entity.position)
              const fissureDir = Vector.normalize(entity.velocity)
              const perpDistance = Math.abs(dirToTarget.x * (-fissureDir.y) + dirToTarget.y * fissureDir.x)
              
              if (perpDistance <= fissureWidth / 2) {
                // Target is within fissure damage zone
                if (!projectileSpecial.hitTargets) {
                  projectileSpecial.hitTargets = new Set()
                }
                
                if (!projectileSpecial.hitTargets.has(targetId)) {
                  let fissureDamage = entity.damage || 35
                  // Apply damage reduction if target has it
                  if ((targetEntity as any).damageReduction) {
                    fissureDamage *= (1 - (targetEntity as any).damageReduction)
                  }
                  targetEntity.health = Math.max(0, targetEntity.health - fissureDamage)
                  projectileSpecial.hitTargets.add(targetId)
                }
              }
            }
          }
        }
        
        // Iron Hand behavior (Iron Titan - grab and punch combo)
        if (projectileSpecial.isIronHand) {
          // Initialize hand properties
          if (!projectileSpecial.startPosition) {
            projectileSpecial.startPosition = { ...entity.position }
            projectileSpecial.traveledDistance = 0
            projectileSpecial.maxDistance = projectileSpecial.maxExtension || 280
            projectileSpecial.isExtending = true
            projectileSpecial.hasGrabbedTarget = false
            projectileSpecial.grabbedTargetId = null
            projectileSpecial.punchCount = 0
            projectileSpecial.lastPunchTime = 0
            projectileSpecial.punchInterval = 200 // Faster punches: 200ms between punches
            projectileSpecial.grabRadius = 25 // Larger grab detection radius
          }
          
          // If we have a grabbed target, handle the punch sequence
          if (projectileSpecial.hasGrabbedTarget && projectileSpecial.grabbedTargetId) {
            const grabbedTarget = world.entities.get(projectileSpecial.grabbedTargetId)
            
            if (grabbedTarget && grabbedTarget.health > 0) {
              // Force target to exact hand position for better visual grab
              const grabOffset = { x: 0, y: 0 } // Target stays exactly at hand position
              grabbedTarget.position.x = entity.position.x + grabOffset.x
              grabbedTarget.position.y = entity.position.y + grabOffset.y
              
              // Completely stop target movement and disable physics temporarily
              grabbedTarget.velocity = { x: 0, y: 0 }
              ;(grabbedTarget as any).isGrabbed = true // Mark as grabbed to prevent other physics
              
              // Punch sequence
              const currentTime = Date.now()
              if (currentTime - projectileSpecial.lastPunchTime >= projectileSpecial.punchInterval) {
                if (projectileSpecial.punchCount < 5) {
                  // Deal punch damage
                  let punchDamage = 8 // 8 damage per punch (5 punches = 40 total damage)
                  if ((grabbedTarget as any).damageReduction) {
                    punchDamage *= (1 - (grabbedTarget as any).damageReduction)
                  }
                  grabbedTarget.health = Math.max(0, grabbedTarget.health - punchDamage)
                  
                  projectileSpecial.punchCount++
                  projectileSpecial.lastPunchTime = currentTime
                  
                  // Visual punch effect (store for rendering)
                  projectileSpecial.justPunched = true
                  setTimeout(() => {
                    if (projectileSpecial) projectileSpecial.justPunched = false
                  }, 150)
                  
                  // Add small screen shake effect for punch impact
                  projectileSpecial.punchShake = 3
                  setTimeout(() => {
                    if (projectileSpecial) projectileSpecial.punchShake = 0
                  }, 100)
                } else {
                  // Finished punching, release target with knockback
                  ;(grabbedTarget as any).isGrabbed = false // Re-enable physics FIRST
                  
                  const knockbackForce = projectileSpecial.knockbackForce || 200
                  const knockbackDir = Vector.normalize(Vector.subtract(grabbedTarget.position, projectileSpecial.startPosition))
                  const knockbackVelocity = Vector.multiply(knockbackDir, knockbackForce)
                  
                  // Apply immediate velocity for knockback
                  grabbedTarget.velocity.x = knockbackVelocity.x
                  grabbedTarget.velocity.y = knockbackVelocity.y
                  
                  // Clear the grab flag immediately to restore movement
                  delete (grabbedTarget as any).isGrabbed
                  
                  // Add a brief cooldown period where the target can't be grabbed again
                  ;(grabbedTarget as any).grabCooldownUntil = Date.now() + 1000 // 1 second immunity
                  
                  // Hand starts retracting
                  projectileSpecial.hasGrabbedTarget = false
                  projectileSpecial.grabbedTargetId = null
                  projectileSpecial.isExtending = false
                  
                  const retractionSpeed = projectileSpecial.retractionSpeed || 400
                  const dirToStart = Vector.normalize(Vector.subtract(projectileSpecial.startPosition, entity.position))
                  entity.velocity = Vector.multiply(dirToStart, retractionSpeed)
                }
              }
            } else {
              // Target died during grab, start retracting and clean up
              if (projectileSpecial.grabbedTargetId) {
                const deadTarget = world.entities.get(projectileSpecial.grabbedTargetId)
                if (deadTarget) {
                  delete (deadTarget as any).isGrabbed // Clean up grab flag
                }
              }
              
              projectileSpecial.hasGrabbedTarget = false
              projectileSpecial.grabbedTargetId = null
              projectileSpecial.isExtending = false
              
              const retractionSpeed = projectileSpecial.retractionSpeed || 400
              const dirToStart = Vector.normalize(Vector.subtract(projectileSpecial.startPosition, entity.position))
              entity.velocity = Vector.multiply(dirToStart, retractionSpeed)
            }
          } else {
            // Normal extension behavior - look for targets to grab
            const distanceFromStart = Vector.distance(entity.position, projectileSpecial.startPosition)
            
            if (projectileSpecial.isExtending) {
              // Enhanced grab detection with prediction
              for (const [targetId, targetEntity] of world.entities) {
                if (targetEntity.type === 'player' && 
                    targetEntity.id !== (entity as any).ownerId &&
                    targetEntity.health > 0 &&
                    !(targetEntity as any).isGrabbed && // Don't grab already grabbed targets
                    !((targetEntity as any).grabCooldownUntil > Date.now())) { // Check grab cooldown
                  
                  // Use larger detection radius for better grab accuracy
                  const grabDistance = Vector.distance(entity.position, targetEntity.position)
                  const effectiveGrabRadius = projectileSpecial.grabRadius + targetEntity.radius + entity.radius
                  
                  // Also check predicted position based on target velocity
                  const targetFuturePos = {
                    x: targetEntity.position.x + targetEntity.velocity.x * 0.1, // Predict 100ms ahead
                    y: targetEntity.position.y + targetEntity.velocity.y * 0.1
                  }
                  const predictedDistance = Vector.distance(entity.position, targetFuturePos)
                  
                  if (grabDistance <= effectiveGrabRadius || predictedDistance <= effectiveGrabRadius) {
                    // Successfully grabbed the target!
                    projectileSpecial.hasGrabbedTarget = true
                    projectileSpecial.grabbedTargetId = targetId
                    projectileSpecial.punchCount = 0
                    projectileSpecial.lastPunchTime = Date.now()
                    
                    // Make Iron Titan invulnerable during combo
                    const ironTitan = world.entities.get((entity as any).ownerId)
                    if (ironTitan) {
                      ;(ironTitan as any).comboInvulnerableUntil = Date.now() + 2000 // 2 second invulnerability during combo
                    }
                    
                    // Stop the hand extension immediately
                    entity.velocity = { x: 0, y: 0 }
                    
                    // Snap target to hand position for clean grab
                    targetEntity.position.x = entity.position.x
                    targetEntity.position.y = entity.position.y
                    targetEntity.velocity = { x: 0, y: 0 }
                    ;(targetEntity as any).isGrabbed = true
                    
                    break
                  }
                }
              }
              
              // If no target grabbed and reached max distance, start retracting
              if (!projectileSpecial.hasGrabbedTarget && distanceFromStart >= projectileSpecial.maxDistance) {
                projectileSpecial.isExtending = false
                
                const retractionSpeed = projectileSpecial.retractionSpeed || 400
                const dirToStart = Vector.normalize(Vector.subtract(projectileSpecial.startPosition, entity.position))
                entity.velocity = Vector.multiply(dirToStart, retractionSpeed)
              }
            } else {
              // Hand is retracting
              if (distanceFromStart <= 10) { // Close enough to start position
                entity.health = 0 // Mark for removal
              }
            }
          }
        }
        
        // Shield Wall behavior (Steel Guardian - defensive wall formation)
        if (projectileSpecial.isShieldWall) {
          // Initialize shield wall properties
          if (!projectileSpecial.spawnTime) {
            projectileSpecial.spawnTime = Date.now()
            projectileSpecial.travelDistance = 0
            projectileSpecial.stopDistance = 150 // Distance to travel before stopping
          }
          
          // Track distance traveled
          const speed = Vector.magnitude(entity.velocity)
          if (speed > 0) {
            projectileSpecial.travelDistance += speed * world.fixedTimeStep
          }
          
          // Stop moving and become active shield after traveling enough distance
          if (!projectileSpecial.isActiveShield && projectileSpecial.travelDistance >= projectileSpecial.stopDistance) {
            entity.velocity = { x: 0, y: 0 } // Stop moving
            projectileSpecial.isActiveShield = true
            projectileSpecial.activationTime = Date.now()
          }
          
          // Check if shield wall has expired
          if (projectileSpecial.isActiveShield) {
            const currentTime = Date.now()
            const timeActive = currentTime - projectileSpecial.activationTime
            
            if (timeActive >= projectileSpecial.shieldDuration || projectileSpecial.shieldHealth <= 0) {
              entity.health = 0 // Mark for removal
            }
          }
          
          // Shield reflection behavior - check for incoming projectiles
          if (projectileSpecial.isActiveShield) {
            for (const [targetId, targetEntity] of world.entities) {
              if (targetEntity.type === 'projectile' && 
                  targetEntity.id !== entity.id &&
                  (targetEntity as any).ownerId !== (entity as any).ownerId) {
                
                const distance = Vector.distance(entity.position, targetEntity.position)
                const shieldRadius = entity.radius + 10 // Slightly larger detection
                
                if (distance <= shieldRadius) {
                  // Shield interaction with projectile
                  if (Math.random() < projectileSpecial.reflectChance) {
                    // Reflect the projectile
                    const reflectDir = Vector.normalize(Vector.subtract(targetEntity.position, entity.position))
                    const speed = Vector.magnitude(targetEntity.velocity)
                    targetEntity.velocity = Vector.multiply(reflectDir, speed)
                    ;(targetEntity as any).ownerId = (entity as any).ownerId // Now belongs to shield owner
                  } else {
                    // Absorb the projectile and take damage
                    projectileSpecial.shieldHealth -= (targetEntity.damage || 10)
                    targetEntity.health = 0 // Remove the absorbed projectile
                  }
                }
              }
            }
          }
        }
        
        // Energy Wave behavior (Steel Guardian - growing wave with DOT and slow)
        if (projectileSpecial.isEnergyWave) {
          // Initialize energy wave properties
          if (!projectileSpecial.spawnTime) {
            projectileSpecial.spawnTime = Date.now()
            projectileSpecial.distanceTraveled = 0
            projectileSpecial.affectedTargets = new Set()
            projectileSpecial.dotApplications = new Map() // Track DOT applications per target
          }
          
          // Track distance traveled and grow the wave
          const speed = Vector.magnitude(entity.velocity)
          if (speed > 0) {
            const deltaDistance = speed * world.fixedTimeStep
            projectileSpecial.distanceTraveled += deltaDistance
            
            // Grow the wave based on distance traveled
            const growthFactor = 1 + (projectileSpecial.distanceTraveled / 100) * (projectileSpecial.waveGrowthRate - 1)
            entity.radius = projectileSpecial.originalRadius * growthFactor
          }
          
          // Check for enemies within the wave
          for (const [targetId, targetEntity] of world.entities) {
            if (targetEntity.type === 'player' && 
                targetEntity.id !== (entity as any).ownerId &&
                targetEntity.health > 0) {
              
              const distance = Vector.distance(entity.position, targetEntity.position)
              const waveRadius = entity.radius
              
              if (distance <= waveRadius) {
                const currentTime = Date.now()
                
                // Ensure dotApplications is initialized (safety check)
                if (!projectileSpecial.dotApplications) {
                  projectileSpecial.dotApplications = new Map()
                }
                if (!projectileSpecial.affectedTargets) {
                  projectileSpecial.affectedTargets = new Set()
                }
                
                // Apply DOT if not already affected or if enough time has passed
                const lastDotTime = projectileSpecial.dotApplications.get(targetId) || 0
                const dotInterval = 500 // Apply DOT every 500ms
                
                if (currentTime - lastDotTime >= dotInterval) {
                  // Apply damage over time
                  const dotDamage = projectileSpecial.damageOverTime || 15
                  targetEntity.health = Math.max(0, targetEntity.health - dotDamage)
                  projectileSpecial.dotApplications.set(targetId, currentTime)
                  
                  // Apply slow effect
                  const slowStrength = projectileSpecial.slowEffectStrength || 0.4
                  const slowDuration = projectileSpecial.slowDuration || 4000
                  
                  if (!(targetEntity as any).slowedUntil || (targetEntity as any).slowedUntil < currentTime + slowDuration) {
                    ;(targetEntity as any).slowedUntil = currentTime + slowDuration
                    ;(targetEntity as any).slowStrength = slowStrength
                  }
                  
                  // Mark as affected to prevent multiple applications
                  projectileSpecial.affectedTargets.add(targetId)
                }
              }
            }
          }
        }
        
        // Boomerang behavior (Plasma Vortex)
        if (projectileSpecial.isBoomerang && !projectileSpecial.returnPhase) {
          // Ensure originalPosition is set if not already
          if (!projectileSpecial.originalPosition) {
            projectileSpecial.originalPosition = { ...entity.position }
            projectileSpecial.traveledDistance = 0
          }
          
          // Track distance traveled from original position
          if (!projectileSpecial.traveledDistance) {
            projectileSpecial.traveledDistance = 0
          }
          projectileSpecial.traveledDistance += Vector.magnitude(entity.velocity) * deltaTime
          
          if (projectileSpecial.traveledDistance >= (projectileSpecial.maxDistance || 300)) {
            projectileSpecial.returnPhase = true
            // Reverse velocity to return to shooter
            const shooter = world.entities.get(projectileSpecial.originalShooter)
            if (shooter) {
              const returnDirection = Vector.normalize(Vector.subtract(shooter.position, entity.position))
              const speed = Vector.magnitude(entity.velocity)
              entity.velocity = Vector.multiply(returnDirection, speed * 1.2) // Slightly faster return
            }
          }
        }
        
        // Vortex behavior (New Plasma Vortex)
        if (projectileSpecial.isVortex) {
          if (!projectileSpecial.hasFormedVortex) {
            // Track distance traveled
            projectileSpecial.distanceTraveled = projectileSpecial.distanceTraveled || 0
            projectileSpecial.distanceTraveled += Vector.magnitude(entity.velocity) * deltaTime
            
            // Check if bullet should stop and form vortex
            if (projectileSpecial.distanceTraveled >= (projectileSpecial.vortexStopDistance || 250)) {
              projectileSpecial.hasFormedVortex = true
              projectileSpecial.vortexFormTime = Date.now()
              entity.velocity = Vector.create(0, 0) // Stop the bullet
              entity.radius = projectileSpecial.vortexRadius || 60 // Expand to vortex size
              entity.isStatic = true // Make vortex completely immovable
              entity.mass = Infinity // Prevent any movement from collisions
            }
          } else {
            // Vortex is active - apply pulling force and damage
            const currentTime = Date.now()
            const timeSinceForm = currentTime - projectileSpecial.vortexFormTime
            
            // Check if vortex should expire (always use vortexDuration, ignore touched status)
            const maxDuration = projectileSpecial.vortexDuration || 3000
            if (timeSinceForm >= maxDuration) {
              entity.health = 0 // Mark for removal
            } else {
              // Apply suction to nearby enemies
              for (const [targetId, targetEntity] of world.entities) {
                if (targetEntity.type === 'player' && 
                    targetEntity.id !== (entity as ProjectileEntity).ownerId &&
                    targetEntity.health > 0) {
                  const distance = Vector.distance(entity.position, targetEntity.position)
                  const vortexRadius = projectileSpecial.vortexRadius || 60
                  
                  if (distance <= vortexRadius) {
                    // Enemy is inside vortex - mark as touched and apply damage
                    if (!projectileSpecial.vortexTouched) {
                      projectileSpecial.vortexTouched = true
                      projectileSpecial.vortexFormTime = currentTime // Reset timer
                    }
                    
                    // Apply continuous damage
                    const lastDamageTime = projectileSpecial.lastDamageTime.get(targetId) || 0
                    if (currentTime - lastDamageTime >= 200) { // Damage every 200ms
                      const damage = (projectileSpecial.vortexDamageRate || 12) * 0.2 // 0.2 second worth of damage
                      targetEntity.health = Math.max(0, targetEntity.health - damage)
                      projectileSpecial.lastDamageTime.set(targetId, currentTime)
                      
                      // Increment stack for vortex owner (only when damage is actually applied)
                      const ownerId = (entity as ProjectileEntity).ownerId
                      if (ownerId && world.entities.has(ownerId)) {
                        const owner = world.entities.get(ownerId)
                        if (owner) {
                          if (!(owner as any).vortexStacks) {
                            ;(owner as any).vortexStacks = 0
                          }
                          ;(owner as any).vortexStacks++
                        }
                      }
                    }
                    
                    // Suction removed: previously pulled enemies toward the vortex center which
                    // distorted movement. We keep damage and stacking behavior but no longer
                    // apply any pulling forces.
                  }
                  
                  // Range suction disabled - no pull applied outside the vortex either.
                }
              }
            }
          }
        }
        
        // Mine behavior (Chaos Bomber)
        if (projectileSpecial.proximityMine && projectileSpecial.isStationary) {
          // Check for nearby enemies
          for (const [targetId, targetEntity] of world.entities) {
            if (targetEntity.type === 'player' && 
                targetEntity.id !== (entity as ProjectileEntity).ownerId &&
                targetEntity.health > 0) {
              const distance = Vector.distance(entity.position, targetEntity.position)
              if (distance <= (projectileSpecial.activationRadius || 50)) {
                // Explode the mine
                projectileSpecial.explosive = true
                projectileSpecial.explosiveRadius = projectileSpecial.explosiveRadius || 40
                entity.health = 0 // Mark for removal and explosion
                break
              }
            }
          }
        }
        
        // Chain lightning behavior (Lightning Striker, Blade Master)
        if (projectileSpecial.chainLightning && projectileSpecial.chainCount > 0) {
          // Find nearby enemies for chaining
          for (const [targetId, targetEntity] of world.entities) {
            if (targetEntity.type === 'player' && 
                targetEntity.id !== (entity as ProjectileEntity).ownerId &&
                targetEntity.health > 0 &&
                !projectileSpecial.alreadyChained.has(targetId)) {
              const distance = Vector.distance(entity.position, targetEntity.position)
              if (distance <= (projectileSpecial.chainRange || 100)) {
                // Apply chain damage
                targetEntity.health = Math.max(0, targetEntity.health - (entity.damage * 0.7))
                projectileSpecial.alreadyChained.add(targetId)
                projectileSpecial.chainCount--
                
                // Visual effect: spawn small chain projectiles
                if (projectileSpecial.chainCount > 0) {
                  const chainDirection = Vector.normalize(Vector.subtract(targetEntity.position, entity.position))
                  // Could spawn visual chain effect here
                }
                break
              }
            }
          }
        }
        
        // Void rift behavior (Void Sniper)
        if (projectileSpecial.voidRift && !projectileSpecial.hasRifted) {
          const distanceTraveled = Vector.distance(entity.position, projectileSpecial.originalPosition || entity.position)
          if (distanceTraveled >= (projectileSpecial.teleportDistance || 150)) {
            // Teleport to a new position near an enemy
            for (const [targetId, targetEntity] of world.entities) {
              if (targetEntity.type === 'player' && 
                  targetEntity.id !== (entity as ProjectileEntity).ownerId &&
                  targetEntity.health > 0) {
                // Teleport behind the target
                const offsetDirection = Vector.normalize(Vector.subtract(entity.position, targetEntity.position))
                const newPosition = Vector.add(targetEntity.position, Vector.multiply(offsetDirection, -30))
                entity.position = newPosition
                projectileSpecial.hasRifted = true
                break
              }
            }
          }
        }
        
        // Shadow clone behavior (Shadow Assassin)
        if (projectileSpecial.createsCopies && !projectileSpecial.copiesCreated) {
          projectileSpecial.copiesCreated = true
          // Create visual copies that follow slightly different paths
          for (let i = 0; i < (projectileSpecial.copyCount || 2); i++) {
            const angleOffset = (i + 1) * 15 * Math.PI / 180 // 15 degree offset
            const cos = Math.cos(angleOffset)
            const sin = Math.sin(angleOffset)
            const copyVelocity = Vector.create(
              entity.velocity.x * cos - entity.velocity.y * sin,
              entity.velocity.x * sin + entity.velocity.y * cos
            )
            // Could spawn visual copy projectiles here with copyVelocity
          }
        }
        
        // Apply freezing effect to projectile movement
        const currentTime = Date.now()
        const speedMultiplier = (entity as any).frozenUntil > currentTime ? 0.3 : 1.0
        
        // Debug projectile velocity before position update
        if (entity.id.includes('projectile') && Math.random() < 0.1) { // Log 10% of projectiles to avoid spam
          console.log('🎯 Projectile update:', {
            id: entity.id,
            velocity: entity.velocity,
            position: entity.position,
            fixedTimeStep: world.fixedTimeStep,
            speedMultiplier
          });
        }
        
        // Projectiles only update position, no physics interactions
        entity.position.x += entity.velocity.x * world.fixedTimeStep * speedMultiplier
        entity.position.y += entity.velocity.y * world.fixedTimeStep * speedMultiplier
        
        // Optimized boundary checks for projectiles (only check if close to boundaries)
        const buffer = entity.radius + 10
        if (entity.position.x < buffer || entity.position.x > world.bounds.width - buffer ||
            entity.position.y < buffer || entity.position.y > world.bounds.height - buffer) {
          
          // More precise boundary check
          if (entity.position.x - entity.radius <= 0 || 
              entity.position.x + entity.radius >= world.bounds.width ||
              entity.position.y - entity.radius <= 0 || 
              entity.position.y + entity.radius >= world.bounds.height) {
            
            // Special handling for vortex projectiles - transform to vortex instead of deleting
            if ((entity as any).isVortex && !(entity as any).hasFormedVortex) {
              (entity as any).hasFormedVortex = true
              entity.velocity = { x: 0, y: 0 }
              ;(entity as any).type = 'vortex'
              entity.health = 100
              ;(entity as any).lastDamageTime = 0
              
              // Ensure vortex forms at a valid position within bounds
              entity.position.x = Math.max(entity.radius + 5, Math.min(world.bounds.width - entity.radius - 5, entity.position.x))
              entity.position.y = Math.max(entity.radius + 5, Math.min(world.bounds.height - entity.radius - 5, entity.position.y))
              
              // Set vortex properties to match collision resolution
              entity.radius = (entity as any).vortexRadius || 60
              ;(entity as any).hitsRemaining = Infinity
              entity.isStatic = true
              entity.mass = Infinity
              
              // Set vortex duration
              ;(entity as any).vortexFormTime = Date.now()
              ;(entity as any).vortexStartTime = Date.now()
              ;(entity as any).vortexDuration = 3000
              
              // Initialize damage tracking for vortex
              if (!(entity as any).lastDamageTime) {
                ;(entity as any).lastDamageTime = new Map()
              }
            } else {
              entity.health = 0 // Mark for removal for non-vortex projectiles
            }
          }
        }
      } else {
        // Skip physics for grabbed entities (they're controlled by iron hand)
        if ((entity as any).isGrabbed) {
          continue
        }
        
        // Apply freezing effect to player movement
        const currentTime = Date.now()
        const speedMultiplier = (entity as any).frozenUntil > currentTime ? 0.3 : 1.0
        
        // Normal physics for non-projectiles with speed adjustment
        const originalVelocity = { ...entity.velocity }
        integrate(entity, world.fixedTimeStep)
        
        if (speedMultiplier < 1.0) {
          entity.velocity = Vector.multiply(entity.velocity, speedMultiplier)
        }
        
        handleBoundaryCollision(entity, world.bounds)
      }
    }
    
    // Collision detection and response
    const entities = Array.from(world.entities.values())
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entityA = entities[i]
        const entityB = entities[j]
        
        // Skip projectile-to-projectile collisions
        if (entityA.type === 'projectile' && entityB.type === 'projectile') {
          continue
        }
        
        // Skip collisions involving grabbed entities
        if ((entityA as any).isGrabbed || (entityB as any).isGrabbed) {
          continue
        }
        
        // Skip collisions involving entities with combo invulnerability
        const currentTime = Date.now()
        if (((entityA as any).comboInvulnerableUntil > currentTime) || 
            ((entityB as any).comboInvulnerableUntil > currentTime)) {
          continue // Prevent collision damage during combos
        }
        
        // Extra protection: Skip collisions between iron hand projectiles and their owners
        const isIronHandA = entityA.type === 'projectile' && (entityA as any).isIronHand
        const isIronHandB = entityB.type === 'projectile' && (entityB as any).isIronHand
        
        if (isIronHandA && (entityA as any).ownerId === entityB.id) {
          continue // Iron hand can't collide with its owner
        }
        if (isIronHandB && (entityB as any).ownerId === entityA.id) {
          continue // Iron hand can't collide with its owner
        }
        
        const collision = detectCollision(entityA, entityB)
        if (collision) {
          resolveCollision(collision, world)
          // Only apply chain knockback for non-projectile entities
          if (entityA.type !== 'projectile' && entityB.type !== 'projectile') {
            applyChainKnockback(world, collision)
          }
        }
      }
    }
    
    // Apply friction
    applyFriction(world)
    
    world.timeAccumulator -= world.fixedTimeStep
  }
}

// Utility functions for external use
export function addForce(entity: CircleEntity, force: Vector): void {
  if (entity.isStatic) return
  // Block force application if immobilized
  const now = Date.now();
  if ((entity as any).immobilized && (entity as any).immobilizedUntil > now) {
    entity.velocity = { x: 0, y: 0 };
    entity.acceleration = { x: 0, y: 0 };
    return;
  }
  // Add force to entity's acceleration
  entity.acceleration = Vector.add(entity.acceleration, force)
}

export function setVelocity(entity: CircleEntity, velocity: Vector): void {
  if (!entity.isStatic) {
    entity.velocity = velocity
  }
}

export function teleport(entity: CircleEntity, position: Vector): void {
  entity.position = position
}

// Weapon system integration
export function fireWeapon(world: PhysicsWorld, entityId: string, weaponData: any, targetDirection: Vector, currentTime: number): boolean {
  const entity = world.entities.get(entityId)
  if (!entity) return false
  
  // Check cooldown and energy
  const cooldownEnd = entity.weaponCooldowns?.get(weaponData.id) || 0
  if (currentTime < cooldownEnd) return false
  if ((entity.energy || 0) < weaponData.cost) return false
  
  // Update entity cooldown and energy
  if (!entity.weaponCooldowns) entity.weaponCooldowns = new Map()
  entity.weaponCooldowns.set(weaponData.id, currentTime + weaponData.cooldownMs)
  entity.energy = (entity.energy || 0) - weaponData.cost
  
  // Create weapon effect
  if (weaponData.type === 'projectile') {
    const projectile = createWeaponProjectile(entity, weaponData, targetDirection, currentTime)
    world.entities.set(projectile.id, projectile)
  } else if (weaponData.type === 'aura') {
    const aura = createWeaponAura(entity, weaponData, currentTime)
    world.entities.set(aura.id, aura)
  }
  
  return true
}

function createWeaponProjectile(owner: CircleEntity, weaponData: any, direction: Vector, currentTime: number): WeaponProjectile {
  const normalizedDir = Vector.normalize(direction)
  const spawnOffset = Vector.multiply(normalizedDir, owner.radius + weaponData.radius + 2)
  
  return {
    id: `projectile_${currentTime}_${Math.random().toString(36).substring(2, 9)}`,
    type: 'projectile',
    weaponId: weaponData.id,
    ownerId: owner.id,
    position: Vector.add(owner.position, spawnOffset),
    velocity: Vector.multiply(normalizedDir, weaponData.projectileSpeed || 200),
    acceleration: { x: 0, y: 0 },
    radius: weaponData.radius,
    mass: 1,
    health: 1,
    maxHealth: 1,
    damage: weaponData.baseDamage,
    restitution: 0.8,
    friction: 0.02,
    isStatic: false,
    speed: weaponData.projectileSpeed || 200,
    lifetime: weaponData.lifetime || 2000,
    piercing: weaponData.piercing || 0,
    hitsRemaining: weaponData.piercing || 0,
    bounces: weaponData.bounces || 0,
    bouncesRemaining: weaponData.bounces || 0,
    special: weaponData.special || [],
    spawnTime: currentTime
  } as WeaponProjectile & { spawnTime: number }
}

function createWeaponAura(owner: CircleEntity, weaponData: any, currentTime: number): WeaponAura {
  return {
    id: `aura_${currentTime}_${Math.random().toString(36).substring(2, 9)}`,
    type: 'aura',
    weaponId: weaponData.id,
    ownerId: owner.id,
    position: { ...owner.position },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    radius: weaponData.auraRadius || weaponData.radius,
    mass: 0,
    health: 1,
    maxHealth: 1,
    damage: weaponData.baseDamage,
    restitution: 0,
    friction: 0,
    isStatic: true,
    duration: weaponData.auraDuration || 1000,
    special: weaponData.special || [],
    affectedEntities: new Set(),
    lifetime: weaponData.auraDuration || 1000,
    spawnTime: currentTime
  } as WeaponAura & { spawnTime: number }
}

export function updateWeaponCooldowns(entity: CircleEntity, currentTime: number): void {
  if (!entity.weaponCooldowns) return
  
  for (const [weaponId, cooldownEnd] of entity.weaponCooldowns) {
    if (currentTime >= cooldownEnd) {
      entity.weaponCooldowns.delete(weaponId)
    }
  }
}

export function regenerateEnergy(entity: CircleEntity, dt: number): void {
  if (entity.energy !== undefined && entity.maxEnergy !== undefined) {
    entity.energy = Math.min(entity.maxEnergy, entity.energy + 20 * dt) // 20 energy/sec
  }
}

// AI Combat System
export function updateAI(entity: CircleEntity, world: PhysicsWorld, deltaTime: number, weapons: any[]): void {
  if (!entity.id.includes('ai') && !entity.id.includes('bot')) return
  // Block AI movement if immobilized
  const now = Date.now();
  if ((entity as any).immobilized && (entity as any).immobilizedUntil > now) {
    entity.velocity = { x: 0, y: 0 };
    entity.acceleration = { x: 0, y: 0 };
    return;
  }
  const currentTime = Date.now()
  // Find nearest enemy
  let nearestEnemy: CircleEntity | null = null
  let nearestDistance = Infinity
  for (const [id, otherEntity] of world.entities) {
    if (otherEntity === entity || otherEntity.health <= 0) continue
    if (entity.id.includes('bot') && otherEntity.id.includes('bot')) continue // Bots don't fight each other
    const distance = Vector.distance(entity.position, otherEntity.position)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestEnemy = otherEntity
    }
  }
  if (!nearestEnemy) return
  // AI Behavior based on distance and health
  const healthRatio = entity.health / entity.maxHealth
  const distanceToEnemy = nearestDistance
  // Movement AI
  if (distanceToEnemy > 100) {
    // Move towards enemy
    const direction = Vector.normalize(Vector.subtract(nearestEnemy.position, entity.position))
    const moveForce = Vector.multiply(direction, 200 * healthRatio) // Slower when hurt
    addForce(entity, moveForce)
  } else if (distanceToEnemy < 50 && healthRatio < 0.3) {
    // Retreat when low on health and too close
    const direction = Vector.normalize(Vector.subtract(entity.position, nearestEnemy.position))
    const retreatForce = Vector.multiply(direction, 300)
    addForce(entity, retreatForce)
  } else {
    // Circle around enemy
    const toEnemy = Vector.subtract(nearestEnemy.position, entity.position)
    const perpendicular = { x: -toEnemy.y, y: toEnemy.x }
    const circleDirection = Vector.normalize(perpendicular)
    const circleForce = Vector.multiply(circleDirection, 150)
    addForce(entity, circleForce)
  }
  
  // Combat AI - try to attack every 1-2 seconds
  if (!entity.lastAttackTime) entity.lastAttackTime = 0
  const timeSinceAttack = currentTime - entity.lastAttackTime
  const attackCooldown = 1000 + Math.random() * 1000 // 1-2 seconds
  
  // Use dynamic attack range based on character stats
  const attackRange = (entity as any).attackRange || 200 // Default to 200 if not set
  
  if (timeSinceAttack > attackCooldown && distanceToEnemy < attackRange) {
    // Find weapon to use
    const availableWeapon = weapons.find(w => w.id === entity.weaponId)
    if (availableWeapon && entity.energy && entity.energy >= availableWeapon.cost) {
      const attackDirection = Vector.normalize(Vector.subtract(nearestEnemy.position, entity.position))
      
      // Add some inaccuracy to make fights more interesting
      const inaccuracy = (Math.random() - 0.5) * 0.3
      const finalDirection = {
        x: attackDirection.x + inaccuracy,
        y: attackDirection.y + inaccuracy
      }
      
      if (fireWeapon(world, entity.id, availableWeapon, Vector.normalize(finalDirection), currentTime)) {
        entity.lastAttackTime = currentTime
      }
    }
  }
}
