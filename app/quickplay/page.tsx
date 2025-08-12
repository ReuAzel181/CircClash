'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, RotateCcw, Play, Pause, Shuffle, Users } from 'lucide-react'
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
    stats: { health: 95, attack: 88, defense: 72, speed: 85 },
    skill: 'Triple Shot',
    description: 'Fires 3 spinning plasma projectiles in a spread pattern'
  },
  { 
    id: 'guardian', 
    name: 'Steel Guardian', 
    icon: '🛡️', 
    stats: { health: 90, attack: 65, defense: 95, speed: 50 },
    skill: 'Heavy Cannon',
    description: 'Shoots powerful but slow projectiles that deal massive damage'
  },
  { 
    id: 'striker', 
    name: 'Lightning Striker', 
    icon: '⚡', 
    stats: { health: 70, attack: 92, defense: 45, speed: 93 },
    skill: 'Lightning Bolt',
    description: 'Ultra-fast lightning strikes with high precision'
  },
  { 
    id: 'mystic', 
    name: 'Mystic Orb', 
    icon: '🔮', 
    stats: { health: 75, attack: 78, defense: 68, speed: 79 },
    skill: 'Magic Missile',
    description: 'Mystical projectiles with slight homing capability'
  },
  { 
    id: 'flame', 
    name: 'Fire Warrior', 
    icon: '🔥', 
    stats: { health: 80, attack: 85, defense: 60, speed: 75 },
    skill: 'Fire Burst',
    description: 'Unleashes a barrage of 5 small fire projectiles'
  },
  { 
    id: 'frost', 
    name: 'Ice Knight', 
    icon: '❄️', 
    stats: { health: 85, attack: 70, defense: 85, speed: 60 },
    skill: 'Ice Blast',
    description: 'Large, slow-moving ice projectiles that freeze enemies'
  },
  { 
    id: 'shadow', 
    name: 'Shadow Assassin', 
    icon: '🥷', 
    stats: { health: 60, attack: 95, defense: 40, speed: 100 },
    skill: 'Shadow Strike',
    description: 'Rapid-fire small projectiles with incredible speed'
  },
  { 
    id: 'titan', 
    name: 'Iron Titan', 
    icon: '🤖', 
    stats: { health: 120, attack: 60, defense: 100, speed: 30 },
    skill: 'Mega Cannon',
    description: 'Devastating massive projectiles that obliterate everything'
  }
]

export default function QuickPlayPage() {
  const router = useRouter()
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'paused' | 'ended'>('setup')
  const [gameStats, setGameStats] = useState({ time: 0, eliminations: 0 })
  const [winner, setWinner] = useState<string | null>(null)
  const [selectedFighters, setSelectedFighters] = useState<typeof characters>([])
  const [gameStartTime, setGameStartTime] = useState<number>(0)
  const [battleResult, setBattleResult] = useState<string | null>(null)
  const [gameUpdateTrigger, setGameUpdateTrigger] = useState(0) // Force re-render for health updates
  
  // Initialize with 4 random fighters
  useEffect(() => {
    randomizeFighters()
  }, [])

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
      const winnerChar = selectedFighters.find(f => `bot_${f.id}` === gameWinner)
      setBattleResult(winnerChar ? winnerChar.name : 'Unknown Fighter')
    }

    window.addEventListener('gameOver', handleGameOver)
    return () => window.removeEventListener('gameOver', handleGameOver)
  }, [selectedFighters])

  const initializeGame = () => {
    const gameConfig: GameConfig = {
      arenaWidth: 1000, // Fixed wider arena
      arenaHeight: 600, // Fixed height
      mode: 'roulette',
      maxPlayers: selectedFighters.length,
      enablePowerups: false, // Disabled powerups
      enableHazards: false
    }

    startGame(gameConfig)
    
    // Spawn all selected fighters as AI bots with better spacing for larger arena
    const spawnPositions = [
      { x: 150, y: 150 },
      { x: 850, y: 150 },
      { x: 850, y: 450 },
      { x: 150, y: 450 },
      { x: 500, y: 100 },
      { x: 900, y: 300 },
      { x: 500, y: 500 },
      { x: 100, y: 300 }
    ]
    
    selectedFighters.forEach((char, index) => {
      const pos = spawnPositions[index] || { x: 500, y: 300 }
      spawnBot(`bot_${char.id}`, pos.x, pos.y, 'hard') // All bots on hard for faster gameplay
    })
  }

  const handleStartGame = () => {
    if (selectedFighters.length < 2) {
      alert('Please select at least 2 fighters!')
      return
    }
    
    initializeGame()
    resumeGame()
    setGameState('playing')
    setGameStats({ time: 0, eliminations: 0 })
    setGameStartTime(Date.now())
    setBattleResult(null)
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
    setGameStats({ time: 0, eliminations: 0 })
  }

  const randomizeFighters = () => {
    const shuffled = [...characters].sort(() => 0.5 - Math.random())
    setSelectedFighters(shuffled.slice(0, 4))
  }

  const toggleFighter = (character: typeof characters[0]) => {
    setSelectedFighters(prev => {
      const exists = prev.find(f => f.id === character.id)
      if (exists) {
        return prev.filter(f => f.id !== character.id)
      } else if (prev.length < 8) {
        return [...prev, character]
      }
      return prev
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Update timer and trigger health updates when game is playing
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setGameStats(prev => ({
          ...prev,
          time: Math.floor((Date.now() - gameStartTime) / 1000)
        }))
        // Trigger re-render to update health displays
        setGameUpdateTrigger(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gameState, gameStartTime])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/')} 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
              <div className="w-px h-6 bg-gray-300" />
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-500" />
                AI Battle Arena
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {gameState === 'playing' && (
                <>
                  <div className="text-sm text-gray-600">
                    Time: {formatTime(gameStats.time)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Fighters: {selectedFighters.length}
                  </div>
                </>
              )}
              
              {gameState === 'setup' && (
                <button
                  onClick={handleStartGame}
                  className="btn-primary flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Battle
                </button>
              )}
              
              {gameState === 'playing' && (
                <button
                  onClick={handlePauseGame}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              )}
              
              {gameState === 'paused' && (
                <button
                  onClick={handleResumeGame}
                  className="btn-primary flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
              )}
              
              {(gameState === 'ended' || gameState === 'paused') && (
                <button
                  onClick={handleRestart}
                  className="btn-secondary flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  New Battle
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Fighter Selection */}
          {gameState === 'setup' && (
            <>
              <motion.div 
                className="bg-white rounded-xl shadow-sm border p-6 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Choose Your Fighters</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={randomizeFighters}
                      className="btn-secondary flex items-center gap-2 text-sm"
                    >
                      <Shuffle className="w-4 h-4" />
                      Random
                    </button>
                    <span className="text-sm text-gray-600 px-3 py-2">
                      {selectedFighters.length}/8 selected
                    </span>
                  </div>
                </div>

                {/* Available Characters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
                  {characters.map((char) => {
                    const isSelected = selectedFighters.find(f => f.id === char.id)
                    return (
                      <button
                        key={char.id}
                        onClick={() => toggleFighter(char)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 transform scale-105' 
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:scale-105'
                        }`}
                      >
                        <div className="text-2xl mb-1">{char.icon}</div>
                        <div className="text-xs font-medium text-gray-700">{char.name}</div>
                        <div className="text-xs text-gray-500 mb-1">
                          {char.stats.health}HP • {char.stats.attack}ATK
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          {char.skill}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Selected Fighters Preview */}
                {selectedFighters.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Battle Lineup:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {selectedFighters.map((char, index) => (
                        <div key={char.id} className="flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-lg p-3">
                          <span className="text-2xl">{char.icon}</span>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{char.name}</div>
                            <div className="text-xs text-blue-600 font-medium">{char.skill}</div>
                            <div className="text-xs text-gray-600">{char.description}</div>
                          </div>
                          <button
                            onClick={() => toggleFighter(char)}
                            className="text-red-500 hover:text-red-700 text-lg font-bold px-2"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              <motion.div 
                className="bg-white rounded-xl shadow-sm border p-6 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="font-semibold text-gray-900 mb-3">How AI Battle Works:</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-1">•</span>
                    <span>All fighters are AI-controlled with unique powers and fighting styles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-1">•</span>
                    <span>Characters move fast and bounce off walls and each other dynamically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-1">•</span>
                    <span>Each character has special attacks: multi-shots, fire bursts, ice blasts, etc.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-1">•</span>
                    <span>Pure arena combat - no powerups, just skill vs skill battles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-1">•</span>
                    <span>Health shown in center of each character - watch it decrease in real-time!</span>
                  </li>
                </ul>
              </motion.div>
            </>
          )}

          {/* Game Canvas */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="h-[600px] relative">
              {gameState === 'setup' ? (
                <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="text-6xl mb-4">⚔️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready for AI Battle?</h2>
                    <p className="text-gray-600 max-w-md">
                      Select your fighters above and watch them battle it out automatically!
                    </p>
                    {selectedFighters.length >= 2 && (
                      <button
                        onClick={handleStartGame}
                        className="btn-primary text-lg px-8 py-4 flex items-center gap-3 mx-auto mt-6"
                      >
                        <Play className="w-5 h-5" />
                        Start AI Battle
                      </button>
                    )}
                  </motion.div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <GameCanvas
                    width={1000}
                    height={600}
                    playerId={undefined} // No player control - spectator mode
                    onGameStateChange={(newGameState) => {
                      // Handle game state updates if needed
                    }}
                  />
                </div>
              )}

              {/* Game Over Overlay */}
              {gameState === 'ended' && (
                <motion.div
                  className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="bg-white rounded-xl p-8 text-center max-w-md mx-4">
                    <div className="text-4xl mb-4">🏆</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Battle Complete!</h2>
                    <p className="text-gray-600 mb-4">
                      <strong>{battleResult}</strong> emerged victorious after {formatTime(gameStats.time)} of intense combat!
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleRestart}
                        className="btn-primary flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        New Battle
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
                    <div className="text-4xl mb-4">⏸️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Battle Paused</h2>
                    <button
                      onClick={handleResumeGame}
                      className="btn-primary flex items-center gap-2 mx-auto"
                    >
                      <Play className="w-4 h-4" />
                      Resume Battle
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Battle Info */}
          {gameState === 'playing' && (
            <>
              <div className="mt-4 bg-white rounded-lg p-4 text-center text-sm text-gray-600">
                <p><strong>AI Battle in Progress:</strong> {selectedFighters.length} fighters competing • No player input needed</p>
              </div>
              
              {/* Character Info Display */}
              <div className="mt-4 bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-center">Active Fighters</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {selectedFighters.map((char) => {
                    // Get current health from game entities
                    const game = getCurrentGame()
                    const entity = game?.world.entities.get(`bot_${char.id}`)
                    const currentHealth = entity?.health || 0
                    const isAlive = currentHealth > 0
                    
                    return (
                      <div 
                        key={char.id} 
                        className={`p-3 rounded-lg border transition-all ${
                          isAlive 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-red-200 bg-red-50 opacity-60'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">{char.icon}</div>
                          <div className="text-xs font-medium text-gray-900">{char.name}</div>
                          <div className={`text-xs font-bold mt-1 ${
                            isAlive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            HP: {Math.round(currentHealth)}/{char.stats.health}
                          </div>
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            {char.skill}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {char.description}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
