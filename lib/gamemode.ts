// Game mode controllers for different Circlash game types

import { Character } from '@/data/characters'
import { Weapon } from '@/data/weapons'
import { ArenaSettings } from '@/data/arena'
import { PhysicsWorld, CircleEntity } from '@/lib/physics'

export type GameMode = 'roulette' | 'battle-royale' | 'story' | 'custom'

export interface GameState {
  mode: GameMode
  isActive: boolean
  isPaused: boolean
  timeElapsed: number
  players: string[]
  bots: string[]
  winner?: string
  score: Record<string, number>
  currentRound: number
  maxRounds: number
}

export interface RouletteState extends GameState {
  mode: 'roulette'
  spinResult?: Character
  isSpinning: boolean
  matchWins: Record<string, number>
  bestOfThree: boolean
}

export interface BattleRoyaleState extends GameState {
  mode: 'battle-royale'
  playersAlive: string[]
  shrinkTimer: number
  arenaShrinkRate: number
  currentArenaSize: number
  powerUpSpawnTimer: number
}

export interface StoryState extends GameState {
  mode: 'story'
  currentLevel: number
  levelObjective: 'defeat_all' | 'survive_time' | 'collect_items'
  objectiveProgress: number
  objectiveTarget: number
  storyDialogue?: string[]
}

export interface CustomState extends GameState {
  mode: 'custom'
  customRules: {
    respawnEnabled: boolean
    weaponDropsEnabled: boolean
    powerUpsEnabled: boolean
    timeLimit?: number
    scoreLimit?: number
  }
}

export type AnyGameState = RouletteState | BattleRoyaleState | StoryState | CustomState

// Abstract base controller
export abstract class GameModeController {
  protected state: AnyGameState
  protected world: PhysicsWorld
  protected arena: ArenaSettings
  
  constructor(world: PhysicsWorld, arena: ArenaSettings) {
    this.world = world
    this.arena = arena
    this.state = this.createInitialState()
  }
  
  abstract createInitialState(): AnyGameState
  abstract update(deltaTime: number): void
  abstract handlePlayerAction(playerId: string, action: string, data?: any): void
  abstract checkWinCondition(): boolean
  abstract getGameUI(): any
  
  getState(): AnyGameState {
    return this.state
  }
  
  startGame(): void {
    this.state.isActive = true
    this.state.timeElapsed = 0
  }
  
  pauseGame(): void {
    this.state.isPaused = !this.state.isPaused
  }
  
  endGame(winner?: string): void {
    this.state.isActive = false
    this.state.winner = winner
  }
}

// Roulette Mode - Spin for character, Best of 3 matches
export class RouletteController extends GameModeController {
  createInitialState(): RouletteState {
    return {
      mode: 'roulette',
      isActive: false,
      isPaused: false,
      timeElapsed: 0,
      players: ['player1'],
      bots: ['bot1'],
      score: { player1: 0, bot1: 0 },
      currentRound: 0,
      maxRounds: 3,
      isSpinning: false,
      matchWins: { player1: 0, bot1: 0 },
      bestOfThree: true
    }
  }
  
  update(deltaTime: number): void {
    if (!this.state.isActive || this.state.isPaused) return
    
    this.state.timeElapsed += deltaTime
    
    // Check if round is complete
    if (this.checkRoundWinner()) {
      this.endRound()
    }
  }
  
  handlePlayerAction(playerId: string, action: string, data?: any): void {
    const state = this.state as RouletteState
    
    switch (action) {
      case 'spin_character':
        if (!state.isSpinning) {
          this.spinForCharacter()
        }
        break
      case 'ready_for_battle':
        if (state.spinResult) {
          this.startBattle()
        }
        break
    }
  }
  
  private spinForCharacter(): void {
    const state = this.state as RouletteState
    state.isSpinning = true
    
    // Simulate spin animation duration
    setTimeout(() => {
      // Random character selection (could be weighted by rarity)
      const characters = require('@/data/characters').characters
      const randomIndex = Math.floor(Math.random() * characters.length)
      state.spinResult = characters[randomIndex]
      state.isSpinning = false
    }, 2000)
  }
  
  private startBattle(): void {
    // Spawn player and bot entities in the arena
    this.spawnFighters()
    this.state.currentRound++
  }
  
  private spawnFighters(): void {
    // Implementation to spawn player and bot entities
    // This would interact with the physics world to place entities
  }
  
  private checkRoundWinner(): boolean {
    // Check if any player/bot has 0 health
    for (const [id, entity] of this.world.entities) {
      if (entity.type === 'player' && entity.health <= 0) {
        return true
      }
    }
    return false
  }
  
  private endRound(): void {
    const state = this.state as RouletteState
    // Determine winner and update score
    // Check if someone won best of 3
    if (state.matchWins.player1 >= 2 || state.matchWins.bot1 >= 2) {
      this.endGame(state.matchWins.player1 >= 2 ? 'player1' : 'bot1')
    } else {
      // Start next round
      state.spinResult = undefined
    }
  }
  
  checkWinCondition(): boolean {
    const state = this.state as RouletteState
    return state.matchWins.player1 >= 2 || state.matchWins.bot1 >= 2
  }
  
  getGameUI(): any {
    const state = this.state as RouletteState
    return {
      type: 'roulette',
      isSpinning: state.isSpinning,
      spinResult: state.spinResult,
      matchWins: state.matchWins,
      currentRound: state.currentRound,
      maxRounds: state.maxRounds,
      canSpin: !state.isSpinning && !state.spinResult,
      canBattle: !!state.spinResult && !state.isActive
    }
  }
}

// Battle Royale Mode - Shrinking arena, last player standing
export class BattleRoyaleController extends GameModeController {
  createInitialState(): BattleRoyaleState {
    return {
      mode: 'battle-royale',
      isActive: false,
      isPaused: false,
      timeElapsed: 0,
      players: ['player1'],
      bots: ['bot1', 'bot2', 'bot3'],
      playersAlive: ['player1', 'bot1', 'bot2', 'bot3'],
      score: {},
      currentRound: 1,
      maxRounds: 1,
      shrinkTimer: 30000, // Start shrinking after 30 seconds
      arenaShrinkRate: 10, // pixels per second
      currentArenaSize: 800,
      powerUpSpawnTimer: 15000 // Spawn power-ups every 15 seconds
    }
  }
  
  update(deltaTime: number): void {
    if (!this.state.isActive || this.state.isPaused) return
    
    const state = this.state as BattleRoyaleState
    this.state.timeElapsed += deltaTime
    
    // Update shrink timer
    state.shrinkTimer -= deltaTime
    if (state.shrinkTimer <= 0) {
      this.shrinkArena(deltaTime)
    }
    
    // Update power-up spawn timer
    state.powerUpSpawnTimer -= deltaTime
    if (state.powerUpSpawnTimer <= 0) {
      this.spawnPowerUp()
      state.powerUpSpawnTimer = 15000
    }
    
    // Update alive players list
    this.updateAlivePlayers()
  }
  
  private shrinkArena(deltaTime: number): void {
    const state = this.state as BattleRoyaleState
    state.currentArenaSize = Math.max(200, state.currentArenaSize - state.arenaShrinkRate * deltaTime / 1000)
    
    // Damage entities outside the safe zone
    for (const [id, entity] of this.world.entities) {
      const distanceFromCenter = Math.sqrt(entity.position.x ** 2 + entity.position.y ** 2)
      if (distanceFromCenter > state.currentArenaSize / 2) {
        entity.health = Math.max(0, entity.health - 10 * deltaTime / 1000) // 10 damage per second
      }
    }
  }
  
  private spawnPowerUp(): void {
    // Spawn random power-up in safe zone
    const angle = Math.random() * Math.PI * 2
    const distance = Math.random() * (this.state as BattleRoyaleState).currentArenaSize * 0.4
    
    // Implementation would create power-up entity
  }
  
  private updateAlivePlayers(): void {
    const state = this.state as BattleRoyaleState
    state.playersAlive = []
    
    for (const [id, entity] of this.world.entities) {
      if ((entity.type === 'player') && entity.health > 0) {
        state.playersAlive.push(id)
      }
    }
  }
  
  handlePlayerAction(playerId: string, action: string, data?: any): void {
    // Handle battle royale specific actions
  }
  
  checkWinCondition(): boolean {
    const state = this.state as BattleRoyaleState
    return state.playersAlive.length <= 1
  }
  
  getGameUI(): any {
    const state = this.state as BattleRoyaleState
    return {
      type: 'battle-royale',
      playersAlive: state.playersAlive.length,
      shrinkTimer: Math.max(0, state.shrinkTimer),
      currentArenaSize: state.currentArenaSize,
      timeElapsed: this.state.timeElapsed
    }
  }
}

// Story Mode - Progressive levels with objectives
export class StoryController extends GameModeController {
  createInitialState(): StoryState {
    return {
      mode: 'story',
      isActive: false,
      isPaused: false,
      timeElapsed: 0,
      players: ['player1'],
      bots: ['bot1'],
      score: {},
      currentRound: 1,
      maxRounds: 10,
      currentLevel: 1,
      levelObjective: 'defeat_all',
      objectiveProgress: 0,
      objectiveTarget: 1,
      storyDialogue: [
        "Welcome to the Circlash Arena, warrior!",
        "Prove your worth by defeating the training bot.",
        "Use WASD to move and click to attack!"
      ]
    }
  }
  
  update(deltaTime: number): void {
    if (!this.state.isActive || this.state.isPaused) return
    
    this.state.timeElapsed += deltaTime
    this.updateObjectiveProgress()
  }
  
  private updateObjectiveProgress(): void {
    const state = this.state as StoryState
    
    switch (state.levelObjective) {
      case 'defeat_all':
        const aliveBots = Array.from(this.world.entities.values())
          .filter(e => e.type === 'player' && e.id.includes('bot') && e.health > 0)
        state.objectiveProgress = state.objectiveTarget - aliveBots.length
        break
        
      case 'survive_time':
        state.objectiveProgress = this.state.timeElapsed
        break
        
      case 'collect_items':
        // Count collected power-ups or items
        break
    }
  }
  
  handlePlayerAction(playerId: string, action: string, data?: any): void {
    if (action === 'next_dialogue') {
      const state = this.state as StoryState
      if (state.storyDialogue && state.storyDialogue.length > 0) {
        state.storyDialogue.shift()
      }
    }
  }
  
  checkWinCondition(): boolean {
    const state = this.state as StoryState
    return state.objectiveProgress >= state.objectiveTarget
  }
  
  getGameUI(): any {
    const state = this.state as StoryState
    return {
      type: 'story',
      currentLevel: state.currentLevel,
      objective: state.levelObjective,
      progress: state.objectiveProgress,
      target: state.objectiveTarget,
      dialogue: state.storyDialogue?.[0]
    }
  }
}

// Custom Mode - User-defined rules
export class CustomController extends GameModeController {
  createInitialState(): CustomState {
    return {
      mode: 'custom',
      isActive: false,
      isPaused: false,
      timeElapsed: 0,
      players: ['player1'],
      bots: [],
      score: {},
      currentRound: 1,
      maxRounds: 1,
      customRules: {
        respawnEnabled: false,
        weaponDropsEnabled: true,
        powerUpsEnabled: true,
        timeLimit: 300000, // 5 minutes
        scoreLimit: 10
      }
    }
  }
  
  update(deltaTime: number): void {
    if (!this.state.isActive || this.state.isPaused) return
    
    this.state.timeElapsed += deltaTime
    
    // Check time limit
    const state = this.state as CustomState
    if (state.customRules.timeLimit && this.state.timeElapsed >= state.customRules.timeLimit) {
      this.endGame(this.getDetermineWinnerByScore())
    }
  }
  
  private getDetermineWinnerByScore(): string {
    let maxScore = -1
    let winner = ''
    
    for (const [playerId, score] of Object.entries(this.state.score)) {
      if (score > maxScore) {
        maxScore = score
        winner = playerId
      }
    }
    
    return winner
  }
  
  handlePlayerAction(playerId: string, action: string, data?: any): void {
    const state = this.state as CustomState
    
    if (action === 'update_rules') {
      Object.assign(state.customRules, data)
    }
  }
  
  checkWinCondition(): boolean {
    const state = this.state as CustomState
    
    // Check score limit
    if (state.customRules.scoreLimit) {
      for (const score of Object.values(this.state.score)) {
        if (score >= state.customRules.scoreLimit) {
          return true
        }
      }
    }
    
    return false
  }
  
  getGameUI(): any {
    const state = this.state as CustomState
    return {
      type: 'custom',
      rules: state.customRules,
      timeRemaining: state.customRules.timeLimit ? 
        Math.max(0, state.customRules.timeLimit - this.state.timeElapsed) : null,
      scores: this.state.score
    }
  }
}

// Factory function to create appropriate controller
export function createGameModeController(
  mode: GameMode, 
  world: PhysicsWorld, 
  arena: ArenaSettings
): GameModeController {
  switch (mode) {
    case 'roulette':
      return new RouletteController(world, arena)
    case 'battle-royale':
      return new BattleRoyaleController(world, arena)
    case 'story':
      return new StoryController(world, arena)
    case 'custom':
      return new CustomController(world, arena)
    default:
      throw new Error(`Unknown game mode: ${mode}`)
  }
}
