'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Hero from '../components/Hero'
import ModeCard from '../components/ModeCard'
import { Shield, Star, Zap, Target } from 'lucide-react'

interface GameMode {
  id: string
  name: string
  description: string
  duration: string
  icon: string
}

interface Character {
  id: string
  name: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  stats: {
    health: number
    attack: number
    defense: number
    speed: number
  }
}

export default function HomePage() {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  
  const gameModes: GameMode[] = [
    {
      id: 'quickplay',
      name: 'Quick Play',
      description: 'Jump into instant AI battles, perfect for quick sessions',
      duration: '1-2 min',
      icon: '⚡'
    },
    {
      id: 'roulette',
      name: 'Roulette',
      description: 'Random 1v1 battles with mystery opponents and weapons',
      duration: '2-3 min',
      icon: '🎯'
    },
    {
      id: 'battle-royale',
      name: 'Battle Royale',
      description: 'Last circle standing wins in this intense survival mode',
      duration: '5-8 min',
      icon: '�'
    },
    {
      id: 'custom',
      name: 'Custom',
      description: 'Create your own battle scenarios and rules',
      duration: 'Variable',
      icon: '⚔️'
    }
  ]

  const featuredCharacters: Character[] = [
    {
      id: 'vortex',
      name: 'Plasma Vortex',
      icon: '🌀',
      rarity: 'legendary',
      stats: { health: 95, attack: 88, defense: 72, speed: 85 }
    },
    {
      id: 'guardian',
      name: 'Steel Guardian',
      icon: '🛡️',
      rarity: 'epic',
      stats: { health: 90, attack: 65, defense: 95, speed: 50 }
    },
    {
      id: 'striker',
      name: 'Lightning Striker',
      icon: '⚡',
      rarity: 'rare',
      stats: { health: 70, attack: 92, defense: 45, speed: 93 }
    },
    {
      id: 'mystic',
      name: 'Mystic Orb',
      icon: '🔮',
      rarity: 'epic',
      stats: { health: 75, attack: 78, defense: 68, speed: 79 }
    }
  ]

  const handleModeSelect = (mode: GameMode) => {
    console.log('Mode selected:', mode.id)
  }

  const openCharacterModal = (character: Character) => {
    setSelectedCharacter(character)
  }

  const closeCharacterModal = () => {
    setSelectedCharacter(null)
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-500 border-yellow-200 bg-yellow-50'
      case 'epic': return 'text-purple-500 border-purple-200 bg-purple-50'
      case 'rare': return 'text-blue-500 border-blue-200 bg-blue-50'
      default: return 'text-gray-500 border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <Hero />
      
      {/* Game Modes Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Choose Your <span className="gaming-title">Battle Mode</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each mode offers a unique experience. Pick your style and jump into the action!
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {gameModes.map((mode, index) => (
              <ModeCard 
                key={mode.id} 
                mode={mode} 
                onSelect={handleModeSelect}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why <span className="gaming-title">Circlash?</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience fast-paced circle battles with cutting-edge gameplay features
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Instant Play",
                description: "No downloads or registration required. Jump straight into the action!"
              },
              {
                icon: <Target className="w-8 h-8" />,
                title: "Precise Physics",
                description: "Advanced physics engine for realistic circle combat and movement"
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Smart AI",
                description: "Challenging AI opponents that adapt to your playstyle"
              },
              {
                icon: <Star className="w-8 h-8" />,
                title: "Multiple Modes",
                description: "From quick battles to epic battle royales, something for everyone"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="card text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 
                              rounded-full mb-4 text-primary-600">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Character Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Characters</h2>
            <p className="text-lg text-gray-600">
              Discover unique characters with special abilities and stats
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {featuredCharacters.map((character, index) => (
              <motion.button
                key={character.id}
                onClick={() => openCharacterModal(character)}
                className={`
                  group relative border-2 rounded-xl p-4 sm:p-6 
                  transition-all duration-200 transform hover:scale-105 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 
                  ${getRarityColor(character.rarity)}
                `}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`View ${character.name} stats`}
              >
                <div className="text-3xl sm:text-4xl mb-2">{character.icon}</div>
                <div className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">
                  {character.name}
                </div>
                <div className={`text-xs capitalize mt-1 font-medium ${
                  character.rarity === 'legendary' ? 'text-yellow-600' :
                  character.rarity === 'epic' ? 'text-purple-600' :
                  character.rarity === 'rare' ? 'text-blue-600' :
                  'text-gray-600'
                }`}>
                  {character.rarity}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Character Modal */}
      {selectedCharacter && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-4xl mb-2">{selectedCharacter.icon}</div>
                <h3 className="text-xl font-bold text-gray-900">{selectedCharacter.name}</h3>
                <span className={`text-sm capitalize font-medium ${
                  selectedCharacter.rarity === 'legendary' ? 'text-yellow-600' :
                  selectedCharacter.rarity === 'epic' ? 'text-purple-600' :
                  selectedCharacter.rarity === 'rare' ? 'text-blue-600' :
                  'text-gray-600'
                }`}>
                  {selectedCharacter.rarity}
                </span>
              </div>
              <button
                onClick={closeCharacterModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label="Close character details"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">Stats</h4>
              {Object.entries(selectedCharacter.stats).map(([stat, value]) => (
                <div key={stat} className="flex justify-between items-center">
                  <span className="text-gray-700 capitalize font-medium">{stat}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="text-gray-900 text-sm font-semibold w-8">{value}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <a 
                href="/characters"
                className="btn-primary w-full text-center inline-block"
              >
                View All Characters
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
