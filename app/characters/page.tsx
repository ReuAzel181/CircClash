'use client'

import { useState, useEffect } from 'react'
import { characters, Character } from '../../data/characters'
import CharacterCard from '../../components/CharacterCard'
import CharacterModal from '../../components/CharacterModal'

export default function CharactersPage() {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)
  const [modalCharacter, setModalCharacter] = useState<Character | null>(null)
  const [showToast, setShowToast] = useState(false)

  // Load active character from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('circlash-active-character')
    if (saved) {
      setSelectedCharacter(saved)
    }
  }, [])

  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character.id)
    localStorage.setItem('circlash-active-character', character.id)
    
    // Show toast confirmation
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleViewDetails = (character: Character) => {
    setModalCharacter(character)
  }

  const closeModal = () => {
    setModalCharacter(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Character Roster</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Choose your fighter! Each character has unique stats and abilities.
            Select your favorite to take into battle.
          </p>
        </div>

        {/* Character Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              isSelected={selectedCharacter === character.id}
              onSelect={handleSelectCharacter}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>

        {/* Stats Summary */}
        <div className="mt-16 bg-slate-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Roster Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-400 mb-2">
                {characters.length}
              </div>
              <div className="text-sm text-slate-400">Total Characters</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400 mb-2">
                {characters.filter(c => c.unlocked).length}
              </div>
              <div className="text-sm text-slate-400">Unlocked</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {characters.filter(c => c.rarity === 'legendary').length}
              </div>
              <div className="text-sm text-slate-400">Legendary</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {characters.filter(c => c.rarity === 'epic').length}
              </div>
              <div className="text-sm text-slate-400">Epic</div>
            </div>
          </div>
        </div>
      </div>

      {/* Character Modal */}
      {modalCharacter && (
        <CharacterModal
          character={modalCharacter}
          isOpen={!!modalCharacter}
          onClose={closeModal}
        />
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-primary-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Character selected!</span>
          </div>
        </div>
      )}
    </div>
  )
}
