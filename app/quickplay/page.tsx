'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, RotateCcw, Play, Pause, Shuffle, Users, Settings, ChevronRight } from 'lucide-react'
import GameCanvas from '../../components/GameCanvas'
import { 
  startGame, 
  resumeGame, 
  pauseGame, 
  stopGame, 
  spawnBot, 
  getCurrentGame,
  setArenaSize as updateGameArenaSize,
  GameConfig 
} from '../../lib/game'

// Character data for AI battles
const characters = [
  { 
    id: 'vortex', 
    name: 'Plasma Vortex', 
    icon: '🌀', 
    stats: { health: 275, attack: 38, defense: 72, speed: 60, range: 280 },
    skill: 'Plasma Vortex + Stacks',
    description: 'Creates 3-second vortexes that pull enemies inward. Every 7 hits triggers rapid fire!'
  },
  { 
    id: 'guardian', 
    name: 'Steel Guardian', 
    icon: '🛡️', 
    stats: { health: 270, attack: 35, defense: 95, speed: 35, range: 210 },
    skill: 'Fortress Slam',
    description: 'Creates protective barriers and defensive walls on impact'
  },
  { 
    id: 'striker', 
    name: 'Lightning Striker', 
    icon: '⚡', 
    stats: { health: 240, attack: 42, defense: 45, speed: 65, range: 315 },
    skill: 'Chain Surge',
    description: 'Lightning that jumps between enemies in chain reactions'
  },
  { 
    id: 'mystic', 
    name: 'Mystic Orb', 
    icon: '🔮', 
    stats: { health: 225, attack: 30, defense: 60, speed: 50, range: 260 },
    skill: 'Mystic Web',
    description: 'Fires magical threads that tether and slightly slow enemies on hit'
  },
  { 
    id: 'flame', 
    name: 'Fire Warrior', 
    icon: '🔥', 
    stats: { health: 260, attack: 39, defense: 60, speed: 53, range: 245 },
    skill: 'Flame Burst',
    description: 'Fires 2 explosive projectiles that leave fire trails and area damage on impact'
  },
  { 
    id: 'frost', 
    name: 'Ice Knight', 
    icon: '❄️', 
    stats: { health: 270, attack: 33, defense: 85, speed: 42, range: 210 },
    skill: 'Ice Wall',
    description: 'Creates temporary ice barriers that block projectiles and slow nearby enemies'
  },
  { 
    id: 'shadow', 
    name: 'Shadow Assassin', 
    icon: '🥷', 
    stats: { health: 210, attack: 44, defense: 40, speed: 70, range: 350 },
    skill: 'Shadow Clone',
    description: 'Creates 2 brief shadow duplicates that confuse enemies and provide distraction'
  },
  { 
    id: 'titan', 
    name: 'Iron Titan', 
    icon: '🤖', 
    stats: { health: 300, attack: 30, defense: 100, speed: 25, range: 200 },
    skill: 'Seismic Slam',
    description: 'Creates massive ground shockwaves that damage and knock back all nearby enemies'
  },
  { 
    id: 'archer', 
    name: 'Wind Archer', 
    icon: '🏹', 
    stats: { health: 225, attack: 41, defense: 50, speed: 60, range: 385 },
    skill: 'Wind Tunnel',
    description: 'Creates gusting wind corridors that redirect and accelerate projectiles'
  },
  { 
    id: 'samurai', 
    name: 'Blade Master', 
    icon: '⚔️', 
    stats: { health: 240, attack: 45, defense: 70, speed: 63, range: 160 },
    skill: 'Lightning Edge',
    description: 'Charges weapons with electrical energy that chains damage between nearby enemies'
  },
  { 
    id: 'sniper', 
    name: 'Void Sniper', 
    icon: '🎯', 
    stats: { health: 195, attack: 50, defense: 35, speed: 42, range: 455 },
    skill: 'Void Rifts',
    description: 'Creates a single dimensional rift that allows precise shots from unexpected angles'
  },
  { 
    id: 'bomber', 
    name: 'Chaos Bomber', 
    icon: '💣', 
    stats: { health: 270, attack: 36, defense: 65, speed: 49, range: 280 },
    skill: 'Mine Field',
    description: 'Deploys proximity mines that detonate when enemies approach'
  }
]

// Character color mapping for identification - updated to be more distinct
const characterColors: { [key: string]: string } = {
  'vortex': '#8B5CF6',    // Purple
  'guardian': '#6B7280',  // Gray
  'striker': '#F59E0B',   // Orange (changed from yellow for distinction)
  'mystic': '#EC4899',    // Pink (changed from purple for distinction)
  'flame': '#EF4444',     // Red
  'frost': '#06B6D4',     // Cyan
  'shadow': '#1F2937',    // Dark Gray
  'titan': '#64748B',     // Slate Gray (changed for better distinction)
  'archer': '#10B981',    // Emerald Green
  'samurai': '#7C3AED',   // Violet
  'sniper': '#0F172A',    // Dark Slate
  'bomber': '#F97316'     // Orange Red
}

// Generate adaptive spawn positions based on arena size and number of fighters
function generateAdaptiveSpawnPositions(width: number, height: number, numFighters: number) {
  const positions = []
  const margin = Math.min(width * 0.15, height * 0.15, 100) // Adaptive margin (15% of smaller dimension, max 100px)
  const centerX = width / 2
  const centerY = height / 2
  
  if (numFighters <= 2) {
    // For 2 fighters, place them on opposite sides
    positions.push(
      { x: margin, y: centerY },
      { x: width - margin, y: centerY }
    )
  } else if (numFighters <= 4) {
    // For 3-4 fighters, use corners
    positions.push(
      { x: margin, y: margin },
      { x: width - margin, y: margin },
      { x: width - margin, y: height - margin },
      { x: margin, y: height - margin }
    )
  } else {
    // For more fighters, use circle formation
    const radius = Math.min(width, height) * 0.3
    for (let i = 0; i < numFighters; i++) {
      const angle = (i * 2 * Math.PI) / numFighters
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      positions.push({ 
        x: Math.max(margin, Math.min(width - margin, x)), 
        y: Math.max(margin, Math.min(height - margin, y)) 
      })
    }
  }
  
  return positions
}

export default function QuickPlayPage() {
  const router = useRouter()
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'paused' | 'ended'>('setup')
  const [gameStats, setGameStats] = useState({ time: 0, eliminations: 0 })
  const [realTimeHealths, setRealTimeHealths] = useState<Record<string, number>>({})
  const [winner, setWinner] = useState<string | null>(null)
  const [selectedFighters, setSelectedFighters] = useState<typeof characters>([])
  const [gameStartTime, setGameStartTime] = useState<number>(0)
  const [battleResult, setBattleResult] = useState<string | null>(null)
  const [gameUpdateTrigger, setGameUpdateTrigger] = useState(0)
  
  // Dynamic arena size - calculate based on viewport - optimized for 100% zoom
  const [arenaSize, setArenaSize] = useState({ width: 600, height: 310 })
  
  const [editingStats, setEditingStats] = useState<typeof characters>([])
  const [globalHealthMultiplier, setGlobalHealthMultiplier] = useState(1)
  const [arenaTheme, setArenaTheme] = useState<'dark' | 'light' | 'sunset' | 'ocean' | 'forest'>('dark')
  const [showBattleSettings, setShowBattleSettings] = useState(true)
  const [paused, setPaused] = useState(false)
  
  // Calculate optimal arena size based on screen
  useEffect(() => {
    const updateArenaSize = () => {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Reserve more vertical space for headers/toolbars and OS taskbars
      const headerHeight = 140 // increased to ensure arena doesn't grow too tall
      const footerHeight = 80  // increased to account for OS taskbar or overlays
      const padding = 24
      const sidebarWidth = showBattleSettings ? 224 : 0 // Stats panel width (56 * 4 = 224px)
      
      // Calculate available space
      const availableWidth = Math.max(400, viewportWidth - sidebarWidth - padding * 2)
      const availableHeight = Math.max(240, viewportHeight - headerHeight - footerHeight - padding * 2)
      
      // Use more conservative max heights so arena always fits and has breathing room
      const width = Math.min(availableWidth, showBattleSettings ? 800 : 1200)
      const height = Math.min(availableHeight, showBattleSettings ? 310 : 470) // Added 10px to both values
      
      setArenaSize({ width, height })
    }
    
    updateArenaSize()
    window.addEventListener('resize', updateArenaSize)
    return () => window.removeEventListener('resize', updateArenaSize)
  }, [showBattleSettings])
  
  // Handle arena resize during active games - reposition characters adaptively
  useEffect(() => {
    if (gameState === 'playing' || gameState === 'paused') {
      const game = getCurrentGame()
      if (game && editingStats.length > 0) {
        // Update arena size and keep entities in bounds
        updateGameArenaSize(arenaSize.width, arenaSize.height)
        
        // Reposition existing characters adaptively
        const newPositions = generateAdaptiveSpawnPositions(arenaSize.width, arenaSize.height, editingStats.length)
        editingStats.forEach((char, index) => {
          const entity = game.world.entities.get(`bot_${char.id}`)
          if (entity && newPositions[index]) {
            // Smoothly transition to new position, keeping characters in bounds
            entity.position.x = Math.max(25, Math.min(arenaSize.width - 25, newPositions[index].x))
            entity.position.y = Math.max(25, Math.min(arenaSize.height - 25, newPositions[index].y))
          }
        })
      }
    }
  }, [arenaSize, gameState, editingStats])
  
  // Initialize with 2 random fighters for Tekken-style duels
  useEffect(() => {
    randomizeFighters()
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
      mode: 'roulette',
      maxPlayers: editingStats.length,
      enablePowerups: false,
      enableHazards: false
    }

    startGame(gameConfig)
    
    // Spawn all selected fighters as AI bots with adaptive spacing based on arena size
    const spawnPositions = generateAdaptiveSpawnPositions(arenaSize.width, arenaSize.height, editingStats.length)
    
    editingStats.forEach((char, index) => {
      const pos = spawnPositions[index] || { x: arenaSize.width / 2, y: arenaSize.height / 2 }
      const bot = spawnBot(`bot_${char.id}`, pos.x, pos.y, 'hard')
      
      // Apply custom stats with global health multiplier
      if (bot) {
        bot.health = char.stats.health * globalHealthMultiplier
        bot.maxHealth = bot.health
        bot.damage = char.stats.attack * 0.10  // Reduced by 20% more (from 0.4 to 0.32)
        bot.mass = Math.max(1, 50 - char.stats.speed * 0.3)
        // Add defense stat for shield visualization
        ;(bot as any).defense = char.stats.defense
        // Add range stat for AI targeting (important for new weapon types)
        ;(bot as any).attackRange = char.stats.range
      }
    })
  }

  const handleStartGame = () => {
    if (selectedFighters.length < 2) {
      alert('Please select 2 fighters for the duel!')
      return
    }
    
    initializeGame()
    pauseGame() // Start paused so user can edit stats first
    setGameState('paused')
    setGameStats({ time: 0, eliminations: 0 })
    setGameStartTime(Date.now())
    setBattleResult(null)
  }

  const handlePauseGame = () => {
  pauseGame()
  setGameState('paused')
  setPaused(true)
  }

  const handleResumeGame = () => {
    applyAllStatsToGame() // Apply all current stat changes before resuming
    resumeGame()
    setGameState('playing')
  setPaused(false)
  }

  const handleRestart = () => {
    stopGame()
    setGameState('setup')
    setWinner(null)
    setBattleResult(null)
    setGameStats({ time: 0, eliminations: 0 })
    setGlobalHealthMultiplier(1)
  }

  const randomizeFighters = () => {
    const shuffled = [...characters].sort(() => 0.5 - Math.random())
    setSelectedFighters(shuffled.slice(0, 2)) // Only 2 fighters for Tekken-style duels
  }

  const toggleFighter = (character: typeof characters[0]) => {
    setSelectedFighters(prev => {
      const exists = prev.find(f => f.id === character.id)
      if (exists) {
        return prev.filter(f => f.id !== character.id)
      } else if (prev.length < 2) { // Max 2 fighters for Tekken-style
        return [...prev, character]
      } else {
        // Replace the oldest selected fighter if already at max
        return [prev[1], character]
      }
    })
  }

  const updateFighterStat = (fighterId: string, statName: string, value: number) => {
    // Set different max values for different stats
    let maxValue = 200
    if (statName === 'range') {
      maxValue = 600 // Range can go up to 600
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
          // Create a temporary fighter object with the new stat value
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
            entity.health = newMaxHealth * healthRatio // Maintain health percentage
          } else if (statName === 'attack') {
            entity.damage = tempFighter.stats.attack * 0.10  // Reduced by 20% more
          } else if (statName === 'speed') {
            entity.mass = Math.max(1, 50 - tempFighter.stats.speed * 0.3)
          } else if (statName === 'defense') {
            ;(entity as any).defense = tempFighter.stats.defense
          } else if (statName === 'range') {
            // Store range for AI targeting (used in physics AI system)
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
          entity.health = newMaxHealth * healthRatio // Maintain health percentage
          entity.damage = char.stats.attack * 0.10  // Reduced by 20% more
          entity.mass = Math.max(1, 50 - char.stats.speed * 0.3)
          ;(entity as any).defense = char.stats.defense
          ;(entity as any).attackRange = char.stats.range // Apply range to AI
        }
      })
    }
  }

  const handleBackToSetup = () => {
    setGameState('setup')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Update timer and trigger health updates when game is playing
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    let healthInterval: NodeJS.Timeout | null = null
    
    if (gameState === 'playing') {
      // Update timer every second
      interval = setInterval(() => {
        setGameStats(prev => ({
          ...prev,
          time: Math.floor((Date.now() - gameStartTime) / 1000)
        }))
        setGameUpdateTrigger(prev => prev + 1)
      }, 1000)
      
      // Update health data more frequently for real-time sync
      healthInterval = setInterval(() => {
        const game = getCurrentGame()
        if (game) {
          const newHealths: Record<string, number> = {}
          for (const [id, entity] of game.world.entities) {
            if (entity.type === 'player' && entity.health !== undefined) {
              newHealths[id] = entity.health
            }
          }
          setRealTimeHealths(newHealths)
        }
      }, 100) // Update health every 100ms for smooth real-time updates
    }
    
    return () => {
      if (interval) clearInterval(interval)
      if (healthInterval) clearInterval(healthInterval)
    }
  }, [gameState, gameStartTime])

  // Apply global health multiplier changes to live game
  useEffect(() => {
    if (gameState === 'paused' || gameState === 'playing') {
      applyAllStatsToGame()
    }
  }, [globalHealthMultiplier])

  return (
  <div className="min-h-screen bg-gray-50 flex flex-col" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 10px) + 5rem)' }}>
      {/* Game Area */}
      <div className="flex-1 p-3 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Fighter Selection */}
          {gameState === 'setup' && (
            <>
              <motion.div 
                className="bg-white rounded-xl shadow-sm border p-4 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-3">
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
                      <Users className="w-4 h-4 text-primary-500" />
                      Fighter Selection - Choose Your Warriors
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={randomizeFighters}
                      className="btn-secondary flex items-center gap-2 text-xs px-3 py-2"
                    >
                      <Shuffle className="w-3 h-3" />
                      Random Match
                    </button>
                    <div className="relative">
                      <select
                        value={arenaTheme}
                        onChange={(e) => setArenaTheme(e.target.value as any)}
                        className="text-xs px-2 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="dark">🌙 Dark Arena</option>
                        <option value="light">☀️ Light Arena</option>
                        <option value="sunset">🌅 Sunset Arena</option>
                        <option value="ocean">🌊 Ocean Arena</option>
                        <option value="forest">🌲 Forest Arena</option>
                      </select>
                    </div>
                    <span className="text-xs text-gray-600 px-2 py-2 bg-yellow-100 rounded-lg font-medium">
                      {selectedFighters.length}/2 Ready for Battle
                    </span>
                  </div>
                </div>

                {/* Enhanced Character Selection - Tekken Style */}
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-xl p-4 mb-3 relative border border-yellow-400/30 shadow-2xl">
                  {/* Background texture effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-red-400/5 rounded-xl"></div>
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-t-xl opacity-80"></div>
                  
                  <div className="text-center mb-4 relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg gaming-title">CHOOSE YOUR FIGHTER</h3>
                    <p className="text-yellow-300 text-base font-semibold">Select 2 warriors for the ultimate duel</p>
                  </div>

                  {/* Selected Fighters Display - Enhanced Tekken Style */}
                  <div className="flex justify-center items-center gap-6 mb-4 relative z-10">
                    {/* Fighter 1 Slot */}
                    <div className="relative group">
                      {selectedFighters[0] ? (
                        <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-xl p-4 w-64 h-72 flex flex-col border-4 border-yellow-400 shadow-2xl relative transform transition-all duration-300 hover:scale-105">
                          {/* Animated border glow */}
                          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                          <div className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-lg h-full p-4">
                            
                            {/* Fighter indicator */}
                            <div className="absolute top-3 left-3 bg-yellow-400 text-black rounded-full w-8 h-8 flex items-center justify-center font-black text-sm shadow-lg">
                              P1
                            </div>
                            
                            {/* Character icon - compact */}
                            <div className="text-center mb-3 pt-6">
                              <div className="text-4xl mb-2 filter drop-shadow-lg">{selectedFighters[0].icon}</div>
                              <div className="text-white font-bold text-lg mb-2 px-1">{selectedFighters[0].name}</div>
                              <div className="text-yellow-300 font-semibold text-sm bg-black bg-opacity-50 rounded-full px-3 py-1 mx-1">
                                {selectedFighters[0].skill}
                              </div>
                            </div>
                            
                            {/* Character Description - better spacing for readability */}
                            <div className="flex-1 mb-3">
                              <div className="text-xs text-gray-100 leading-relaxed bg-black bg-opacity-40 rounded-lg p-3 border border-yellow-400/30 h-24 overflow-hidden relative">
                                <div className="line-clamp-4">
                                  {selectedFighters[0].description}
                                </div>
                                {/* Fade effect for overflow */}
                                <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                              </div>
                            </div>
                            
                            {/* Stats Grid - Better spacing */}
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="bg-black bg-opacity-70 rounded-lg px-2 py-2 border border-blue-400/50 text-center">
                                <div className="text-blue-300 font-bold text-xs">DEF</div>
                                <div className="text-white font-bold text-sm">{selectedFighters[0].stats.defense}</div>
                              </div>
                              <div className="bg-black bg-opacity-70 rounded-lg px-2 py-2 border border-green-400/50 text-center">
                                <div className="text-green-300 font-bold text-xs">SPD</div>
                                <div className="text-white font-bold text-sm">{selectedFighters[0].stats.speed}</div>
                              </div>
                              <div className="bg-black bg-opacity-70 rounded-lg px-2 py-2 border border-purple-400/50 text-center">
                                <div className="text-purple-300 font-bold text-xs">RNG</div>
                                <div className="text-white font-bold text-sm">{selectedFighters[0].stats.range}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-gray-700 to-gray-900 border-4 border-dashed border-gray-500 rounded-xl w-64 h-72 flex items-center justify-center relative group hover:border-yellow-400/50 transition-all duration-300">
                          <div className="text-center text-gray-400 relative z-10">
                            <div className="text-4xl mb-3 opacity-50">❓</div>
                            <div className="font-bold text-base">FIGHTER 1</div>
                            <div className="text-sm opacity-75">Select below</div>
                            <div className="mt-3 text-sm bg-gray-600 rounded-full px-3 py-1 inline-block">Player 1</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enhanced VS Section */}
                    <div className="text-center relative flex flex-col items-center">
                      <div className="text-4xl font-black text-yellow-400 mb-3 drop-shadow-2xl animate-pulse gaming-title">VS</div>
                      
                      {/* START BATTLE Button */}
                      {selectedFighters.length === 2 && (
                        <button
                          onClick={handleStartGame}
                          className="bg-gradient-to-r from-green-500 via-emerald-600 to-green-700 hover:from-green-600 hover:via-emerald-700 hover:to-green-800 text-white font-black py-3 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-110 shadow-2xl border-4 border-yellow-400 flex items-center gap-2 group"
                        >
                          <Play className="w-5 h-5 group-hover:animate-pulse" />
                          START BATTLE
                        </button>
                      )}
                      
                      {selectedFighters.length < 2 && (
                        <div className="text-gray-400 text-base font-bold bg-gray-800 rounded-xl px-4 py-2 border-2 border-gray-600">
                          Select 2 fighters to start
                        </div>
                      )}
                    </div>

                    {/* Fighter 2 Slot */}
                    <div className="relative group">
                      {selectedFighters[1] ? (
                        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-xl p-4 w-64 h-72 flex flex-col border-4 border-yellow-400 shadow-2xl relative transform transition-all duration-300 hover:scale-105">
                          {/* Animated border glow */}
                          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-lg h-full p-4">
                            
                            {/* Fighter indicator */}
                            <div className="absolute top-3 left-3 bg-cyan-400 text-black rounded-full w-8 h-8 flex items-center justify-center font-black text-sm shadow-lg">
                              P2
                            </div>
                            
                            {/* Character icon - compact */}
                            <div className="text-center mb-3 pt-6">
                              <div className="text-4xl mb-2 filter drop-shadow-lg">{selectedFighters[1].icon}</div>
                              <div className="text-white font-bold text-lg mb-2 px-1">{selectedFighters[1].name}</div>
                              <div className="text-cyan-300 font-semibold text-sm bg-black bg-opacity-50 rounded-full px-3 py-1 mx-1">
                                {selectedFighters[1].skill}
                              </div>
                            </div>
                            
                            {/* Character Description - better spacing for readability */}
                            <div className="flex-1 mb-3">
                              <div className="text-xs text-gray-100 leading-relaxed bg-black bg-opacity-40 rounded-lg p-3 border border-cyan-400/30 h-24 overflow-hidden relative">
                                <div className="line-clamp-4">
                                  {selectedFighters[1].description}
                                </div>
                                {/* Fade effect for overflow */}
                                <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                              </div>
                            </div>
                            
                            {/* Stats Grid - Better spacing */}
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="bg-black bg-opacity-70 rounded-lg px-2 py-2 border border-blue-400/50 text-center">
                                <div className="text-blue-300 font-bold text-xs">DEF</div>
                                <div className="text-white font-bold text-sm">{selectedFighters[1].stats.defense}</div>
                              </div>
                              <div className="bg-black bg-opacity-70 rounded-lg px-2 py-2 border border-green-400/50 text-center">
                                <div className="text-green-300 font-bold text-xs">SPD</div>
                                <div className="text-white font-bold text-sm">{selectedFighters[1].stats.speed}</div>
                              </div>
                              <div className="bg-black bg-opacity-70 rounded-lg px-2 py-2 border border-purple-400/50 text-center">
                                <div className="text-purple-300 font-bold text-xs">RNG</div>
                                <div className="text-white font-bold text-sm">{selectedFighters[1].stats.range}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-gray-700 to-gray-900 border-4 border-dashed border-gray-500 rounded-xl w-64 h-72 flex items-center justify-center relative group hover:border-yellow-400/50 transition-all duration-300">
                          <div className="text-center text-gray-400 relative z-10">
                            <div className="text-4xl mb-3 opacity-50">❓</div>
                            <div className="font-bold text-base">FIGHTER 2</div>
                            <div className="text-sm opacity-75">Select below</div>
                            <div className="mt-3 text-sm bg-gray-600 rounded-full px-3 py-1 inline-block">Player 2</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Character Grid - Clean and Minimalist */}
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h4 className="text-center text-gray-900 font-bold text-lg mb-4">
                    Select Your Warriors
                  </h4>
                  
                  <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12 gap-2 mb-3">
                    {characters.map((char) => {
                      const isSelected = selectedFighters.find(f => f.id === char.id)
                      return (
                        <button
                          key={char.id}
                          onClick={() => toggleFighter(char)}
                          className={`relative group rounded-lg border-2 transition-all text-center p-2 ${
                            isSelected
                              ? 'border-yellow-500 bg-yellow-50 shadow-lg' 
                              : 'border-gray-300 bg-white hover:border-yellow-300 hover:bg-yellow-50'
                          }`}
                        >
                          <div className="relative">
                            {/* Character icon */}
                            <div className="text-lg mb-2">
                              {char.icon}
                            </div>
                            
                            {/* Character name with color indicator */}
                            <div className="text-xs font-bold text-gray-800 mb-1 flex items-center justify-center gap-1">
                              <div 
                                className="w-2 h-2 rounded-full border border-gray-300"
                                style={{ backgroundColor: characterColors[char.id] }}
                              ></div>
                              <span className="truncate text-xs">{char.name}</span>
                            </div>
                            
                            {/* Special skill */}
                            <div className="text-xs font-medium rounded px-1 py-0.5 truncate bg-blue-50 text-blue-700">
                              {char.skill}
                            </div>
                            
                            {/* Selection indicator */}
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                ✓
                              </div>
                            )}
                            
                            {/* Fighter number indicator for selected characters */}
                            {isSelected && (
                              <div className="absolute top-1 left-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
                                {selectedFighters.findIndex(f => f.id === char.id) + 1}
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </motion.div>

             
            </>
          )}

          {/* Game Canvas and Stats Editor Side by Side for Playing/Paused/Ended States */}
          {(gameState === 'playing' || gameState === 'paused' || gameState === 'ended') && (
            <div className="flex gap-4 min-h-0 flex-1">
              {/* Game Canvas - Left Side (responsive size) */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="bg-white rounded-xl shadow-sm border flex flex-col mb-8">
                  <div className="py-2 px-3 border-b flex-shrink-0">
                    {/* Battle Header with Fighter Info */}
                    <div className="flex items-center justify-between mb-2">
                      {selectedFighters.length >= 2 ? (
                        <>
                          {/* Fighter 1 */}
                          <div className={`flex items-center gap-3 flex-1 p-2 rounded-lg transition-all duration-500 ${
                            winner === `bot_${selectedFighters[0].id}` 
                              ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400 shadow-lg' 
                              : winner && winner !== `bot_${selectedFighters[0].id}` 
                                ? 'opacity-50 grayscale' 
                                : ''
                          }`}>
                            <div className={`text-2xl ${winner === `bot_${selectedFighters[0].id}` ? 'animate-bounce' : ''}`}>
                              {selectedFighters[0].icon}
                              {winner === `bot_${selectedFighters[0].id}` && <span className="ml-1">👑</span>}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div 
                                  className={`w-3 h-3 rounded-full border border-white shadow-sm ${
                                    winner === `bot_${selectedFighters[0].id}` ? 'ring-2 ring-yellow-400 ring-offset-1' : ''
                                  }`}
                                  style={{ backgroundColor: characterColors[selectedFighters[0].id] }}
                                ></div>
                                <span className={`font-bold text-gray-900 ${
                                  winner === `bot_${selectedFighters[0].id}` ? 'text-yellow-800' : ''
                                }`}>
                                  {selectedFighters[0].name}
                                  {winner === `bot_${selectedFighters[0].id}` && <span className="ml-2 text-yellow-600 font-bold">WINNER!</span>}
                                </span>
                              </div>
                              {/* Health Bar for Fighter 1 */}
                              <div className={`w-full bg-gray-200 rounded-full h-2 ${
                                winner === `bot_${selectedFighters[0].id}` ? 'bg-yellow-200' : ''
                              }`}>
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    winner === `bot_${selectedFighters[0].id}` ? 'shadow-md' : ''
                                  }`}
                                  style={{ 
                                    backgroundColor: winner === `bot_${selectedFighters[0].id}` 
                                      ? '#fbbf24' // Golden color for winner
                                      : characterColors[selectedFighters[0].id],
                                    width: `${Math.max(0, (realTimeHealths[`bot_${selectedFighters[0].id}`] || selectedFighters[0].stats.health * globalHealthMultiplier) / (selectedFighters[0].stats.health * globalHealthMultiplier) * 100)}%`
                                  }}
                                ></div>
                              </div>
                              <div className={`text-xs mt-1 ${
                                winner === `bot_${selectedFighters[0].id}` ? 'text-yellow-700 font-bold' : 'text-gray-600'
                              }`}>
                                {Math.round(realTimeHealths[`bot_${selectedFighters[0].id}`] || selectedFighters[0].stats.health * globalHealthMultiplier)}/{Math.round(selectedFighters[0].stats.health * globalHealthMultiplier)} HP
                              </div>
                            </div>
                          </div>
                          
                          {/* VS Badge */}
                          <div className="px-4">
                            <div className={`font-bold text-sm px-3 py-1 rounded-full shadow-lg transition-all duration-500 ${
                              winner 
                                ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 animate-pulse' 
                                : 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                            }`}>
                              {winner ? 'FIGHT OVER' : 'VS'}
                            </div>
                          </div>
                          
                          {/* Fighter 2 */}
                          <div className={`flex items-center gap-3 flex-1 flex-row-reverse p-2 rounded-lg transition-all duration-500 ${
                            winner === `bot_${selectedFighters[1].id}` 
                              ? 'bg-gradient-to-l from-yellow-100 to-amber-100 border-2 border-yellow-400 shadow-lg' 
                              : winner && winner !== `bot_${selectedFighters[1].id}` 
                                ? 'opacity-50 grayscale' 
                                : ''
                          }`}>
                            <div className={`text-2xl ${winner === `bot_${selectedFighters[1].id}` ? 'animate-bounce' : ''}`}>
                              {winner === `bot_${selectedFighters[1].id}` && <span className="mr-1">👑</span>}
                              {selectedFighters[1].icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 justify-end">
                                <span className={`font-bold text-gray-900 ${
                                  winner === `bot_${selectedFighters[1].id}` ? 'text-yellow-800' : ''
                                }`}>
                                  {winner === `bot_${selectedFighters[1].id}` && <span className="mr-2 text-yellow-600 font-bold">WINNER!</span>}
                                  {selectedFighters[1].name}
                                </span>
                                <div 
                                  className={`w-3 h-3 rounded-full border border-white shadow-sm ${
                                    winner === `bot_${selectedFighters[1].id}` ? 'ring-2 ring-yellow-400 ring-offset-1' : ''
                                  }`}
                                  style={{ backgroundColor: characterColors[selectedFighters[1].id] }}
                                ></div>
                              </div>
                              {/* Health Bar for Fighter 2 - Right aligned */}
                              <div className={`w-full bg-gray-200 rounded-full h-2 relative ${
                                winner === `bot_${selectedFighters[1].id}` ? 'bg-yellow-200' : ''
                              }`}>
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 absolute right-0 ${
                                    winner === `bot_${selectedFighters[1].id}` ? 'shadow-md' : ''
                                  }`}
                                  style={{ 
                                    backgroundColor: winner === `bot_${selectedFighters[1].id}` 
                                      ? '#fbbf24' // Golden color for winner
                                      : characterColors[selectedFighters[1].id],
                                    width: `${Math.max(0, (realTimeHealths[`bot_${selectedFighters[1].id}`] || selectedFighters[1].stats.health * globalHealthMultiplier) / (selectedFighters[1].stats.health * globalHealthMultiplier) * 100)}%`
                                  }}
                                ></div>
                              </div>
                              <div className={`text-xs mt-1 text-right ${
                                winner === `bot_${selectedFighters[1].id}` ? 'text-yellow-700 font-bold' : 'text-gray-600'
                              }`}>
                                {Math.round(realTimeHealths[`bot_${selectedFighters[1].id}`] || selectedFighters[1].stats.health * globalHealthMultiplier)}/{Math.round(selectedFighters[1].stats.health * globalHealthMultiplier)} HP
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Fallback when not enough fighters selected */
                        <div className="flex items-center justify-center w-full p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <div className="text-center">
                            <div className="text-2xl mb-2">⚔️</div>
                            <div className="text-gray-600 font-medium">Select 2 fighters to begin battle</div>
                            <div className="text-sm text-gray-500 mt-1">
                              Choose your warriors from the character list above
                            </div>
                          </div>
                        </div>
                      )}
                      
                    </div>
          
                  </div>
                  <div className="flex-1 flex items-center justify-center relative p-4">
                      <div className="w-full h-full box-border">
                      <GameCanvas
                        width={arenaSize.width}
                        height={arenaSize.height}
                        className="w-full h-full"
                        playerId={undefined}
                        onGameStateChange={() => {}}
                        theme={arenaTheme}
                        paused={paused}
                        onPauseChange={(p) => {
                          setPaused(p)
                          if (p) pauseGame()
                          else resumeGame()
                        }}
                      />
                    </div>

                    {/* Enhanced Game Over Overlay - Tekken Style */}
                    {gameState === 'ended' && (
                      <motion.div
                        className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-xl p-6 text-center max-w-md mx-4 border-4 border-yellow-300 shadow-2xl relative overflow-hidden">
                          {/* Animated background effects */}
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-500/20 to-red-600/20 animate-pulse"></div>
                          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 animate-pulse"></div>
                          
                          <div className="relative z-10">
                            {/* Winner Character Display */}
                            <div className="mb-4">
                              {(() => {
                                const winnerChar = editingStats.find(f => `bot_${f.id}` === winner)
                                return winnerChar ? (
                                  <div className="text-center">
                                    <div className="text-8xl mb-2 animate-bounce">{winnerChar.icon}</div>
                                    <div className="text-yellow-300 font-bold text-lg mb-1">{winnerChar.name}</div>
                                    <div className="text-yellow-100 text-sm bg-black bg-opacity-30 rounded px-2 py-1 inline-block">
                                      {winnerChar.skill}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-6xl mb-3 animate-bounce">👑</div>
                                )
                              })()}
                            </div>
                            
                            <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">VICTORY!</h2>
                            <div className="bg-black bg-opacity-50 rounded-lg p-3 mb-3">
                              <p className="text-white text-sm mb-2">
                                <strong className="text-yellow-300 text-xl">{battleResult}</strong> 
                              </p>
                              <p className="text-yellow-100 text-sm">
                                DOMINATED THE ARENA IN <strong className="text-yellow-300">{formatTime(gameStats.time)}</strong>!
                              </p>
                            </div>
                            
                            <div className="flex gap-3 justify-center">
                              <button
                                onClick={handleRestart}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
                              >
                                <RotateCcw className="w-5 h-5" />
                                REMATCH
                              </button>
                              <button 
                                onClick={() => router.push('/')} 
                                className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
                              >
                                <Home className="w-5 h-5" />
                                HOME
                              </button>
                            </div>
                          </div>
                          
                          {/* Corner decorations */}
                          <div className="absolute top-2 left-2 text-yellow-300 text-2xl animate-ping">⚡</div>
                          <div className="absolute top-2 right-2 text-yellow-300 text-2xl animate-ping" style={{animationDelay: '0.5s'}}>⚡</div>
                          <div className="absolute bottom-2 left-2 text-yellow-300 text-2xl animate-ping" style={{animationDelay: '1s'}}>⚡</div>
                          <div className="absolute bottom-2 right-2 text-yellow-300 text-2xl animate-ping" style={{animationDelay: '1.5s'}}>⚡</div>
                        </div>
                      </motion.div>
                    )}

                    {/* Enhanced Pause Overlay - Tekken Style */}
                    {gameState === 'paused' && (
                      <motion.div
                        className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="bg-gradient-to-br from-blue-600 via-purple-700 to-red-600 rounded-xl p-6 text-center border-4 border-blue-300 shadow-2xl relative overflow-hidden">
                          {/* Animated background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-red-500/20 animate-pulse"></div>
                          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 animate-pulse"></div>
                          
                          <div className="relative z-10">
                            <div className="text-6xl mb-3 animate-pulse">⚔️</div>
                            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">FIGHTERS READY</h2>
                            <div className="bg-black bg-opacity-50 rounded-lg p-3 mb-3">
                              <p className="text-blue-100 mb-2">
                                The arena awaits your command!
                              </p>
                              <p className="text-white text-sm">
                                Customize fighter stats on the right panel, then unleash the battle!
                              </p>
                            </div>
                            
                            {/* Battle preview */}
                            <div className="flex justify-center items-center gap-3 mb-3">
                              {selectedFighters[0] && (
                                <div className="text-center">
                                  <div className="text-2xl">{selectedFighters[0].icon}</div>
                                  <div className="text-white text-xs">{selectedFighters[0].name}</div>
                                </div>
                              )}
                              <div className="text-yellow-400 font-bold text-lg animate-pulse">VS</div>
                              {selectedFighters[1] && (
                                <div className="text-center">
                                  <div className="text-2xl">{selectedFighters[1].icon}</div>
                                  <div className="text-white text-xs">{selectedFighters[1].name}</div>
                                </div>
                              )}
                            </div>
                            
                              <button
                              onClick={handleResumeGame}
                              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 mx-auto transition-all duration-300 transform hover:scale-105 shadow-lg text-base"
                            >
                              <Play className="w-5 h-5" />
                              START BATTLE
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Toggle Button - Positioned between arena and settings */}
              <div className="flex items-center justify-center">
                <button
                  onClick={() => setShowBattleSettings(!showBattleSettings)}
                  className="bg-white border border-gray-300 hover:border-gray-400 rounded-lg p-2 shadow-sm transition-all duration-300 hover:shadow-md"
                  title={showBattleSettings ? 'Hide Settings' : 'Show Settings'}
                >
                  <motion.div
                    animate={{ rotate: showBattleSettings ? 0 : 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </motion.div>
                </button>
              </div>

              {/* Stats Editor - Right Side (fixed width) - minimalist */}
              {showBattleSettings && (
                <motion.div 
                  className="w-56 flex-shrink-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-white rounded-lg shadow-sm border p-3 h-full flex flex-col">
                    {/* Quick Actions */}
                    <div className="flex gap-1 mb-3">
                      {/* Pause/Resume control in Arena Settings */}
                      <button
                        onClick={() => {
                          if (gameState === 'playing') {
                            handlePauseGame()
                          } else {
                            handleResumeGame()
                          }
                        }}
                        className={`px-3 py-1 rounded text-xs flex items-center gap-1 ${gameState === 'playing' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'}`}
                      >
                        {gameState === 'playing' ? (
                          <Pause className="w-3 h-3" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        {gameState === 'playing' ? 'Pause' : (gameState === 'paused' ? 'Resume' : 'Start')}
                      </button>

                      {(gameState === 'ended' || gameState === 'paused') && (
                        <button
                          onClick={handleRestart}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset
                        </button>
                      )}
                    </div>
                      
                    {/* Global Health */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-gray-700">Health</label>
                        <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                          {globalHealthMultiplier.toFixed(1)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.1"
                        value={globalHealthMultiplier}
                        onChange={(e) => setGlobalHealthMultiplier(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    {/* Arena Theme */}
                    <div className="mb-3">
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Theme</label>
                      <select
                        value={arenaTheme}
                        onChange={(e) => setArenaTheme(e.target.value as any)}
                        className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded bg-white text-gray-700 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="dark">🌙 Dark</option>
                        <option value="light">☀️ Light</option>
                        <option value="sunset">🌅 Sunset</option>
                        <option value="ocean">🌊 Ocean</option>
                        <option value="forest">🌲 Forest</option>
                      </select>
                    </div>

                    {/* Fighter Stats */}
                    <div className="flex-1 overflow-hidden">
                      <h3 className="text-xs font-medium text-gray-700 mb-2">Stats</h3>
                      <div className="space-y-2 h-full overflow-y-auto">
                        {editingStats.map((fighter) => (
                          <div key={fighter.id} className="border border-gray-200 rounded p-2 bg-gray-50">
                            {/* Fighter Header */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm">{fighter.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-900 flex items-center gap-1 truncate">
                                  <div 
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: characterColors[fighter.id] }}
                                  ></div>
                                  <span className="truncate">{fighter.name}</span>
                                </div>
                              </div>
                            </div>

                            {/* Stats - Horizontal sliders */}
                            <div className="space-y-1">
                              {/* Health */}
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-red-700 w-6">HP</label>
                                <input
                                  type="range"
                                  min="50"
                                  max="200"
                                  value={fighter.stats.health}
                                  onChange={(e) => updateFighterStat(fighter.id, 'health', parseInt(e.target.value))}
                                  className="flex-1 h-1 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                                />
                                <span className="text-xs font-medium text-red-700 w-8 text-right">
                                  {Math.round(fighter.stats.health * globalHealthMultiplier)}
                                </span>
                              </div>

                              {/* Attack */}
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-orange-700 w-6">ATK</label>
                                <input
                                  type="range"
                                  min="30"
                                  max="120"
                                  value={fighter.stats.attack}
                                  onChange={(e) => updateFighterStat(fighter.id, 'attack', parseInt(e.target.value))}
                                  className="flex-1 h-1 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                />
                                <span className="text-xs font-medium text-orange-700 w-8 text-right">
                                  {fighter.stats.attack}
                                </span>
                              </div>

                              {/* Defense */}
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-blue-700 w-6">DEF</label>
                                <input
                                  type="range"
                                  min="20"
                                  max="120"
                                  value={fighter.stats.defense}
                                  onChange={(e) => updateFighterStat(fighter.id, 'defense', parseInt(e.target.value))}
                                  className="flex-1 h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <span className="text-xs font-medium text-blue-700 w-8 text-right">
                                  {fighter.stats.defense}
                                </span>
                              </div>

                              {/* Speed */}
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-green-700 w-6">SPD</label>
                                <input
                                  type="range"
                                  min="20"
                                  max="120"
                                  value={fighter.stats.speed}
                                  onChange={(e) => updateFighterStat(fighter.id, 'speed', parseInt(e.target.value))}
                                  className="flex-1 h-1 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                                />
                                <span className="text-xs font-medium text-green-700 w-8 text-right">
                                  {fighter.stats.speed}
                                </span>
                              </div>

                              {/* Range */}
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-purple-700 w-6">RNG</label>
                                <input
                                  type="range"
                                  min="200"
                                  max="600"
                                  value={fighter.stats.range}
                                  onChange={(e) => updateFighterStat(fighter.id, 'range', parseInt(e.target.value))}
                                  className="flex-1 h-1 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                                <span className="text-xs font-medium text-purple-700 w-8 text-right">
                                  {fighter.stats.range}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Battle Info */}
          {gameState === 'playing' && (
            <div className="mt-4 bg-white rounded-lg p-4 text-center text-sm text-gray-600 flex-shrink-0">
              <p><strong>Tekken-Style Duel in Progress:</strong> Epic 1v1 battle • No player input needed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
