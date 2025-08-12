// Core physics types and functions for deterministic circle-based gameplay

export interface Vector {
  x: number
  y: number
}

export interface CircleEntity {
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
  type: 'player' | 'projectile' | 'pickup' | 'hazard' | 'aura'
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

export interface Projectile extends CircleEntity {
  type: 'projectile'
  speed: number
  lifetime: number
  piercing: number // How many entities it can hit
  hitsRemaining: number
  characterType?: string // For visual styling
}

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
  return {
    entities: new Map(),
    gravity: Vector.create(0, 0), // No gravity by default for top-down arena
    airFriction: 0.99,
    timeAccumulator: 0,
    fixedTimeStep: 1 / 60, // 60 FPS physics
    bounds: { width, height }
  }
}

export function createCircleEntity(
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
): Projectile {
  const velocity = Vector.multiply(Vector.normalize(direction), speed)
  
  return {
    id,
    position: Vector.create(x, y),
    velocity,
    acceleration: Vector.create(),
    radius: 5,
    mass: 1,
    health: 1,
    maxHealth: 1,
    damage: 10, // Reduced default damage from 25 to 10
    restitution: 0.2,
    friction: 1, // No friction for projectiles
    isStatic: false,
    type: 'projectile',
    ownerId,
    speed,
    lifetime,
    piercing: 0,
    hitsRemaining: 1,
    characterType
  }
}

// Collision detection
export function detectCollision(a: CircleEntity, b: CircleEntity): Collision | null {
  const distance = Vector.distance(a.position, b.position)
  const minDistance = a.radius + b.radius
  
  if (distance >= minDistance) {
    return null // No collision
  }
  
  const normal = Vector.normalize(Vector.subtract(b.position, a.position))
  const penetration = minDistance - distance
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
  
  // Skip if either entity is static and the other is a projectile
  if ((entityA.isStatic || entityB.isStatic) && 
      (entityA.type === 'projectile' || entityB.type === 'projectile')) {
    return
  }
  
  // Positional correction to prevent overlap
  const correctionPercent = 0.8
  const correction = Vector.multiply(normal, penetration * correctionPercent)
  
  if (!entityA.isStatic && !entityB.isStatic) {
    const totalMass = entityA.mass + entityB.mass
    entityA.position = Vector.subtract(entityA.position, Vector.multiply(correction, entityB.mass / totalMass))
    entityB.position = Vector.add(entityB.position, Vector.multiply(correction, entityA.mass / totalMass))
  } else if (!entityA.isStatic) {
    entityA.position = Vector.subtract(entityA.position, correction)
  } else if (!entityB.isStatic) {
    entityB.position = Vector.add(entityB.position, correction)
  }
  
  // Calculate momentum-based damage (reduced for longer battles)
  const baseDamage = Math.max(entityA.damage, entityB.damage)
  const momentumDamage = baseDamage * 0.3 * (1 + Math.min(relativeVelocity / 600, 1)) // Reduced by 70%
  
  // Apply damage with invulnerability frames
  const currentTime = Date.now()
  
  if (entityA.type !== 'projectile' && entityB.type !== 'pickup' && 
      entityA.invulnerableUntil! < currentTime) {
    entityA.health = Math.max(0, entityA.health - momentumDamage)
    entityA.invulnerableUntil = currentTime + 500 // 500ms immunity
  }
  
  if (entityB.type !== 'projectile' && entityA.type !== 'pickup' && 
      entityB.invulnerableUntil! < currentTime) {
    entityB.health = Math.max(0, entityB.health - momentumDamage)
    entityB.invulnerableUntil = currentTime + 500
  }
  
  // Elastic collision response - but don't affect projectile velocities
  if (!entityA.isStatic && !entityB.isStatic && 
      entityA.type !== 'projectile' && entityB.type !== 'projectile') {
    const relativeVel = Vector.subtract(entityA.velocity, entityB.velocity)
    const velAlongNormal = Vector.dot(relativeVel, normal)
    
    if (velAlongNormal > 0) return // Objects separating
    
    const restitution = Math.max(entityA.restitution, entityB.restitution) * 1.05 // Slightly gain energy to maintain movement
    const impulseScalar = -(1 + restitution) * velAlongNormal / (1/entityA.mass + 1/entityB.mass)
    
    const impulse = Vector.multiply(normal, impulseScalar)
    
    // Small random variation for natural movement
    const randomBoost = Vector.create(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    )
    
    entityA.velocity = Vector.add(entityA.velocity, Vector.add(Vector.multiply(impulse, 1/entityA.mass), randomBoost))
    entityB.velocity = Vector.subtract(entityB.velocity, Vector.add(Vector.multiply(impulse, 1/entityB.mass), randomBoost))
  }
  
  // Handle projectile hits
  if (entityA.type === 'projectile' || entityB.type === 'projectile') {
    const projectile = entityA.type === 'projectile' ? entityA as Projectile : entityB as Projectile
    const target = entityA.type === 'projectile' ? entityB : entityA
    
    // Prevent friendly fire - projectiles don't hurt their owner
    if (projectile.ownerId === target.id) {
      return // Skip damage if projectile hits its owner
    }
    
    // Apply damage to target
    if (target.type === 'player' && target.health > 0) {
      const projectileDamage = projectile.damage || 10 // Reduced default from 25 to 10
      target.health = Math.max(0, target.health - projectileDamage)
      
      // Check for critical hit (high velocity impact)
      const isCriticalHit = relativeVelocity > 400
      
      if (isCriticalHit && target.weaponId && target.type === 'player') {
        // Weapon swap on critical hit - drop weapon as pickup
        spawnWeaponPickup(world, target.position, target.weaponId)
        target.weaponId = undefined
      }
    }
    
    // Remove projectile or reduce piercing
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
        const targetSpeed = 250 // Constant bouncing speed
        
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
  
  // Apply gravity
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
  
  // Left boundary
  if (entity.position.x - entity.radius < 0) {
    entity.position.x = entity.radius
    entity.velocity.x = -entity.velocity.x * bounceFactor
    // Small random component for variety but maintain overall speed
    entity.velocity.y += (Math.random() - 0.5) * 20
  }
  
  // Right boundary
  if (entity.position.x + entity.radius > bounds.width) {
    entity.position.x = bounds.width - entity.radius
    entity.velocity.x = -entity.velocity.x * bounceFactor
    // Small random component for variety but maintain overall speed
    entity.velocity.y += (Math.random() - 0.5) * 20
  }
  
  // Top boundary
  if (entity.position.y - entity.radius < 0) {
    entity.position.y = entity.radius
    entity.velocity.y = -entity.velocity.y * bounceFactor
    // Small random component for variety but maintain overall speed
    entity.velocity.x += (Math.random() - 0.5) * 20
  }
  
  // Bottom boundary
  if (entity.position.y + entity.radius > bounds.height) {
    entity.position.y = bounds.height - entity.radius
    entity.velocity.y = -entity.velocity.y * bounceFactor
    // Small random component for variety but maintain overall speed
    entity.velocity.x += (Math.random() - 0.5) * 20
  }
}

// Main physics simulation step
export function simulateStep(world: PhysicsWorld, deltaTime: number): void {
  world.timeAccumulator += deltaTime
  
  // Fixed timestep with accumulator pattern for determinism
  while (world.timeAccumulator >= world.fixedTimeStep) {
    const currentTime = Date.now()
    
    // Remove expired entities
    for (const [id, entity] of world.entities) {
      if (entity.lifetime && currentTime > (entity.lifetime + (entity as any).spawnTime || 0)) {
        world.entities.delete(id)
        continue
      }
      
      // Remove dead entities
      if (entity.health <= 0) {
        world.entities.delete(id)
        continue
      }
    }
    
    // Update weapon systems and energy
    for (const [id, entity] of world.entities) {
      updateWeaponCooldowns(entity, currentTime)
      regenerateEnergy(entity, world.fixedTimeStep)
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
        // Projectiles only update position, no physics interactions
        entity.position.x += entity.velocity.x * world.fixedTimeStep
        entity.position.y += entity.velocity.y * world.fixedTimeStep
        // Check boundaries for projectiles (remove when hitting walls)
        if (entity.position.x - entity.radius <= 0 || 
            entity.position.x + entity.radius >= world.bounds.width ||
            entity.position.y - entity.radius <= 0 || 
            entity.position.y + entity.radius >= world.bounds.height) {
          entity.health = 0 // Mark for removal
        }
      } else {
        // Normal physics for non-projectiles
        integrate(entity, world.fixedTimeStep)
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
  if (!entity.isStatic) {
    entity.acceleration = Vector.add(entity.acceleration, Vector.multiply(force, 1 / entity.mass))
  }
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
    id: `projectile_${currentTime}_${Math.random()}`,
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
    id: `aura_${currentTime}_${Math.random()}`,
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
  
  if (timeSinceAttack > attackCooldown && distanceToEnemy < 200) {
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
