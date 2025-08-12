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
  addForce
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
  
  const bot = createCircleEntity(botId, x, y, 20, 'player')
  
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
  
  bot.maxHealth = bot.health
  
  // Give initial random velocity for immediate bouncing movement
  const initialSpeed = 200 + Math.random() * 300 // Random speed between 200-500
  const initialAngle = Math.random() * 2 * Math.PI // Random direction
  bot.velocity = Vector.create(
    Math.cos(initialAngle) * initialSpeed,
    Math.sin(initialAngle) * initialSpeed
  )
  
  // Add simple AI behavior
  ;(bot as any).isBot = true
  ;(bot as any).aiTarget = null
  ;(bot as any).aiCooldown = 0
  
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
  
  // Calculate spawn position (slightly in front of shooter)
  const spawnOffset = Vector.multiply(Vector.normalize(direction), shooter.radius + 10)
  const spawnPos = Vector.add(shooter.position, spawnOffset)
  
  const speed = weaponData?.projectileSpeed || 400
  const lifetime = weaponData?.lifetime || 3000
  
  const projectile = createProjectile(
    `projectile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    spawnPos.x,
    spawnPos.y,
    direction,
    speed,
    shooterId,
    lifetime,
    characterType
  )
  
  // Apply weapon-specific properties
  if (weaponData) {
    projectile.damage = weaponData.baseDamage || 10 // Reduced default from 25 to 10
    projectile.radius = weaponData.radius || 5
    projectile.piercing = weaponData.piercing || 0
    projectile.hitsRemaining = projectile.piercing + 1
  }
  
  // Store spawn time for lifetime calculation
  ;(projectile as any).spawnTime = Date.now()
  
  currentGame.world.entities.set(projectile.id, projectile)
  
  return projectile
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
  
  currentGame.world.bounds = { width, height }
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
  
  if (nearestEnemy && nearestDistance < config.attackRange) {
    // Simple straight-line targeting - no prediction
    const directionToTarget = Vector.subtract(nearestEnemy.position, bot.position)
    const normalizedDirection = Vector.normalize(directionToTarget)
    
    // Fire straight at current target position
    fireCharacterSpecificAttack(botId, normalizedDirection, characterType)
    ;(bot as any).aiCooldown = now + config.firingRate
  } else {
    // Occasionally shoot randomly when no enemies nearby
    if (Math.random() < 0.01) { // 1% chance for random shots
      const randomDirection = Vector.create(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      )
      
      fireCharacterSpecificAttack(botId, Vector.normalize(randomDirection), characterType)
      ;(bot as any).aiCooldown = now + config.firingRate * 2 // Longer cooldown for random shots
    }
  }
}
      
      // Aim at predicted position with some accuracy variation
// Character-specific attack function
function fireCharacterSpecificAttack(botId: string, direction: Vector, characterType: string): void {
  // Get character configuration
  const config = getCharacterConfig(characterType)
  
  // Fire single shot with character-specific properties
  fireProjectile(botId, direction, { 
    baseDamage: config.damage, 
    projectileSpeed: config.projectileSpeed, 
    radius: config.bulletRadius 
  })
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
