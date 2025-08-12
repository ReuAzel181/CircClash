'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Character, characters } from '@/data/characters'
import { weapons } from '@/data/weapons'
import AutoBattleCanvas from '@/components/AutoBattleCanvas'

const RouletteWheel = ({ isSpinning, onSpinComplete }: { 
  isSpinning: boolean, 
  onSpinComplete: (character: Character) => void 
}) => {
  const wheelRef = useRef<HTMLDivElement>(null)
  const [rotation, setRotation] = useState(0)
  
  useEffect(() => {
    if (isSpinning) {
      const finalRotation = rotation + 1800 + Math.random() * 720 // 5+ full spins
      const selectedIndex = Math.floor((finalRotation % 360) / (360 / characters.length))
      
      setRotation(finalRotation)
      
      setTimeout(() => {
        onSpinComplete(characters[selectedIndex])
      }, 3000)
    }
  }, [isSpinning, rotation, onSpinComplete])
  
  return (
    <div className="flex items-center justify-center mb-8">
      <div className="relative w-80 h-80">
        {/* Wheel */}
        <div 
          ref={wheelRef}
          className={`w-full h-full rounded-full border-8 border-purple-500 relative overflow-hidden transition-transform duration-3000 ease-out`}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {characters.map((character, index) => {
            const angle = (360 / characters.length) * index
            const nextAngle = (360 / characters.length) * (index + 1)
            
            return (
              <div
                key={character.id}
                className={`absolute w-full h-full ${character.rarity === 'legendary' ? 'bg-yellow-400' : 
                  character.rarity === 'epic' ? 'bg-purple-400' : 
                  character.rarity === 'rare' ? 'bg-blue-400' : 'bg-gray-300'}`}
                style={{
                  clipPath: `polygon(50% 50%, ${50 + 40 * Math.cos(angle * Math.PI / 180)}% ${50 + 40 * Math.sin(angle * Math.PI / 180)}%, ${50 + 40 * Math.cos(nextAngle * Math.PI / 180)}% ${50 + 40 * Math.sin(nextAngle * Math.PI / 180)}%)`
                }}
              >
                <div 
                  className="absolute text-2xl font-bold text-center"
                  style={{
                    top: '40%',
                    left: '55%',
                    transform: `rotate(${angle + (360 / characters.length) / 2}deg)`
                  }}
                >
                  {getCharacterIcon(character)}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-purple-600"></div>
        </div>
      </div>
    </div>
  )
}

function getCharacterIcon(character: Character): string {
  // Extract first emoji/symbol from SVG or use name's first letter
  const match = character.spriteSvg.match(/>\s*([🔥⚡❄️🌟💀⭐])/);
  return match ? match[1] : character.name.charAt(0);
}

export default function RoulettePage() {
  const router = useRouter()
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [opponentCharacter, setOpponentCharacter] = useState<Character | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [gamePhase, setGamePhase] = useState<'spinning' | 'character-select' | 'battle' | 'results'>('spinning')
  const [matchScore, setMatchScore] = useState({ player: 0, opponent: 0 })
  const [currentRound, setCurrentRound] = useState(1)
  const [lastWinner, setLastWinner] = useState<'player1' | 'player2' | 'draw' | null>(null)
  
  const handleSpin = () => {
    if (isSpinning) return
    setIsSpinning(true)
  }
  
  const handleSpinComplete = (character: Character) => {
    setSelectedCharacter(character)
    
    // Also select a random opponent
    const availableOpponents = characters.filter(c => c.id !== character.id)
    const randomOpponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)]
    setOpponentCharacter(randomOpponent)
    
    setIsSpinning(false)
    setGamePhase('character-select')
  }
  
  const startBattle = () => {
    if (!selectedCharacter || !opponentCharacter) return
    setGamePhase('battle')
  }
  
  const handleBattleEnd = (winner: 'player1' | 'player2' | 'draw') => {
    setLastWinner(winner)
    
    // Update score
    const newScore = { ...matchScore }
    if (winner === 'player1') {
      newScore.player++
    } else if (winner === 'player2') {
      newScore.opponent++
    }
    setMatchScore(newScore)
    
    // Check if someone won best of 3
    if (newScore.player >= 2 || newScore.opponent >= 2) {
      setGamePhase('results')
    } else {
      // Next round
      setCurrentRound(prev => prev + 1)
      setTimeout(() => {
        // Auto-start next round after 3 seconds
        setGamePhase('battle')
      }, 3000)
    }
  }
  
  const resetGame = () => {
    setSelectedCharacter(null)
    setOpponentCharacter(null)
    setGamePhase('spinning')
    setMatchScore({ player: 0, opponent: 0 })
    setCurrentRound(1)
    setLastWinner(null)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            🎰 Auto-Battle Roulette
          </h1>
          <p className="text-xl text-blue-300">
            Spin the wheel to get your character, then watch them fight automatically like Tekken!
          </p>
        </div>
        
        {/* Game Phases */}
        {gamePhase === 'spinning' && (
          <div className="text-center">
            <RouletteWheel 
              isSpinning={isSpinning} 
              onSpinComplete={handleSpinComplete}
            />
            
            <button
              onClick={handleSpin}
              disabled={isSpinning}
              className={`px-8 py-4 text-xl font-bold rounded-lg transition-all duration-300 ${
                isSpinning 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-105'
              }`}
            >
              {isSpinning ? 'Spinning...' : '🎲 SPIN THE WHEEL'}
            </button>
          </div>
        )}
        
        {gamePhase === 'character-select' && selectedCharacter && (
          <div className="text-center">
            <div className="bg-black/50 rounded-lg p-8 max-w-md mx-auto mb-8">
              <h2 className="text-2xl font-bold mb-4">Your Character:</h2>
              <div className="text-6xl mb-4">{getCharacterIcon(selectedCharacter)}</div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">{selectedCharacter.name}</h3>
              <p className="text-blue-300 mb-4">{selectedCharacter.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-red-400">⚡ Speed:</span> {selectedCharacter.stats.speed}
                </div>
                <div>
                  <span className="text-blue-400">� Damage:</span> {selectedCharacter.stats.damage}
                </div>
                <div>
                  <span className="text-yellow-400">🛡️ Defense:</span> {selectedCharacter.stats.defense}
                </div>
                <div>
                  <span className="text-purple-400">⭐ Rarity:</span> {selectedCharacter.rarity}
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="text-lg font-bold mb-2">Weapon:</h4>
                <div className="text-sm">
                  {weapons.find(w => w.id === selectedCharacter.weaponId)?.name || 'Basic Attack'}
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="text-lg font-bold mb-2">Abilities:</h4>
                <div className="text-xs space-y-1">
                  <div><strong>{selectedCharacter.abilities.primary.name}:</strong> {selectedCharacter.abilities.primary.description}</div>
                  <div><strong>{selectedCharacter.abilities.secondary.name}:</strong> {selectedCharacter.abilities.secondary.description}</div>
                </div>
              </div>
            </div>
            
            <button
              onClick={startBattle}
              className="px-8 py-4 text-xl font-bold rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300"
            >
              ⚔️ START BATTLE
            </button>
          </div>
        )}
        
        {gamePhase === 'character-select' && selectedCharacter && opponentCharacter && (
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-8">⚔️ BATTLE PREVIEW ⚔️</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
              {/* Your Character */}
              <div className="bg-blue-900/50 rounded-lg p-6 border-2 border-blue-500">
                <h3 className="text-xl font-bold mb-4 text-blue-300">Your Character</h3>
                <div className="text-6xl mb-4">{getCharacterIcon(selectedCharacter)}</div>
                <h4 className="text-lg font-bold text-yellow-400 mb-2">{selectedCharacter.name}</h4>
                <p className="text-blue-200 text-sm mb-4">{selectedCharacter.description}</p>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-blue-300">Speed:</span> {selectedCharacter.stats.speed}</div>
                  <div><span className="text-red-300">Damage:</span> {selectedCharacter.stats.damage}</div>
                  <div><span className="text-green-300">Defense:</span> {selectedCharacter.stats.defense}</div>
                  <div><span className="text-purple-300">Rarity:</span> {selectedCharacter.rarity}</div>
                </div>
              </div>
              
              {/* Opponent Character */}
              <div className="bg-red-900/50 rounded-lg p-6 border-2 border-red-500">
                <h3 className="text-xl font-bold mb-4 text-red-300">Opponent</h3>
                <div className="text-6xl mb-4">{getCharacterIcon(opponentCharacter)}</div>
                <h4 className="text-lg font-bold text-yellow-400 mb-2">{opponentCharacter.name}</h4>
                <p className="text-red-200 text-sm mb-4">{opponentCharacter.description}</p>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-blue-300">Speed:</span> {opponentCharacter.stats.speed}</div>
                  <div><span className="text-red-300">Damage:</span> {opponentCharacter.stats.damage}</div>
                  <div><span className="text-green-300">Defense:</span> {opponentCharacter.stats.defense}</div>
                  <div><span className="text-purple-300">Rarity:</span> {opponentCharacter.rarity}</div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-lg mb-2">Best of 3 Match - Round {currentRound}</p>
              <div className="flex justify-center gap-8">
                <div className="text-blue-400">You: {matchScore.player} wins</div>
                <div className="text-red-400">Opponent: {matchScore.opponent} wins</div>
              </div>
            </div>
            
            <button
              onClick={startBattle}
              className="px-8 py-4 text-xl font-bold rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300"
            >
              ⚔️ START AUTO BATTLE
            </button>
          </div>
        )}
        
        {gamePhase === 'battle' && selectedCharacter && opponentCharacter && (
          <div className="text-center">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">Round {currentRound} / 3</h2>
              <div className="flex justify-center gap-8 mt-2">
                <div className="text-blue-400">You: {matchScore.player} wins</div>
                <div className="text-red-400">Opponent: {matchScore.opponent} wins</div>
              </div>
              {lastWinner && (
                <div className="mt-2 text-lg">
                  {lastWinner === 'player1' ? '🎉 You won the last round!' : 
                   lastWinner === 'player2' ? '💀 Opponent won the last round!' : 
                   '🤝 Last round was a draw!'}
                </div>
              )}
            </div>
            
            <AutoBattleCanvas
              width={800}
              height={600}
              className="mx-auto"
              player1Character={selectedCharacter}
              player2Character={opponentCharacter}
              onBattleEnd={handleBattleEnd}
            />
            
            <div className="mt-4 text-sm text-gray-400">
              <p>🤖 Watch as your characters fight automatically!</p>
              <p>They will move, attack, and use their weapons with AI intelligence.</p>
            </div>
          </div>
        )}
        
        {gamePhase === 'results' && (
          <div className="text-center">
            <div className="bg-black/50 rounded-lg p-8 max-w-md mx-auto">
              <h2 className="text-3xl font-bold mb-4">
                {matchScore.player >= 2 ? '🎉 VICTORY!' : '💀 DEFEAT!'}
              </h2>
              <p className="text-xl mb-6">
                Final Score: {matchScore.player} - {matchScore.opponent}
              </p>
              
              <div className="mb-6">
                <p className="text-lg mb-2">Match Summary:</p>
                <div className="text-sm text-gray-300">
                  <p>Your Character: {selectedCharacter?.name}</p>
                  <p>Opponent: {opponentCharacter?.name}</p>
                  <p>Rounds Played: {currentRound - 1}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={resetGame}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all duration-300"
                >
                  🎲 Play Again
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  🏠 Back to Menu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
