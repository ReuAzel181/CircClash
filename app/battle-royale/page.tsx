'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, RotateCcw, Play, Pause, Shuffle, Users, Settings, Trophy, Crown, Sword } from 'lucide-react'
import GameCanvas from '../../components/GameCanvas'
import { 
  startGame, 
  resumeGame, 
  pauseGame, 
  stopGame, 
  spawnBot, 
  getCurrentGame,
  GameConfig 
} from '../../lib/game'

// Character data for Battle Royale
const characters = [
  { 
    id: 'vortex', 
    name: 'Plasma Vortex', 
    icon: '🌀', 
    stats: { health: 95, attack: 88, defense: 72, speed: 85, range: 400 },
    skill: 'Triple Shot',
    description: 'Fires 3 spinning plasma projectiles in a spread pattern'
  },
  { 
    id: 'guardian', 
    name: 'Steel Guardian', 
    icon: '🛡️', 
    stats: { health: 90, attack: 65, defense: 95, speed: 50, range: 300 },
    skill: 'Heavy Cannon',
    description: 'Shoots powerful but slow projectiles that deal massive damage'
  },
  { 
    id: 'striker', 
    name: 'Lightning Striker', 
    icon: '⚡', 
    stats: { health: 70, attack: 92, defense: 45, speed: 93, range: 450 },
    skill: 'Lightning Bolt',
    description: 'Ultra-fast lightning strikes with high precision'
  },
  { 
    id: 'mystic', 
    name: 'Mystic Orb', 
    icon: '🔮', 
    stats: { health: 75, attack: 78, defense: 68, speed: 79, range: 400 },
    skill: 'Magic Missile',
    description: 'Mystical projectiles with slight homing capability'
  },
  { 
    id: 'flame', 
    name: 'Fire Warrior', 
    icon: '🔥', 
    stats: { health: 80, attack: 85, defense: 60, speed: 75, range: 350 },
    skill: 'Fire Burst',
    description: 'Unleashes a barrage of 5 small fire projectiles'
  },
  { 
    id: 'frost', 
    name: 'Ice Knight', 
    icon: '❄️', 
    stats: { health: 85, attack: 70, defense: 85, speed: 60, range: 300 },
    skill: 'Frost Barrier',
    description: 'Summons protective ice barriers and wields a freezing blade in close combat'
  },
  { 
    id: 'shadow', 
    name: 'Shadow Assassin', 
    icon: '🥷', 
    stats: { health: 60, attack: 95, defense: 40, speed: 100, range: 500 },
    skill: 'Shadow Strike',
    description: 'Rapid-fire small projectiles with incredible speed'
  },
  { 
    id: 'titan', 
    name: 'Iron Titan', 
    icon: '🤖', 
    stats: { health: 120, attack: 60, defense: 100, speed: 30, range: 250 },
    skill: 'Mega Cannon',
    description: 'Devastating massive projectiles that obliterate everything'
  }
]

// Character color mapping for identification
const characterColors: { [key: string]: string } = {
  'vortex': '#8B5CF6',    // Purple
  'guardian': '#6B7280',  // Gray
  'striker': '#F59E0B',   // Orange
  'mystic': '#EC4899',    // Pink
  'flame': '#EF4444',     // Red
  'frost': '#06B6D4',     // Cyan
  'shadow': '#1F2937',    // Dark Gray
  'titan': '#64748B'      // Slate Gray
}

export default function BattleRoyalePage() {
  const router = useRouter()
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'paused' | 'ended'>('setup')
  const [gameStats, setGameStats] = useState({ time: 0, eliminations: 0 })
  const [winner, setWinner] = useState<string | null>(null)
  const [selectedFighters, setSelectedFighters] = useState<typeof characters>([])
  const [gameStartTime, setGameStartTime] = useState<number>(0)
  const [battleResult, setBattleResult] = useState<string | null>(null)
  const [gameUpdateTrigger, setGameUpdateTrigger] = useState(0)
  const [survivorsCount, setSurvivorsCount] = useState(0)
  
  // Large arena size for battle royale
  const [arenaSize, setArenaSize] = useState({ width: 1400, height: 800 })
  
  const [editingStats, setEditingStats] = useState<typeof characters>([])
  const [globalHealthMultiplier, setGlobalHealthMultiplier] = useState(1.5) // Higher default for battle royale
  
  // Calculate optimal arena size based on screen
  useEffect(() => {
    const updateArenaSize = () => {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Reserve space for UI elements
      const headerHeight = 60
      const footerHeight = 80
      const padding = 24
      const sidebarWidth = 320
      
      // Calculate available space - larger for battle royale
      const availableWidth = Math.max(800, viewportWidth - sidebarWidth - padding * 2)
      const availableHeight = Math.max(500, viewportHeight - headerHeight - footerHeight - padding * 2)
      
      // Use most of the available space but keep reasonable proportions
      const width = Math.min(availableWidth, 1400)
      const height = Math.min(availableHeight, 800)
      
      setArenaSize({ width, height })
    }
    
    updateArenaSize()
    window.addEventListener('resize', updateArenaSize)
    return () => window.removeEventListener('resize', updateArenaSize)
  }, [])
  
  // Initialize with all fighters for battle royale
  useEffect(() => {
    setSelectedFighters([...characters]) // All 8 fighters for battle royale
  }, [])

  // Update editing stats when selected fighters change
  useEffect(() => {
    setEditingStats(selectedFighters.map(fighter => ({ ...fighter })))
  }, [selectedFighters])

  // Handle game over events
  useEffect(() => {
    const handleGameOver = (event: any) => {
      const { winner: gameWinner, duration } = event.detail
      setWinner(gameWinner)
      setGameState('ended')
      setGameStats(prev => ({ 
        ...prev, 
        time: Math.floor(duration / 1000) 
      }))
      
      // Find winner character name
      const winnerChar = editingStats.find(f => `bot_${f.id}` === gameWinner)
      setBattleResult(winnerChar ? winnerChar.name : 'Unknown Fighter')
    }

    window.addEventListener('gameOver', handleGameOver)
    return () => window.removeEventListener('gameOver', handleGameOver)
  }, [editingStats])

  const initializeGame = () => {
    const gameConfig: GameConfig = {
      arenaWidth: arenaSize.width,
      arenaHeight: arenaSize.height,
      mode: 'battleroyale',
      maxPlayers: editingStats.length,
      enablePowerups: false,
      enableHazards: false
    }

    startGame(gameConfig)
    
    // Spawn all fighters in a circle formation for battle royale
    const centerX = arenaSize.width / 2
    const centerY = arenaSize.height / 2
    const spawnRadius = Math.min(arenaSize.width, arenaSize.height) * 0.35
    
    editingStats.forEach((char, index) => {
      const angle = (index / editingStats.length) * 2 * Math.PI
      const x = centerX + Math.cos(angle) * spawnRadius
      const y = centerY + Math.sin(angle) * spawnRadius
      
      const bot = spawnBot(`bot_${char.id}`, x, y, 'hard')
      
      // Apply custom stats with global health multiplier
      if (bot) {
        bot.health = char.stats.health * globalHealthMultiplier
        bot.maxHealth = bot.health
        bot.damage = char.stats.attack * 0.5
        bot.mass = Math.max(1, 50 - char.stats.speed * 0.3)
        ;(bot as any).defense = char.stats.defense
        ;(bot as any).attackRange = char.stats.range
      }
    })
  }

  const handleStartGame = () => {
    // Initialize audio before starting the game
    const { initAudio } = require('../../lib/audio');
    initAudio();
    
    initializeGame()
    pauseGame() // Start paused so user can edit stats first
    setGameState('paused')
    setGameStats({ time: 0, eliminations: 0 })
    setGameStartTime(Date.now())
    setBattleResult(null)
    setSurvivorsCount(selectedFighters.length)
  }

  const handlePauseGame = () => {
    pauseGame()
    setGameState('paused')
  }

  const handleResumeGame = () => {
    // Initialize audio before resuming the game
    const { initAudio } = require('../../lib/audio');
    initAudio();
    
    applyAllStatsToGame()
    resumeGame()
    setGameState('playing')
  }

  const handleRestart = () => {
    stopGame()
    setGameState('setup')
    setWinner(null)
    setBattleResult(null)
    setGameStats({ time: 0, eliminations: 0 })
    setSurvivorsCount(0)
    setGlobalHealthMultiplier(1.5)
  }

  const randomizeFighters = () => {
    const shuffled = [...characters].sort(() => 0.5 - Math.random())
    setSelectedFighters(shuffled) // All fighters for battle royale
  }

  const toggleFighter = (character: typeof characters[0]) => {
    setSelectedFighters(prev => {
      const exists = prev.find(f => f.id === character.id)
      if (exists) {
        return prev.filter(f => f.id !== character.id)
      } else {
        return [...prev, character]
      }
    })
  }

  const updateFighterStat = (fighterId: string, statName: string, value: number) => {
    let maxValue = 200
    if (statName === 'range') {
      maxValue = 600
    }
    
    setEditingStats(prev => prev.map(fighter => 
      fighter.id === fighterId 
        ? { ...fighter, stats: { ...fighter.stats, [statName]: Math.max(1, Math.min(maxValue, value)) }}
        : fighter
    ))
    
    // Apply changes to live game entities if game is active
    const game = getCurrentGame()
    if (game && (gameState === 'paused' || gameState === 'playing')) {
      const entity = game.world.entities.get(`bot_${fighterId}`)
      if (entity) {
        const updatedFighter = editingStats.find(f => f.id === fighterId)
        if (updatedFighter) {
          const tempFighter = { 
            ...updatedFighter, 
            stats: { 
              ...updatedFighter.stats, 
              [statName]: Math.max(1, Math.min(maxValue, value)) 
            } 
          }
          
          if (statName === 'health') {
            const newMaxHealth = tempFighter.stats.health * globalHealthMultiplier
            const healthRatio = entity.health / entity.maxHealth
            entity.maxHealth = newMaxHealth
            entity.health = newMaxHealth * healthRatio
          } else if (statName === 'attack') {
            entity.damage = tempFighter.stats.attack * 0.5
          } else if (statName === 'speed') {
            entity.mass = Math.max(1, 50 - tempFighter.stats.speed * 0.3)
          } else if (statName === 'defense') {
            ;(entity as any).defense = tempFighter.stats.defense
          } else if (statName === 'range') {
            ;(entity as any).attackRange = tempFighter.stats.range
          }
        }
      }
    }
  }

  const applyAllStatsToGame = () => {
    const game = getCurrentGame()
    if (game) {
      editingStats.forEach((char) => {
        const entity = game.world.entities.get(`bot_${char.id}`)
        if (entity) {
          const newMaxHealth = char.stats.health * globalHealthMultiplier
          const healthRatio = entity.health / entity.maxHealth
          entity.maxHealth = newMaxHealth
          entity.health = newMaxHealth * healthRatio
          entity.damage = char.stats.attack * 0.5
          entity.mass = Math.max(1, 50 - char.stats.speed * 0.3)
          ;(entity as any).defense = char.stats.defense
          ;(entity as any).attackRange = char.stats.range
        }
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Update timer and count survivors
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setGameStats(prev => ({
          ...prev,
          time: Math.floor((Date.now() - gameStartTime) / 1000)
        }))
        setGameUpdateTrigger(prev => prev + 1)
        
        // Count living fighters
        const game = getCurrentGame()
        if (game) {
          let aliveCount = 0
          for (const [id, entity] of game.world.entities) {
            if (entity.type === 'player' && entity.health > 0) {
              aliveCount++
            }
          }
          setSurvivorsCount(aliveCount)
        }
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gameState, gameStartTime])

  // Apply global health multiplier changes to live game
  useEffect(() => {
    if (gameState === 'paused' || gameState === 'playing') {
      applyAllStatsToGame()
    }
  }, [globalHealthMultiplier])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Game Area */}
      <div className="flex-1 p-3 overflow-hidden">
        <div className="h-full flex flex-col min-h-0">
          {/* Fighter Selection */}
          {gameState === 'setup' && (
            <>
              <motion.div 
                className="bg-white rounded-xl shadow-sm border p-6 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => router.push('/')} 
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
                    >
                      <Home className="w-4 h-4" />
                      <span>Back to Home</span>
                    </button>
                    <div className="w-px h-5 bg-gray-300" />
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      Battle Royale Arena - Ultimate Survival
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={randomizeFighters}
                      className="btn-secondary flex items-center gap-2 text-xs px-3 py-2"
                    >
                      <Shuffle className="w-3 h-3" />
                      Remix Arena
                    </button>
                    <span className="text-xs text-gray-600 px-2 py-2 bg-red-100 rounded-lg font-medium">
                      {selectedFighters.length}/8 Warriors Ready
                    </span>
                    <button
                      onClick={handleStartGame}
                      className="btn-primary flex items-center gap-2 text-xs px-3 py-2"
                      disabled={selectedFighters.length < 4}
                    >
                      <Sword className="w-3 h-3" />
                      Start Battle Royale
                    </button>
                  </div>
                </div>

                {/* Tekken-Style Battle Royale Selection */}
                <div className="bg-gradient-to-r from-red-900 via-black to-purple-900 rounded-lg p-4 mb-4">
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold text-white mb-1">⚔️ BATTLE ROYALE ⚔️</h3>
                    <p className="text-gray-300 text-sm">8 warriors enter, only one survives</p>
                  </div>

                  {/* Arena Status Display */}
                  <div className="bg-black bg-opacity-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl text-yellow-400">👑</div>
                        <div className="text-white font-bold text-sm">LAST STANDING</div>
                        <div className="text-gray-300 text-xs">Winner Takes All</div>
                      </div>
                      <div>
                        <div className="text-2xl text-red-400">⚡</div>
                        <div className="text-white font-bold text-sm">HIGH INTENSITY</div>
                        <div className="text-gray-300 text-xs">Fast-Paced Combat</div>
                      </div>
                      <div>
                        <div className="text-2xl text-blue-400">🎯</div>
                        <div className="text-white font-bold text-sm">SKILL BASED</div>
                        <div className="text-gray-300 text-xs">AI vs AI Combat</div>
                      </div>
                      <div>
                        <div className="text-2xl text-purple-400">🔥</div>
                        <div className="text-white font-bold text-sm">EPIC BATTLES</div>
                        <div className="text-gray-300 text-xs">Visual Spectacle</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Character Grid - Battle Royale Style */}
                <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
                  {characters.map((char) => {
                    const isSelected = selectedFighters.find(f => f.id === char.id)
                    return (
                      <button
                        key={char.id}
                        onClick={() => toggleFighter(char)}
                        className={`relative group overflow-hidden rounded-lg border-3 transition-all text-center transform hover:scale-105 ${
                          isSelected
                            ? 'border-yellow-400 bg-gradient-to-br from-yellow-100 to-orange-200 shadow-xl scale-105' 
                            : 'border-gray-400 bg-gradient-to-br from-white to-gray-100 hover:border-yellow-300 hover:shadow-lg'
                        }`}
                      >
                        {/* Character portrait */}
                        <div className="relative p-3">
                          <div className={`text-3xl mb-2 ${isSelected ? 'drop-shadow-lg animate-pulse' : ''}`}>
                            {char.icon}
                          </div>
                          
                          <div className="text-xs font-bold text-gray-800 mb-1 flex items-center justify-center gap-1">
                            <div 
                              className="w-2 h-2 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: characterColors[char.id] }}
                            ></div>
                            <span className="truncate">{char.name}</span>
                          </div>
                          
                          <div className="text-xs text-gray-600 mb-1 flex justify-center gap-1">
                            <span className="bg-red-100 text-red-700 px-1 rounded font-medium">{char.stats.health}HP</span>
                            <span className="bg-orange-100 text-orange-700 px-1 rounded font-medium">{char.stats.attack}ATK</span>
                          </div>
                          
                          <div className="text-xs text-blue-700 font-medium bg-blue-50 rounded px-1 py-0.5 truncate">
                            {char.skill}
                          </div>
                          
                          {/* Selection indicator */}
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-yellow-400 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                              ✓
                            </div>
                          )}
                          
                          {/* Battle Royale border effect */}
                          <div className={`absolute inset-0 border-3 rounded-lg transition-all ${
                            isSelected 
                              ? 'border-yellow-400 shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse' 
                              : 'border-transparent group-hover:border-yellow-300'
                          }`}></div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Battle Info */}
                <div className="border-t pt-3">
                  <div className="bg-gradient-to-r from-red-800 to-purple-800 rounded-lg p-3">
                    <h3 className="font-bold text-white mb-2 text-center text-base flex items-center justify-center gap-2">
                      🏟️ ARENA READY 🏟️
                    </h3>
                    <div className="text-center text-gray-200">
                      <div className="text-sm mb-1">
                        <strong>{selectedFighters.length} Warriors</strong> selected for ultimate combat
                      </div>
                      <div className="text-xs">
                        Each fighter will use their unique special abilities and fighting styles
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="bg-white rounded-xl shadow-sm border p-4 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="font-semibold text-gray-900 mb-2 text-base">Battle Royale Rules:</h3>
                <ul className="space-y-1 text-gray-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1 text-xs">•</span>
                    <span>Up to 8 fighters spawn in a circular formation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1 text-xs">•</span>
                    <span>Each fighter has unique weapons and special attacks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1 text-xs">•</span>
                    <span>Fighters automatically target and attack nearby enemies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1 text-xs">•</span>
                    <span>Last fighter standing wins the battle royale</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1 text-xs">•</span>
                    <span>Customize fighter stats before the battle begins</span>
                  </li>
                </ul>
              </motion.div>
            </>
          )}

          {/* Game Canvas and Stats Editor for Playing/Paused/Ended States */}
          {(gameState === 'playing' || gameState === 'paused' || gameState === 'ended') && (
            <div className="flex-1 flex gap-4 overflow-hidden">
              {/* Game Canvas - Left Side */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="bg-white rounded-xl shadow-sm border flex flex-col h-full">
                  <div className="p-4 border-b flex-shrink-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">🏟️ Battle Royale Arena</h2>
                        <p className="text-sm text-gray-600">
                          Arena: {arenaSize.width}×{arenaSize.height} | Health: {globalHealthMultiplier.toFixed(1)}x | Time: {formatTime(gameStats.time)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">{survivorsCount} Survivors</div>
                        <div className="text-xs text-gray-500">of {selectedFighters.length} warriors</div>
                      </div>
                    </div>
                  </div>
                <div className="flex-1 relative overflow-hidden">
                  <GameCanvas
                    width={arenaSize.width}
                    height={arenaSize.height}
                    className="w-full h-full"
                    playerId={undefined}
                    onGameStateChange={() => {}}
                  />

                    {/* Game Over Overlay */}
                    {gameState === 'ended' && (
                      <motion.div
                        className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="bg-white rounded-xl p-8 text-center max-w-md mx-4">
                          <div className="text-6xl mb-4">👑</div>
                          <h2 className="text-3xl font-bold text-gray-900 mb-2">VICTORY!</h2>
                          <p className="text-gray-600 mb-4">
                            <strong className="text-yellow-600">{battleResult}</strong> dominated the battle royale arena after {formatTime(gameStats.time)} of epic combat!
                          </p>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                            <div className="text-yellow-800 font-medium text-sm">
                              🏆 Champion of {selectedFighters.length} Warriors
                            </div>
                          </div>
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={handleRestart}
                              className="btn-primary flex items-center gap-2"
                            >
                              <RotateCcw className="w-4 h-4" />
                              New Battle Royale
                            </button>
                            <button 
                              onClick={() => router.push('/')} 
                              className="btn-secondary flex items-center gap-2"
                            >
                              <Home className="w-4 h-4" />
                              Home
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Pause Overlay */}
                    {gameState === 'paused' && (
                      <motion.div
                        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="bg-white rounded-xl p-8 text-center">
                          <div className="text-6xl mb-4">⚔️</div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">Arena Ready</h2>
                          <p className="text-gray-600 mb-4">
                            {selectedFighters.length} warriors await your command. Adjust their stats and unleash the battle!
                          </p>
                          <button
                            onClick={handleResumeGame}
                            className="btn-primary flex items-center gap-2 mx-auto"
                          >
                            <Play className="w-4 h-4" />
                            Start Battle Royale
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Editor - Right Side */}
              <div className="w-72 flex-shrink-0">
                <motion.div 
                  className="bg-white rounded-xl shadow-sm border p-4 h-full flex flex-col"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-red-500" />
                        Battle Royale Settings
                      </h2>
                      <div className="flex items-center gap-2">
                        {gameState === 'paused' && (
                          <button
                            onClick={handleResumeGame}
                            className="btn-primary flex items-center gap-1 text-xs px-2 py-1"
                          >
                            <Play className="w-3 h-3" />
                            Start
                          </button>
                        )}
                        
                        {(gameState === 'ended' || gameState === 'paused') && (
                          <button
                            onClick={handleRestart}
                            className="btn-secondary flex items-center gap-1 text-xs px-2 py-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Global Health Multiplier */}
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                      <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2 text-sm">
                        ⚡ Global Health Multiplier
                      </h3>
                      <div>
                        <label className="block text-xs font-bold text-red-700 mb-1">
                          Survival Factor: <span className="bg-red-200 px-1 py-0.5 rounded text-red-800">{globalHealthMultiplier.toFixed(1)}x</span>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="3"
                          step="0.1"
                          value={globalHealthMultiplier}
                          onChange={(e) => setGlobalHealthMultiplier(parseFloat(e.target.value))}
                          className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                        <div className="text-xs text-red-700 mt-1 font-medium">
                          🛡️ {globalHealthMultiplier >= 2 ? 'Epic battles' : globalHealthMultiplier >= 1.5 ? 'Balanced combat' : 'Quick eliminations'} 
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fighter Stats - Compact for Battle Royale */}
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">Warrior Stats</h3>
                    <div className="space-y-2 h-full overflow-y-auto pr-1">
                      {editingStats.map((fighter) => (
                        <div key={fighter.id} className="border border-gray-200 rounded-lg p-2">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">{fighter.icon}</span>
                            <div>
                              <div className="font-medium text-gray-900 text-xs flex items-center gap-1">
                                <div 
                                  className="w-2 h-2 rounded-full border border-white"
                                  style={{ backgroundColor: characterColors[fighter.id] }}
                                ></div>
                                {fighter.name}
                              </div>
                              <div className="text-xs text-blue-600">{fighter.skill}</div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            {/* Compact stat sliders */}
                            {['health', 'attack', 'defense', 'speed', 'range'].map((stat) => (
                              <div key={stat} className="flex items-center gap-2">
                                <label className="text-xs font-bold text-gray-700 w-12 capitalize">
                                  {stat.slice(0, 3)}
                                </label>
                                <input
                                  type="range"
                                  min={stat === 'range' ? 200 : stat === 'health' ? 50 : 20}
                                  max={stat === 'range' ? 600 : stat === 'health' ? 200 : 120}
                                  value={fighter.stats[stat as keyof typeof fighter.stats]}
                                  onChange={(e) => updateFighterStat(fighter.id, stat, parseInt(e.target.value))}
                                  className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-xs font-bold text-gray-600 w-8 text-right">
                                  {fighter.stats[stat as keyof typeof fighter.stats]}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Game Canvas for setup state only */}
          {gameState === 'setup' && (
            <div className="bg-white rounded-xl shadow-sm border flex-1 flex items-center justify-center min-h-[300px]">
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="text-6xl mb-4">🏟️</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Battle Royale Arena</h2>
                <p className="text-gray-600 text-sm max-w-md">
                  Select your warriors and prepare for the ultimate survival battle
                </p>
              </motion.div>
            </div>
          )}

          {/* Battle Info */}
          {gameState === 'playing' && (
            <div className="mt-4 bg-white rounded-lg p-4 text-center text-sm text-gray-600 flex-shrink-0">
              <p><strong>Battle Royale in Progress:</strong> {survivorsCount} warriors remain • Epic AI survival combat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
