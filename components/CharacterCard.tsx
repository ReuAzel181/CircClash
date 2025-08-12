'use client'

import { Character } from '../data/characters'
import clsx from 'clsx'

interface CharacterCardProps {
  character: Character
  isSelected?: boolean
  onSelect: (character: Character) => void
  onViewDetails: (character: Character) => void
}

export default function CharacterCard({ 
  character, 
  isSelected = false, 
  onSelect, 
  onViewDetails 
}: CharacterCardProps) {
  const rarityColors = {
    common: 'border-slate-600 bg-slate-800',
    rare: 'border-blue-500 bg-blue-500/10',
    epic: 'border-purple-500 bg-purple-500/10',
    legendary: 'border-yellow-500 bg-yellow-500/10'
  }

  const rarityTextColors = {
    common: 'text-slate-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400'
  }

  return (
    <div className={clsx(
      'rounded-xl p-6 border-2 transition-all duration-200 hover:scale-105 hover:shadow-xl',
      rarityColors[character.rarity],
      isSelected && 'ring-2 ring-primary-500 ring-offset-2 ring-offset-slate-900'
    )}>
      {/* Character Header */}
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">{character.spriteSvg}</div>
        <h3 className="text-lg font-bold text-white mb-1">{character.name}</h3>
        <span className={clsx('text-xs uppercase font-semibold', rarityTextColors[character.rarity])}>
          {character.rarity}
        </span>
      </div>

      {/* Weapon Icon */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 text-sm text-slate-400">
          <span>🗡️</span>
          <span>{character.weaponId.replace('-', ' ')}</span>
        </div>
      </div>

      {/* Stats Bars */}
      <div className="space-y-3 mb-6">
        {/* Speed */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-300">Speed</span>
            <span className="text-white font-semibold">{character.stats.speed}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${character.stats.speed}%` }}
            />
          </div>
        </div>

        {/* Damage */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-300">Damage</span>
            <span className="text-white font-semibold">{character.stats.damage}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${character.stats.damage}%` }}
            />
          </div>
        </div>

        {/* Defense */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-300">Defense</span>
            <span className="text-white font-semibold">{character.stats.defense}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${character.stats.defense}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => onSelect(character)}
          className={clsx(
            'w-full py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200',
            isSelected 
              ? 'bg-primary-600 text-white' 
              : 'bg-slate-700 hover:bg-primary-600 text-slate-300 hover:text-white'
          )}
          disabled={!character.unlocked}
        >
          {isSelected ? 'Selected' : 'Select'}
        </button>
        <button
          onClick={() => onViewDetails(character)}
          className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-slate-600 hover:bg-slate-500 text-white transition-all duration-200"
        >
          View Details
        </button>
      </div>

      {/* Unlock Status */}
      {!character.unlocked && (
        <div className="mt-4 text-center">
          <span className="text-xs text-slate-500">🔒 Locked</span>
        </div>
      )}
    </div>
  )
}
