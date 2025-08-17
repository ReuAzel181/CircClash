'use client'

import { Character } from '../data/characters'
import { useEffect, useRef, useCallback } from 'react'

interface CharacterModalProps {
  character: Character
  isOpen: boolean
  onClose: () => void
}

export default function CharacterModal({ character, isOpen, onClose }: CharacterModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const drawWeaponPreview = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Set canvas size
    canvas.width = 200
    canvas.height = 200

    // Draw arena background
    ctx.fillStyle = '#1e293b' // slate-800
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = '#475569' // slate-600
    ctx.lineWidth = 1
    for (let x = 0; x <= canvas.width; x += 20) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y <= canvas.height; y += 20) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Draw character circle
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = 15

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fillStyle = getCharacterColor(character.rarity)
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw weapon trajectory based on weapon type
    drawWeaponTrajectory(ctx, centerX, centerY, character.weaponId)
  }, [character])

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      drawWeaponPreview()
    }
  }, [isOpen, character, drawWeaponPreview])

  const getCharacterColor = (rarity: Character['rarity']) => {
    switch (rarity) {
      case 'legendary': return '#f59e0b' // yellow-500
      case 'epic': return '#8b5cf6' // purple-500
      case 'rare': return '#3b82f6' // blue-500
      default: return '#6b7280' // gray-500
    }
  }

  const drawWeaponTrajectory = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, 
    centerY: number, 
    weaponId: string
  ) => {
    ctx.strokeStyle = '#ef4444' // red-500
    ctx.lineWidth = 3

    switch (weaponId) {
      case 'energy-blast':
        // Draw wavy energy beam
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        for (let i = 0; i < 60; i += 5) {
          const x = centerX + i
          const y = centerY + Math.sin(i * 0.3) * 10
          ctx.lineTo(x, y)
        }
        ctx.stroke()
        break

      case 'shield-bash':
        // Draw arc in front
        ctx.beginPath()
        ctx.arc(centerX + 25, centerY, 20, Math.PI * 0.7, Math.PI * 1.3)
        ctx.stroke()
        break

      case 'lightning-bolt':
        // Draw zigzag lightning
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        const points = [
          [centerX + 20, centerY - 10],
          [centerX + 35, centerY + 15],
          [centerX + 50, centerY - 5],
          [centerX + 70, centerY + 10]
        ]
        points.forEach(([x, y]) => ctx.lineTo(x, y))
        ctx.stroke()
        break

      case 'magic-missile':
        // Draw spiraling projectile
        ctx.beginPath()
        for (let i = 0; i < 50; i++) {
          const angle = i * 0.3
          const x = centerX + i + Math.cos(angle) * 8
          const y = centerY + Math.sin(angle) * 8
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        break

      default:
        // Default straight line
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(centerX + 60, centerY)
        ctx.stroke()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{character.spriteSvg}</div>
              <div>
                <h2 className="text-2xl font-bold text-white">{character.name}</h2>
                <span className={`text-sm capitalize font-semibold ${
                  character.rarity === 'legendary' ? 'text-yellow-400' :
                  character.rarity === 'epic' ? 'text-purple-400' :
                  character.rarity === 'rare' ? 'text-blue-400' :
                  'text-slate-400'
                }`}>
                  {character.rarity}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Close character details"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                <p className="text-slate-300 leading-relaxed">{character.description}</p>
              </div>

              {/* Stats */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Combat Stats</h3>
                <div className="space-y-4">
                  {Object.entries(character.stats).map(([stat, value]) => (
                    <div key={stat}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-300 capitalize">{stat}</span>
                        <span className="text-white font-semibold">{value}/100</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-300 ${
                            stat === 'speed' ? 'bg-green-500' :
                            stat === 'damage' ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Abilities */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Abilities</h3>
                <div className="space-y-4">
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-primary-400">{character.abilities.primary.name}</h4>
                      <span className="text-xs text-slate-400">{character.abilities.primary.cooldown}s cooldown</span>
                    </div>
                    <p className="text-sm text-slate-300">{character.abilities.primary.description}</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-accent-400">{character.abilities.secondary.name}</h4>
                      <span className="text-xs text-slate-400">{character.abilities.secondary.cooldown}s cooldown</span>
                    </div>
                    <p className="text-sm text-slate-300">{character.abilities.secondary.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Weapon Info */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Weapon</h3>
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🗡️</span>
                    <span className="text-white font-semibold capitalize">
                      {character.weaponId.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Specialized weapon suited for this character&apos;s combat style.
                  </p>
                </div>
              </div>

              {/* Battle Preview */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Battle Preview</h3>
                <div className="bg-slate-700 rounded-lg p-4">
                  <canvas 
                    ref={canvasRef}
                    className="w-full border border-slate-600 rounded"
                    style={{ maxWidth: '200px', maxHeight: '200px' }}
                  />
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    Character movement and weapon trajectory preview
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-slate-700">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Close
            </button>
            <button 
              className="btn-primary flex-1"
              onClick={() => {
                // This would select the character and close modal
                onClose()
              }}
            >
              Select Character
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
