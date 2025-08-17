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
  const [arenaSize, setArenaSize] = useState({ width: 600, height: 300 })
  
  const [editingStats, setEditingStats] = useState<typeof characters>([])
  const [globalHealthMultiplier, setGlobalHealthMultiplier] = useState(1)
  const [arenaTheme, setArenaTheme] = useState<'dark' | 'light' | 'sunset' | 'ocean' | 'forest'>('dark')
  const [showBattleSettings, setShowBattleSettings] = useState(true)
  
  // Calculate optimal arena size based on screen
  useEffect(() => {
    const updateArenaSize = () => {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Reserve space for UI elements - optimized for 100% zoom
      const headerHeight = 80
      const footerHeight = 40
      const padding = 24
      const sidebarWidth = showBattleSettings ? 224 : 0 // Stats panel width (56 * 4 = 224px)
      
      // Calculate available space
      const availableWidth = Math.max(400, viewportWidth - sidebarWidth - padding * 2)
      const availableHeight = Math.max(200, viewportHeight - headerHeight - footerHeight - padding * 2)
      
      // Use optimal proportions for 100% zoom without cut edges
      const width = Math.min(availableWidth, showBattleSettings ? 800 : 1200)
      const height = Math.min(availableHeight, showBattleSettings ? 350 : 500)
      
      setArenaSize({ width, height })
    }
    
    updateArenaSize()
    window.addEventListener('resize', updateArenaSize)
    return () => window.removeEventListener('resize', updateArenaSize)
  }, [showBattleSettings])

  // Initialize editing stats with current characters when game starts
  useEffect(() => {
    if (selectedFighters.length > 0) {
      setEditingStats([...selectedFighters])
    }
  }, [selectedFighters])

  // Select two random fighters on component mount
  useEffect(() => {
    const randomFighters = characters
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
    setSelectedFighters(randomFighters)
  }, [])

  const updateFighterStat = (fighterId: string, stat: string, value: number) => {
    setEditingStats(prev => prev.map(fighter => 
      fighter.id === fighterId 
        ? { ...fighter, stats: { ...fighter.stats, [stat]: value } }
        : fighter
    ))
  }

  const shuffleFighters = () => {
    const randomFighters = characters
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
    setSelectedFighters(randomFighters)
    setEditingStats([...randomFighters])
  }

  const handleStartGame = () => {
    if (selectedFighters.length < 2) return
    
    // Stop any existing game first
    stopGame()
    
    // Create game config
    const gameConfig: GameConfig = {
      arenaWidth: arenaSize.width,
      arenaHeight: arenaSize.height,
      mode: 'battleroyale',
      maxPlayers: 2,
      enablePowerups: true,
      enableHazards: false,
      matchDuration: 300000 // 5 minutes
    }
    
    // Start new game with final stats
    const gameId = startGame(gameConfig)
    
    if (gameId) {
      // Spawn the configured fighters
      editingStats.forEach((fighter, index) => {
        // Position fighters on opposite sides
        const x = index === 0 ? arenaSize.width * 0.25 : arenaSize.width * 0.75
        const y = arenaSize.height * 0.5
        
        spawnBot(fighter.id, x, y, 'medium')
      })
      
      setGameState('playing')
      setGameStartTime(Date.now())
      setBattleResult(null)
      setGameUpdateTrigger(prev => prev + 1)
    }
  }

  const handlePauseGame = () => {
    pauseGame()
    setGameState('paused')
  }

  const handleResumeGame = () => {
    resumeGame()
    setGameState('playing')
  }

  const handleRestart = () => {
    stopGame()
    setGameState('setup')
    setWinner(null)
    setBattleResult(null)
    setRealTimeHealths({})
  }

  const handleReturnHome = () => {
    stopGame()
    router.push('/')
  }

  // Listen for game updates
  useEffect(() => {
    if (gameState !== 'playing') return

    const interval = setInterval(() => {
      const game = getCurrentGame()
      if (!game) return

      // Update real-time health data
      const healthData: Record<string, number> = {}
      game.players.forEach((player, playerId) => {
        healthData[playerId] = player.health
      })
      setRealTimeHealths(healthData)

      // Update game stats
      const currentTime = Date.now() - gameStartTime
      setGameStats({
        time: Math.floor(currentTime / 1000),
        eliminations: Array.from(game.players.values()).filter(p => p.health <= 0).length
      })

      // Check for game end
      const alivePlayers = Array.from(game.players.values()).filter(p => p.health > 0)
      if (alivePlayers.length <= 1) {
        setGameState('ended')
        if (alivePlayers.length === 1) {
          const winnerPlayer = alivePlayers[0]
          const winnerFighter = editingStats.find(f => f.id === winnerPlayer.id)
          if (winnerFighter) {
            setWinner(winnerFighter.name)
            setBattleResult(`🏆 ${winnerFighter.name} Wins!`)
          }
        } else {
          setBattleResult('💥 Draw! Both fighters eliminated!')
        }
      }
    }, 100)

    return () => clearInterval(interval)
  }, [gameState, gameStartTime, editingStats])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleReturnHome}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Home</span>
            </button>
            <div className="w-px h-6 bg-gray-300"></div>
            <h1 className="text-xl font-bold text-gray-800">Quick Play</h1>
          </div>

          <div className="flex items-center gap-3">
            {gameState === 'playing' && (
              <>
                <div className="text-sm text-gray-600">
                  ⏱️ {Math.floor(gameStats.time / 60)}:{(gameStats.time % 60).toString().padStart(2, '0')}
                </div>
                <button
                  onClick={handlePauseGame}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              </>
            )}
            
            {gameState === 'paused' && (
              <button
                onClick={handleResumeGame}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
              >
                <Play className="w-4 h-4" />
                Resume
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">AI Battle Arena</h1>
          <p className="text-gray-600">Watch epic duels between AI fighters • Customize stats and themes</p>
        </div>

        {/* Game Setup */}
        {gameState === 'setup' && (
          <div className="space-y-8">
            {/* Fighter Selection */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  Selected Fighters
                </h2>
                <button
                  onClick={shuffleFighters}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Shuffle className="w-4 h-4" />
                  Shuffle
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {selectedFighters.map((fighter, index) => (
                  <div key={fighter.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border-2 border-gray-200">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-4xl">{fighter.icon}</span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{fighter.name}</h3>
                        <p className="text-sm text-gray-600">{fighter.skill}</p>
                      </div>
                      <div 
                        className="w-4 h-4 rounded-full ml-auto flex-shrink-0"
                        style={{ backgroundColor: characterColors[fighter.id] }}
                      ></div>
                    </div>
                    
                    <div className="space-y-3">
                      {Object.entries(fighter.stats).map(([stat, value]) => (
                        <div key={stat} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 capitalize">{stat}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                                style={{ 
                                  width: `${Math.min(100, (value / (stat === 'health' ? 300 : stat === 'range' ? 500 : 120)) * 100)}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-gray-700 w-8 text-right">
                              {stat === 'health' && globalHealthMultiplier !== 1 
                                ? Math.round(value * globalHealthMultiplier)
                                : value
                              }
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={handleStartGame}
                  disabled={selectedFighters.length < 2}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-lg text-lg font-bold transition-all disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
                >
                  <Play className="w-5 h-5" />
                  Start Battle
                </button>
              </div>
            </div>

            {/* All Characters */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">All Characters</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {characters.map((char) => (
                  <div
                    key={char.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedFighters.some(f => f.id === char.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      if (selectedFighters.length < 2) {
                        const newFighters = [...selectedFighters, char]
                        setSelectedFighters(newFighters)
                        setEditingStats([...newFighters])
                      } else if (!selectedFighters.some(f => f.id === char.id)) {
                        const newFighters = [selectedFighters[1], char]
                        setSelectedFighters(newFighters)
                        setEditingStats([...newFighters])
                      }
                    }}
                  >
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <span className="text-2xl">{char.icon}</span>
                        <div 
                          className="w-3 h-3 rounded-full ml-2"
                          style={{ backgroundColor: characterColors[char.id] }}
                        ></div>
                      </div>
                      <h3 className="font-bold text-sm text-gray-800 mb-1">{char.name}</h3>
                      <p className="text-xs text-gray-600">{char.skill}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Game Playing */}
        {(gameState === 'playing' || gameState === 'paused' || gameState === 'ended') && (
          <div className="space-y-6">
            {/* Battle Status */}
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {gameState === 'ended' ? '🏁 Battle Complete!' : 
                 gameState === 'paused' ? '⏸️ Battle Paused' : 
                 '⚔️ Battle in Progress'}
              </h2>
              
              {/* Real-time fighter health */}
              <div className="flex justify-center gap-8 mb-4">
                {editingStats.map((fighter) => (
                  <div key={fighter.id} className="text-center">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{fighter.icon}</span>
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: characterColors[fighter.id] }}
                      ></div>
                      <span className="font-medium text-gray-800">{fighter.name}</span>
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-3">
                      <div 
                        className="h-3 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.max(0, ((realTimeHealths[fighter.id] || fighter.stats.health * globalHealthMultiplier) / (fighter.stats.health * globalHealthMultiplier)) * 100)}%`,
                          backgroundColor: realTimeHealths[fighter.id] > (fighter.stats.health * globalHealthMultiplier) * 0.5 
                            ? characterColors[fighter.id] 
                            : characterColors[fighter.id],
                        }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {Math.max(0, Math.round(realTimeHealths[fighter.id] || fighter.stats.health * globalHealthMultiplier))} / {Math.round(fighter.stats.health * globalHealthMultiplier)}
                    </div>
                  </div>
                ))}
              </div>

              {battleResult && (
                <div className="text-2xl font-bold text-green-600 mb-4">
                  {battleResult}
                </div>
              )}
            </div>

            {/* Arena and Settings Layout */}
            <div className="flex gap-4 items-start">
              {/* Arena - Left Side (flexible width) */}
              <div className="flex-1 bg-white rounded-lg shadow-sm p-4">
                <GameCanvas 
                  width={arenaSize.width} 
                  height={arenaSize.height}
                />
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
                      {gameState === 'paused' && (
                        <button
                          onClick={handleResumeGame}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          Start
                        </button>
                      )}
                      
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

            {/* Battle Info */}
            {gameState === 'playing' && (
              <div className="mt-4 bg-white rounded-lg p-4 text-center text-sm text-gray-600 flex-shrink-0">
                <p><strong>Tekken-Style Duel in Progress:</strong> Epic 1v1 battle • No player input needed</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
