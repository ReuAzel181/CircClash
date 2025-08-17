// Game management layer - handles game state, entity spawning, and game loop control

import { 
  PhysicsWorld, 
  CircleEntity, 
  Projectile,
  createPhysicsWorld, 
  createCircleEntity, 
  createProjectile,
  simulateStep,
  Vector,
  addForce,
  updateWorldBounds
} from './physics'
import { getCharacterType, getCharacterConfig, CHARACTER_CONFIGS } from './characterConfig'

export interface GameConfig {
  arenaWidth: number
  arenaHeight: number
  mode: 'roulette' | 'battleroyale' | 'story' | 'custom'
  maxPlayers: number
  enablePowerups: boolean
  enableHazards: boolean
  matchDuration?: number // in milliseconds
}

export interface GameState {
  world: PhysicsWorld
  isRunning: boolean
  isPaused: boolean
  startTime: number
  config: GameConfig
  players: Map<string, CircleEntity>
  score: Map<string, number>
  winner?: string
  roundNumber: number
}

let currentGame: GameState | null = null
let gameLoop: number | null = null
let lastFrameTime = 0

// Game lifecycle management
export function startGame(config: GameConfig): GameState {
  // Stop any existing game
  if (currentGame) {
    stopGame()
  }

  // Create new game state
  const world = createPhysicsWorld(config.arenaWidth, config.arenaHeight)
  
  currentGame = {
    world,
    isRunning: false,
    isPaused: false,
    startTime: Date.now(),
    config,
    players: new Map(),
    score: new Map(),
    roundNumber: 1
  }

  return currentGame
}

export function resumeGame(): void {
  if (!currentGame || currentGame.isRunning) return
  
  currentGame.isRunning = true
  currentGame.isPaused = false
  lastFrameTime = performance.now()
  
  // Start game loop
  gameLoop = requestAnimationFrame(updateGame)
}

export function pauseGame(): void {
  if (!currentGame) return
  
  currentGame.isPaused = true
  currentGame.isRunning = false
  
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
    gameLoop = null
  }
}

export function stopGame(): void {
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
    gameLoop = null
  }
  
  if (currentGame) {
    // Clean up all entity timeouts before stopping
    for (const [id, entity] of currentGame.world.entities) {
      if ((entity as any).activeTimeouts) {
        (entity as any).activeTimeouts.forEach((timeout: NodeJS.Timeout) => clearTimeout(timeout))
      }
    }
    
    // Clear all game state
    currentGame.world.entities.clear()
    currentGame.players.clear()
    currentGame.score.clear()
    
    currentGame.isRunning = false
    currentGame.isPaused = false
  }
  
  currentGame = null
}

// Main game loop with fixed timestep
function updateGame(currentTime: number): void {
  if (!currentGame || !currentGame.isRunning) return
  
  const deltaTime = Math.min((currentTime - lastFrameTime) / 1000, 1/30) // Cap at 30fps minimum
  lastFrameTime = currentTime
  
  // Update AI for all bots
  for (const [id, entity] of currentGame.world.entities) {
    if ((entity as any).isBot && entity.health > 0) {
      updateBotAI(id)
      // Pure physics movement - no velocity modification
    }
  }
  
  // Run physics simulation
  simulateStep(currentGame.world, deltaTime)
  
  // Check win conditions
  checkWinConditions(currentGame)
  
  // Remove powerup spawning - no powerups in arena
  // if (currentGame.config.enablePowerups) {
  //   spawnPowerups(currentGame)
  // }
  
  // Continue game loop
  if (currentGame.isRunning) {
    gameLoop = requestAnimationFrame(updateGame)
  }
}

// Entity management
export function spawnPlayer(
  playerId: string, 
  x: number, 
  y: number, 
  characterData?: any
): CircleEntity | null {
  if (!currentGame) return null
  
  const player = createCircleEntity(playerId, x, y, 20, 'player')
  
  // Apply character-specific stats if provided
  if (characterData) {
    player.health = characterData.stats?.defense * 1.5 || 100
    player.maxHealth = player.health
    player.damage = characterData.stats?.damage * 0.5 || 20
    // Speed affects max velocity, not current velocity
    player.mass = Math.max(1, 50 - (characterData.stats?.speed || 50) * 0.3)
  }
  
  currentGame.world.entities.set(playerId, player)
  currentGame.players.set(playerId, player)
  currentGame.score.set(playerId, 0)
  
  return player
}

export function spawnBot(
  botId: string,
  x: number,
  y: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): CircleEntity | null {
  if (!currentGame) return null
  
  const bot = createCircleEntity(botId, x, y, 7.35, 'player') // Reduced radius by 30% more (from 10.5 to 7.35 = 51% smaller than original)
  
  // Verify character type exists in configuration
  const characterType = getCharacterType(botId)
  const config = getCharacterConfig(characterType)
  if (!config) {
    console.warn(`Unknown character type: ${characterType}, using default config`)
  }
  
  // Apply difficulty-based stats - faster and more aggressive
  switch (difficulty) {
    case 'easy':
      bot.health = 80
      bot.damage = 15
      bot.mass = 30 // Reduced mass for faster movement
      break
    case 'hard':
      bot.health = 120
      bot.damage = 30
      bot.mass = 20 // Very low mass for very fast movement
      break
    default: // medium
      bot.health = 100
      bot.damage = 20
      bot.mass = 25 // Reduced mass for faster movement
  }
  
  // Apply tank-specific modifications for Steel Guardian
  if (config?.tankHealth) {
    bot.health = config.tankHealth
    bot.mass = 35 // Heavier for tank role
  }
  
  // Add tank-specific properties
  if (config?.damageReduction) {
    ;(bot as any).damageReduction = config.damageReduction
  }
  if (config?.knockbackResistance) {
    ;(bot as any).knockbackResistance = config.knockbackResistance
  }
  if (config?.selfHeal) {
    ;(bot as any).selfHeal = config.selfHeal
    ;(bot as any).lastHealTime = Date.now()
  }
  
  bot.maxHealth = bot.health
  
  // Give initial random velocity for immediate bouncing movement
  const initialSpeed = 200 + Math.random() * 300 // Random speed between 200-500
  const initialAngle = Math.random() * 2 * Math.PI // Random direction
  bot.velocity = Vector.create(
    Math.cos(initialAngle) * initialSpeed,
    Math.sin(initialAngle) * initialSpeed
  )
  
  // Add simple AI behavior with safety checks
  ;(bot as any).isBot = true
  ;(bot as any).characterType = characterType // Store character type for stack tracking
  ;(bot as any).aiTarget = null
  ;(bot as any).aiCooldown = 0
  ;(bot as any).attackRange = config?.attackRange || 300 // Fallback for safety
  ;(bot as any).activeTimeouts = [] // Initialize timeout tracking
  
  currentGame.world.entities.set(botId, bot)
  currentGame.players.set(botId, bot)
  currentGame.score.set(botId, 0)
  
  return bot
}

export function fireProjectile(
  shooterId: string,
  direction: Vector,
  weaponData?: any
): Projectile | null {
  if (!currentGame) return null
  
  const shooter = currentGame.world.entities.get(shooterId)
  if (!shooter) return null
  
  // Extract character type from shooterId and get config
  const characterType = getCharacterType(shooterId)
  const config = getCharacterConfig(characterType)
  
  // Handle multi-shot abilities
  const shotCount = config.multiShot || 1
  const spreadAngle = config.spreadAngle || 0
  
  const projectiles: Projectile[] = []
  
  for (let i = 0; i < shotCount; i++) {
    let shotDirection = direction
    
    // Calculate spread for multi-shot
    if (shotCount > 1 && spreadAngle > 0) {
      const angleOffset = (i - (shotCount - 1) / 2) * (spreadAngle * Math.PI / 180)
      const cos = Math.cos(angleOffset)
      const sin = Math.sin(angleOffset)
      shotDirection = Vector.create(
        direction.x * cos - direction.y * sin,
        direction.x * sin + direction.y * cos
      )
    }
    
    // Calculate spawn position (slightly in front of shooter)
    const spawnOffset = Vector.multiply(Vector.normalize(shotDirection), shooter.radius + 10)
    const spawnPos = Vector.add(shooter.position, spawnOffset)
    
    const speed = config.projectileSpeed || 400
    const lifetime = weaponData?.lifetime || 3000
    
    const projectile = createProjectile(
      `projectile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      spawnPos.x,
      spawnPos.y,
      shotDirection,
      speed,
      shooterId,
      lifetime,
      characterType
    )
    
    // Apply character-specific properties from config
    projectile.damage = config.damage || 10
    projectile.radius = config.bulletRadius || 5
    
    // Override with weaponData if provided
    if (weaponData) {
      if (weaponData.baseDamage !== undefined) projectile.damage = weaponData.baseDamage
      if (weaponData.radius !== undefined) projectile.radius = weaponData.radius
      if (weaponData.projectileSpeed !== undefined) {
        const newSpeed = weaponData.projectileSpeed
        projectile.velocity = Vector.multiply(Vector.normalize(shotDirection), newSpeed)
      }
      if (weaponData.isShockwave !== undefined) {
        ;(projectile as any).isShockwave = weaponData.isShockwave
      }
      if (weaponData.isEarthquake !== undefined) {
        ;(projectile as any).isEarthquake = weaponData.isEarthquake
      }
      if (weaponData.explosiveRadius !== undefined) {
        ;(projectile as any).explosiveRadius = weaponData.explosiveRadius
      }
      if (weaponData.isFissure !== undefined) {
        ;(projectile as any).isFissure = weaponData.isFissure
      }
      if (weaponData.fissureLength !== undefined) {
        ;(projectile as any).fissureLength = weaponData.fissureLength
      }
      if (weaponData.fissureWidth !== undefined) {
        ;(projectile as any).fissureWidth = weaponData.fissureWidth
      }
      if (weaponData.fissureNumber !== undefined) {
        ;(projectile as any).fissureNumber = weaponData.fissureNumber
      }
      if (weaponData.isIronHand !== undefined) {
        ;(projectile as any).isIronHand = weaponData.isIronHand
      }
      if (weaponData.maxExtension !== undefined) {
        ;(projectile as any).maxExtension = weaponData.maxExtension
      }
      if (weaponData.retractionSpeed !== undefined) {
        ;(projectile as any).retractionSpeed = weaponData.retractionSpeed
      }
      if (weaponData.knockbackForce !== undefined) {
        ;(projectile as any).knockbackForce = weaponData.knockbackForce
      }
      if (weaponData.isVortex !== undefined) {
        ;(projectile as any).isVortex = weaponData.isVortex
      }
      if (weaponData.vortexStopDistance !== undefined) {
        ;(projectile as any).vortexStopDistance = weaponData.vortexStopDistance
      }
      if (weaponData.vortexRadius !== undefined) {
        ;(projectile as any).vortexRadius = weaponData.vortexRadius
      }
      if (weaponData.vortexPullStrength !== undefined) {
        ;(projectile as any).vortexPullStrength = weaponData.vortexPullStrength
      }
      if (weaponData.vortexDuration !== undefined) {
        ;(projectile as any).vortexDuration = weaponData.vortexDuration
      }
      if (weaponData.vortexTouchedDuration !== undefined) {
        ;(projectile as any).vortexTouchedDuration = weaponData.vortexTouchedDuration
      }
      if (weaponData.vortexDamageRate !== undefined) {
        ;(projectile as any).vortexDamageRate = weaponData.vortexDamageRate
      }
    }
    
    // Apply special abilities based on character type
    switch (config.bulletStyle) {
      case 'boomerang':
        ;(projectile as any).isBoomerang = true
        ;(projectile as any).originalShooter = shooterId
        ;(projectile as any).returnPhase = false
        ;(projectile as any).maxDistance = config.attackRange || 300
        ;(projectile as any).traveledDistance = 0
        ;(projectile as any).originalPosition = { ...spawnPos } // Store original position
        break
        
      case 'chain':
        ;(projectile as any).chainLightning = true
        ;(projectile as any).chainCount = 3
        ;(projectile as any).chainRange = 100
        ;(projectile as any).alreadyChained = new Set()
        break
        
      case 'web':
        ;(projectile as any).slowEffect = true
        ;(projectile as any).homingStrength = config.homingStrength || 0.3
        ;(projectile as any).tetherEffect = true
        break
        
      case 'barrier':
        ;(projectile as any).createsBarrier = true
        ;(projectile as any).barrierDuration = 5000
        break
        
      case 'clone':
        ;(projectile as any).createsCopies = true
        ;(projectile as any).copyCount = 2
        break
        
      case 'shockwave':
        ;(projectile as any).isShockwave = true
        ;(projectile as any).explosiveRadius = config.explosiveRadius || 80
        ;(projectile as any).shockwaveRadius = config.explosiveRadius || 80
        ;(projectile as any).knockback = true
        // Override velocity for static shockwave
        projectile.velocity = Vector.create(0, 0)
        break
        
      case 'earthquake':
        ;(projectile as any).isEarthquake = true
        ;(projectile as any).explosiveRadius = config.explosiveRadius || 120
        ;(projectile as any).knockback = true
        ;(projectile as any).groundSlam = true
        // Override velocity for static earthquake
        projectile.velocity = Vector.create(0, 0)
        break
        
      case 'fissure':
        ;(projectile as any).isFissure = true
        ;(projectile as any).fissureLength = config.fissureLength || 350
        ;(projectile as any).fissureWidth = config.fissureWidth || 25
        ;(projectile as any).groundCrack = true
        break
        
      case 'ironhand':
        ;(projectile as any).isIronHand = true
        ;(projectile as any).maxExtension = config.maxExtension || 280
        ;(projectile as any).retractionSpeed = config.handRetractionSpeed || 400
        ;(projectile as any).knockbackForce = config.knockbackForce || 150
        ;(projectile as any).isExtending = true
        ;(projectile as any).hasReachedTarget = false
        break
        
      case 'energywave':
        ;(projectile as any).isEnergyWave = true
        ;(projectile as any).waveGrowthRate = config.waveGrowthRate || 1.5
        ;(projectile as any).damageOverTime = config.damageOverTime || 15
        ;(projectile as any).dotDuration = config.dotDuration || 3000
        ;(projectile as any).slowEffectStrength = config.slowEffectStrength || 0.4
        ;(projectile as any).slowDuration = config.slowDuration || 4000
        ;(projectile as any).originalRadius = projectile.radius
        ;(projectile as any).distanceTraveled = 0
        ;(projectile as any).affectedTargets = new Set() // Track who's been hit for DOT
        ;(projectile as any).dotApplications = new Map() // Track DOT timing per target
        break
        
      case 'rift':
        ;(projectile as any).voidRift = true
        ;(projectile as any).teleportDistance = 150
        ;(projectile as any).hasRifted = false
        ;(projectile as any).originalPosition = { ...spawnPos } // Store original position
        break
        
      case 'mine':
        ;(projectile as any).proximityMine = true
        ;(projectile as any).activationRadius = 50
        ;(projectile as any).isStationary = true
        projectile.velocity = Vector.create(0, 0) // Mines don't move
        break
        
      case 'tunnel':
        ;(projectile as any).windTunnel = true
        ;(projectile as any).redirectStrength = 0.2
        break
        
      case 'flame':
        ;(projectile as any).explosive = true
        ;(projectile as any).explosiveRadius = config.explosiveRadius || 30
        ;(projectile as any).fireTrail = true
        break
        
      case 'vortex':
        ;(projectile as any).isVortex = true
        ;(projectile as any).vortexStopDistance = config.vortexStopDistance || 250
        ;(projectile as any).vortexRadius = config.vortexRadius || 60
        ;(projectile as any).vortexPullStrength = config.vortexPullStrength || 1.2
        ;(projectile as any).vortexDuration = config.vortexDuration || 3000
        ;(projectile as any).vortexTouchedDuration = config.vortexTouchedDuration || 3000
        ;(projectile as any).vortexDamageRate = config.vortexDamageRate || 12
        ;(projectile as any).distanceTraveled = 0
        ;(projectile as any).hasFormedVortex = false
        ;(projectile as any).vortexFormTime = 0
        ;(projectile as any).vortexTouched = false
        ;(projectile as any).affectedTargets = new Set() // Track who's taking damage
        ;(projectile as any).lastDamageTime = new Map() // Track damage timing per target
        break
    }
    
    // Apply common special effects
    if (config.slowEffect) {
      ;(projectile as any).slowEffect = true
    }
    
    if (config.explosiveRadius) {
      ;(projectile as any).explosive = true
      ;(projectile as any).explosiveRadius = config.explosiveRadius
    }
    
    if (config.homingStrength) {
      ;(projectile as any).homing = true
      ;(projectile as any).homingStrength = config.homingStrength
      ;(projectile as any).homingTarget = null
    }
    
    // Store spawn time for lifetime calculation
    ;(projectile as any).spawnTime = Date.now()
    
    currentGame.world.entities.set(projectile.id, projectile)
    projectiles.push(projectile)
  }
  
  return projectiles[0] // Return first projectile for compatibility
}

export function movePlayer(playerId: string, direction: Vector, force: number = 800): void {
  if (!currentGame) return
  
  const player = currentGame.world.entities.get(playerId)
  if (!player || player.isStatic) return
  
  const moveForce = Vector.multiply(Vector.normalize(direction), force)
  addForce(player, moveForce)
}

export function teleportPlayer(playerId: string, x: number, y: number): void {
  if (!currentGame) return
  
  const player = currentGame.world.entities.get(playerId)
  if (!player) return
  
  player.position = Vector.create(x, y)
  player.velocity = Vector.create() // Stop movement
}

// Arena management
export function setArenaSize(width: number, height: number): void {
  if (!currentGame) return
  
  // Update world bounds and keep entities in bounds
  updateWorldBounds(currentGame.world, width, height)
  currentGame.config.arenaWidth = width
  currentGame.config.arenaHeight = height
}

export function addHazard(x: number, y: number, radius: number, damage: number): CircleEntity {
  if (!currentGame) throw new Error('No active game')
  
  const hazard = createCircleEntity(
    `hazard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    x,
    y,
    radius,
    'hazard'
  )
  
  hazard.isStatic = true
  hazard.damage = damage
  hazard.health = Infinity
  
  currentGame.world.entities.set(hazard.id, hazard)
  
  return hazard
}

// Power-up system
let lastPowerupSpawn = 0
const powerupSpawnInterval = 10000 // 10 seconds

function spawnPowerups(game: GameState): void {
  const now = Date.now()
  if (now - lastPowerupSpawn < powerupSpawnInterval) return
  
  // Don't spawn too many powerups
  const existingPowerups = Array.from(game.world.entities.values())
    .filter(e => e.type === 'pickup')
  
  if (existingPowerups.length >= 3) return
  
  // Random spawn location
  const x = Math.random() * (game.config.arenaWidth - 100) + 50
  const y = Math.random() * (game.config.arenaHeight - 100) + 50
  
  const powerupTypes = ['health', 'speed', 'damage', 'shield']
  const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)]
  
  const powerup = createCircleEntity(
    `powerup_${type}_${Date.now()}`,
    x,
    y,
    12,
    'pickup'
  )
  
  powerup.isStatic = true
  ;(powerup as any).powerupType = type
  ;(powerup as any).spawnTime = now
  powerup.lifetime = 20000 // 20 seconds
  
  game.world.entities.set(powerup.id, powerup)
  lastPowerupSpawn = now
}

// Win condition checking
function checkWinConditions(game: GameState): void {
  const alivePlayers = Array.from(game.players.values()).filter(p => p.health > 0)
  
  if (alivePlayers.length <= 1 && game.players.size > 1) {
    // Game over
    game.isRunning = false
    
    if (alivePlayers.length === 1) {
      game.winner = alivePlayers[0].id
    }
    
    // Dispatch game over event
    window.dispatchEvent(new CustomEvent('gameOver', { 
      detail: { 
        winner: game.winner,
        scores: Object.fromEntries(game.score),
        duration: Date.now() - game.startTime
      }
    }))
  }
}

// Simple AI for bots
export function updateBotAI(botId: string): void {
  if (!currentGame) return
  
  const bot = currentGame.world.entities.get(botId)
  if (!bot || !(bot as any).isBot || bot.health <= 0) return
  
  const now = Date.now()
  if ((bot as any).aiCooldown > now) return
  
  // Get character configuration
  const characterType = getCharacterType(botId)
  const config = getCharacterConfig(characterType)
  
  // Ensure attack range is properly set (fallback to config if not set)
  const attackRange = (bot as any).attackRange || config.attackRange || 300
  
  // DO NOT modify velocity - let physics handle movement
  // Characters should only change direction when bouncing off walls/entities
  
  // Find nearest enemy for targeting (shooting only)
  let nearestEnemy: CircleEntity | null = null
  let nearestDistance = Infinity
  
  for (const [id, entity] of currentGame.world.entities) {
    if (id === botId || entity.type !== 'player' || entity.health <= 0) continue
    
    const distance = Vector.distance(bot.position, entity.position)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestEnemy = entity
    }
  }
  
  if (nearestEnemy && nearestDistance < attackRange) {
    // Advanced prediction targeting
    const projectileSpeed = config.projectileSpeed || 400
    const timeToTarget = nearestDistance / projectileSpeed
    
    // Predict where the enemy will be based on their current velocity
    const predictedPosition = Vector.add(
      nearestEnemy.position,
      Vector.multiply(nearestEnemy.velocity, timeToTarget)
    )
    
    // Calculate direction to predicted position
    let directionToTarget = Vector.subtract(predictedPosition, bot.position)
    
    // Add slight accuracy variation (reduced for better accuracy)
    const baseAccuracy = 0.1 // Base accuracy variation
    const speedFactor = Math.min(projectileSpeed / 600, 2.0) // Better accuracy for faster projectiles
    const accuracyVariation = baseAccuracy / speedFactor // Faster = more accurate
    const randomAngle = (Math.random() - 0.5) * accuracyVariation
    const cos = Math.cos(randomAngle)
    const sin = Math.sin(randomAngle)
    
    directionToTarget = Vector.create(
      directionToTarget.x * cos - directionToTarget.y * sin,
      directionToTarget.x * sin + directionToTarget.y * cos
    )
    
    const normalizedDirection = Vector.normalize(directionToTarget)
    
    // Fire with prediction
    fireCharacterSpecificAttack(botId, normalizedDirection, characterType)
    ;(bot as any).aiCooldown = now + (config.firingRate || 1000) // Ensure firing rate exists
  } else {
    // Occasionally shoot randomly when no enemies nearby
    if (Math.random() < 0.005) { // Reduced from 0.01 to prevent spam
      const randomDirection = Vector.create(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      )
      
      fireCharacterSpecificAttack(botId, Vector.normalize(randomDirection), characterType)
      ;(bot as any).aiCooldown = now + (config.firingRate || 1000) * 3 // Longer cooldown for random shots
    }
  }
}
      
      // Aim at predicted position with some accuracy variation
// Character-specific attack function with unique mechanics
function fireCharacterSpecificAttack(botId: string, direction: Vector, characterType: string): void {
  const config = getCharacterConfig(characterType)
  const bot = currentGame?.world.entities.get(botId)
  if (!bot || !currentGame) return

  const normalizedDir = Vector.normalize(direction)
  
  // Store timeout IDs for cleanup
  const timeouts: NodeJS.Timeout[] = []
  ;(bot as any).activeTimeouts = (bot as any).activeTimeouts || []
  
  // Clear any existing timeouts for this bot
  ;(bot as any).activeTimeouts.forEach((timeout: NodeJS.Timeout) => clearTimeout(timeout))
  ;(bot as any).activeTimeouts = []
  
  switch (characterType) {
    case 'vortex': // Plasma Vortex - Energy bullet that becomes a pulling vortex with stack system
      // Initialize stack system if not present
      if (!(bot as any).vortexStacks) {
        ;(bot as any).vortexStacks = 0
      }
      
        // Check if we should trigger rapid fire
        const stacks = (bot as any).vortexStacks
        const stacksToTrigger = config.stacksToTrigger || 5
        
        if (stacks >= stacksToTrigger) {
        // Reset stacks and trigger rapid fire
        ;(bot as any).vortexStacks = 0
        
        // Fire rapid consecutive shots
        const rapidFireCount = config.rapidFireCount || 3
        const rapidFireDelay = config.rapidFireDelay || 150
        
        for (let i = 0; i < rapidFireCount; i++) {
          const timeout = setTimeout(() => {
            if (!currentGame?.world.entities.has(botId)) return
            
            fireProjectile(botId, normalizedDir, { 
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
            })
          }, i * rapidFireDelay)
          ;(bot as any).activeTimeouts.push(timeout)
        }
      } else {
        // Normal single shot
        fireProjectile(botId, normalizedDir, { 
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
        })
      }
      break
      
    case 'flame': // Fire Warrior - 5 shot burst
      for (let i = 0; i < 3; i++) {
        const timeout = setTimeout(() => {
          // Check if bot still exists before firing
          if (!currentGame?.world.entities.has(botId)) return
          
          const angle = (i - 2) * 0.2 // Fan pattern
          const spreadDir = {
            x: normalizedDir.x * Math.cos(angle) - normalizedDir.y * Math.sin(angle),
            y: normalizedDir.x * Math.sin(angle) + normalizedDir.y * Math.cos(angle)
          }
          fireProjectile(botId, spreadDir, { 
            baseDamage: config.damage * 0.6, 
            projectileSpeed: config.projectileSpeed * 0.8,
            radius: config.bulletRadius * 0.8
          })
        }, i * 50) // Rapid burst with delay
        ;(bot as any).activeTimeouts.push(timeout)
      }
      break
      
    case 'archer': // Wind Archer - Rapid arrow barrage
      for (let i = 0; i < 4; i++) {
        const timeout = setTimeout(() => {
          if (!currentGame?.world.entities.has(botId)) return
          
          fireProjectile(botId, normalizedDir, { 
            baseDamage: config.damage * 0.7, 
            projectileSpeed: config.projectileSpeed,
            radius: config.bulletRadius,
            piercing: 1 // Arrows pierce through
          })
        }, i * 100) // Quick succession
        ;(bot as any).activeTimeouts.push(timeout)
      }
      break
      
    case 'samurai': // Blade Master - Wide arc slash
      const slashWidth = Math.PI / 3 // 60 degree arc
      for (let i = 0; i < 7; i++) {
        const angle = (i - 3) * (slashWidth / 6) 
        const arcDir = {
          x: normalizedDir.x * Math.cos(angle) - normalizedDir.y * Math.sin(angle),
          y: normalizedDir.x * Math.sin(angle) + normalizedDir.y * Math.cos(angle)
        }
        fireProjectile(botId, arcDir, { 
          baseDamage: config.damage * 1.2, 
          projectileSpeed: config.projectileSpeed * 0.6,
          radius: config.bulletRadius * 1.5,
          lifetime: 800 // Short range slashes
        })
      }
      break
      
    case 'sniper': // Void Sniper - Single powerful piercing shot
      fireProjectile(botId, normalizedDir, { 
        baseDamage: config.damage * 1.8, 
        projectileSpeed: config.projectileSpeed,
        radius: config.bulletRadius,
        piercing: 3, // Pierces through multiple enemies
        lifetime: 5000 // Long range
      })
      break
      
    case 'bomber': // Chaos Bomber - Explosive cluster
      // Main bomb
      fireProjectile(botId, normalizedDir, { 
        baseDamage: config.damage * 1.5, 
        projectileSpeed: config.projectileSpeed * 0.7,
        radius: config.bulletRadius * 2,
        explosive: true // Will explode on impact
      })
      
      // Secondary cluster bombs with slight spread
      for (let i = 0; i < 3; i++) {
        const timeout = setTimeout(() => {
          if (!currentGame?.world.entities.has(botId)) return
          
          const angle = (i - 1) * 0.4
          const clusterDir = {
            x: normalizedDir.x * Math.cos(angle) - normalizedDir.y * Math.sin(angle),
            y: normalizedDir.x * Math.sin(angle) + normalizedDir.y * Math.cos(angle)
          }
          fireProjectile(botId, clusterDir, { 
            baseDamage: config.damage * 0.8, 
            projectileSpeed: config.projectileSpeed * 0.5,
            radius: config.bulletRadius * 1.5,
            explosive: true
          })
        }, 200 + i * 100)
        ;(bot as any).activeTimeouts.push(timeout)
      }
      break
      
    case 'guardian': // Steel Guardian - Energy Wave Surge
      // Check health for desperation mode
      const healthPercent = bot.health / bot.maxHealth
      const isDesperate = healthPercent < 0.5
      
      // Enhanced prediction for Steel Guardian accounting for charge time
      let chargeTime = config.chargeTime || 1000
      let waveSpeed = config.projectileSpeed || 250
      
      // Desperation mode: half charge time, double speed
      if (isDesperate) {
        chargeTime = chargeTime / 2 // Half charge time (500ms)
        waveSpeed = waveSpeed * 2  // Double speed (500)
      }
      
      const baseSpeed = config.projectileSpeed || 250
      
      // Find the best target for the energy wave
      let bestTarget: CircleEntity | null = null
      let bestScore = -1
      
      for (const [id, entity] of currentGame.world.entities) {
        if (id === botId || entity.type !== 'player' || entity.health <= 0) continue
        
        const distance = Vector.distance(bot.position, entity.position)
        if (distance > (config.attackRange || 300)) continue
        
        // Predict where target will be after charge time + travel time
        const totalTime = (chargeTime / 1000) + (distance / waveSpeed)
        const predictedPos = Vector.add(entity.position, Vector.multiply(entity.velocity, totalTime))
        const predictedDistance = Vector.distance(bot.position, predictedPos)
        
        // Score based on predicted distance and current health (prioritize weak enemies)
        const healthFactor = (entity.maxHealth - entity.health) / entity.maxHealth
        const distanceFactor = Math.max(0, 1 - predictedDistance / (config.attackRange || 300))
        const score = distanceFactor * 0.7 + healthFactor * 0.3
        
        if (score > bestScore) {
          bestScore = score
          bestTarget = entity
        }
      }
      
      // Calculate final direction to best predicted target
      let finalDirection = normalizedDir
      if (bestTarget) {
        const distance = Vector.distance(bot.position, bestTarget.position)
        const totalTime = (chargeTime / 1000) + (distance / waveSpeed)
        const predictedPos = Vector.add(bestTarget.position, Vector.multiply(bestTarget.velocity, totalTime))
        finalDirection = Vector.normalize(Vector.subtract(predictedPos, bot.position))
      }
      
      // Implement charge-up mechanism
      ;(bot as any).isCharging = true
      ;(bot as any).chargeStartTime = Date.now()
      ;(bot as any).isDesperate = isDesperate // Store desperation state for visuals
      
      // Make guardian stationary during charge
      const originalVelocity = { ...bot.velocity }
      bot.velocity = Vector.create(0, 0)
      
      // After charge time, release the energy wave
      const chargeTimeout = setTimeout(() => {
        if (currentGame?.world.entities.has(botId)) {
          // Release the energy wave with predicted direction and desperation bonuses
          fireProjectile(botId, finalDirection, { 
            baseDamage: config.damage, 
            projectileSpeed: waveSpeed, // Use calculated speed (normal or doubled)
            radius: config.bulletRadius || 20, // Updated to use larger radius
            lifetime: 6000, // Increased wave lifetime for longer travel (was 4000)
            isEnergyWave: true,
            waveGrowthRate: config.waveGrowthRate || 1.8, // Updated growth rate
            damageOverTime: config.damageOverTime || 15,
            dotDuration: config.dotDuration || 3000,
            slowEffectStrength: config.slowEffectStrength || 0.4,
            slowDuration: config.slowDuration || 4000,
            isDesperate: isDesperate // Flag for visual effects
          })
          
          // Restore movement after charge
          ;(bot as any).isCharging = false
          bot.velocity = originalVelocity
        }
      }, chargeTime) // Use calculated charge time (normal or halved)
      ;(bot as any).activeTimeouts.push(chargeTimeout)
      break
      
    case 'titan': // Iron Titan - Iron hand strike
      // Create extending iron hand that punches forward then retracts
      fireProjectile(botId, normalizedDir, { 
        baseDamage: config.damage,
        projectileSpeed: config.handExtensionSpeed || 600,
        radius: config.bulletRadius,
        lifetime: 2000, // Hand duration
        isIronHand: true,
        maxExtension: config.maxExtension || 280,
        retractionSpeed: config.handRetractionSpeed || 400,
        knockbackForce: config.knockbackForce || 150
      })
      break
      
    case 'shadow': // Shadow Assassin - Rapid multi-directional attack
      const shadowDirs = [
        normalizedDir,
        { x: normalizedDir.x * 0.8 + normalizedDir.y * 0.6, y: normalizedDir.y * 0.8 - normalizedDir.x * 0.6 },
        { x: normalizedDir.x * 0.8 - normalizedDir.y * 0.6, y: normalizedDir.y * 0.8 + normalizedDir.x * 0.6 }
      ]
      
      shadowDirs.forEach((dir, index) => {
        const timeout = setTimeout(() => {
          if (!currentGame?.world.entities.has(botId)) return
          
          fireProjectile(botId, Vector.normalize(dir), { 
            baseDamage: config.damage * 0.8, 
            projectileSpeed: config.projectileSpeed,
            radius: config.bulletRadius * 0.8
          })
        }, index * 50)
        ;(bot as any).activeTimeouts.push(timeout)
      })
      break
      
    case 'frost': // Ice Knight - Slow ice blast with area effect
      fireProjectile(botId, normalizedDir, { 
        baseDamage: config.damage * 1.3, 
        projectileSpeed: config.projectileSpeed,
        radius: config.bulletRadius * 1.6,
        freezing: true // Special ice effect
      })
      break
      
    case 'mystic': // Mystic Orb - Homing magical missiles
      for (let i = 0; i < 2; i++) {
        const timeout = setTimeout(() => {
          if (!currentGame?.world.entities.has(botId)) return
          
          fireProjectile(botId, normalizedDir, { 
            baseDamage: config.damage * 0.9, 
            projectileSpeed: config.projectileSpeed * 0.9,
            radius: config.bulletRadius,
            homing: true // Will track nearest enemy
          })
        }, i * 150)
        ;(bot as any).activeTimeouts.push(timeout)
      }
      break
      
    case 'striker': // Lightning Striker - Electric chain attack
      fireProjectile(botId, normalizedDir, { 
        baseDamage: config.damage, 
        projectileSpeed: config.projectileSpeed,
        radius: config.bulletRadius,
        electric: true, // Can chain to nearby enemies
        piercing: 1
      })
      break
      
    default: // Default fallback
      fireProjectile(botId, normalizedDir, { 
        baseDamage: config.damage, 
        projectileSpeed: config.projectileSpeed, 
        radius: config.bulletRadius 
      })
      break
  }
}

// Game state accessors
export function getCurrentGame(): GameState | null {
  return currentGame
}

export function getGameEntities(): CircleEntity[] {
  if (!currentGame) return []
  return Array.from(currentGame.world.entities.values())
}

export function getPlayerEntity(playerId: string): CircleEntity | null {
  if (!currentGame) return null
  return currentGame.world.entities.get(playerId) || null
}

export function isGameRunning(): boolean {
  return currentGame?.isRunning || false
}

export function getGameScore(playerId: string): number {
  if (!currentGame) return 0
  return currentGame.score.get(playerId) || 0
}

export function addScore(playerId: string, points: number): void {
  if (!currentGame) return
  const currentScore = currentGame.score.get(playerId) || 0
  currentGame.score.set(playerId, currentScore + points)
}
