'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { 
  createPhysicsWorld, 
  createCircleEntity, 
  simulateStep, 
  CircleEntity, 
  PhysicsWorld, 
  Vector 
} from '@/lib/physics'
import { Character } from '@/data/characters'
import { weapons } from '@/data/weapons'

interface AutoBattleCanvasProps {
  width?: number
  height?: number
  className?: string
  player1Character: Character
  player2Character: Character
  onBattleEnd: (winner: 'player1' | 'player2' | 'draw') => void
}

export default function AutoBattleCanvas({ 
  width = 800, 
  height = 600, 
  className = '',
  player1Character,
  player2Character,
  onBattleEnd
}: AutoBattleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width, height })
  const [world, setWorld] = useState<PhysicsWorld | null>(null)
  const [battleStarted, setBattleStarted] = useState(false)
  const [battleStats, setBattleStats] = useState({
    player1Health: 100,
    player2Health: 100,
    battleTime: 0
  })
  
  const animationRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)
  
  // Initialize world and fighters
  useEffect(() => {
    const newWorld = createPhysicsWorld(width, height)
    
    // Add weapons reference to world for AI
    ;(newWorld as any).weapons = weapons
    
    // Create player 1 (left side)
    const player1 = createCircleEntity(
      'player1',
      width * 0.25,
      height * 0.5,
      25,
      'player'
    )
    player1.weaponId = player1Character.weaponId
    player1.energy = 100
    player1.maxEnergy = 100
    player1.weaponCooldowns = new Map()
    player1.lastAttackTime = 0
    
    // Create player 2 (right side) - AI controlled
    const player2 = createCircleEntity(
      'ai_player2',
      width * 0.75,
      height * 0.5,
      25,
      'player'
    )
    player2.weaponId = player2Character.weaponId
    player2.energy = 100
    player2.maxEnergy = 100
    player2.weaponCooldowns = new Map()
    player2.lastAttackTime = 0
    
    newWorld.entities.set('player1', player1)
    newWorld.entities.set('ai_player2', player2)
    
    setWorld(newWorld)
    setBattleStarted(true)
  }, [width, height, player1Character, player2Character])
  
  // Handle responsive canvas sizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const container = containerRef.current
        const containerWidth = container.clientWidth
        const aspectRatio = height / width
        const newWidth = Math.min(containerWidth, width)
        const newHeight = newWidth * aspectRatio
        
        setCanvasSize({ width: newWidth, height: newHeight })
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [width, height])
  
  // Check for battle end condition
  const checkBattleEnd = useCallback((currentWorld: PhysicsWorld) => {
    const player1 = currentWorld.entities.get('player1')
    const player2 = currentWorld.entities.get('ai_player2')
    
    if (!player1 || !player2) return
    
    setBattleStats(prev => ({
      ...prev,
      player1Health: Math.max(0, player1.health),
      player2Health: Math.max(0, player2.health),
      battleTime: prev.battleTime + 1/60
    }))
    
    if (player1.health <= 0 && player2.health <= 0) {
      onBattleEnd('draw')
      return true
    } else if (player1.health <= 0) {
      onBattleEnd('player2')
      return true
    } else if (player2.health <= 0) {
      onBattleEnd('player1')
      return true
    }
    
    // Timeout after 2 minutes
    if (battleStats.battleTime > 120) {
      const winner = player1.health > player2.health ? 'player1' : 
                    player2.health > player1.health ? 'player2' : 'draw'
      onBattleEnd(winner)
      return true
    }
    
    return false
  }, [onBattleEnd, battleStats.battleTime])
  
  // Render function
  const render = useCallback((ctx: CanvasRenderingContext2D, currentWorld: PhysicsWorld) => {
    const scaleX = canvasSize.width / width
    const scaleY = canvasSize.height / height
    
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height)
    
    // Draw arena background
    ctx.fillStyle = '#0f1419'
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)
    
    // Draw arena grid
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 1
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x * scaleX, 0)
      ctx.lineTo(x * scaleX, canvasSize.height)
      ctx.stroke()
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y * scaleY)
      ctx.lineTo(canvasSize.width, y * scaleY)
      ctx.stroke()
    }
    
    // Draw arena border
    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 3
    ctx.strokeRect(0, 0, canvasSize.width, canvasSize.height)
    
    // Draw entities
    for (const [id, entity] of currentWorld.entities) {
      const x = entity.position.x * scaleX
      const y = entity.position.y * scaleY
      const radius = entity.radius * Math.min(scaleX, scaleY)
      
      ctx.save()
      
      if (entity.type === 'player') {
        // Player circle
        if (id === 'player1') {
          ctx.fillStyle = '#3b82f6' // Blue for player 1
        } else {
          ctx.fillStyle = '#ef4444' // Red for player 2
        }
        
        // Invulnerability effect
        if (entity.invulnerableUntil && Date.now() < entity.invulnerableUntil) {
          ctx.globalAlpha = 0.5
        }
        
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
        
        // Health bar
        const healthRatio = entity.health / entity.maxHealth
        const barWidth = 60 * Math.min(scaleX, scaleY)
        const barHeight = 6 * Math.min(scaleX, scaleY)
        
        ctx.fillStyle = '#1f2937'
        ctx.fillRect(x - barWidth/2, y - radius - 20, barWidth, barHeight)
        
        ctx.fillStyle = healthRatio > 0.5 ? '#10b981' : healthRatio > 0.25 ? '#f59e0b' : '#ef4444'
        ctx.fillRect(x - barWidth/2, y - radius - 20, barWidth * healthRatio, barHeight)
        
        // Energy bar
        const energyRatio = (entity.energy || 0) / (entity.maxEnergy || 100)
        ctx.fillStyle = '#1f2937'
        ctx.fillRect(x - barWidth/2, y - radius - 12, barWidth, 3)
        
        ctx.fillStyle = '#3b82f6'
        ctx.fillRect(x - barWidth/2, y - radius - 12, barWidth * energyRatio, 3)
        
        // Player name
        ctx.fillStyle = '#ffffff'
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'
        const character = id === 'player1' ? player1Character : player2Character
        ctx.fillText(character.name, x, y + radius + 15)
        
      } else if (entity.type === 'projectile') {
        // Projectile
        ctx.fillStyle = '#fbbf24'
        
        // Glow effect for projectiles
        ctx.shadowColor = '#fbbf24'
        ctx.shadowBlur = 10
        
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
        
        // Trail effect
        const trail = Vector.multiply(Vector.normalize(entity.velocity), -radius * 2)
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + trail.x, y + trail.y)
        ctx.stroke()
      }
      
      ctx.restore()
    }
  }, [canvasSize, width, height, player1Character, player2Character])
  
  // Animation loop
  useEffect(() => {
    if (!world || !battleStarted) return
    
    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime
      
      const deltaTime = (currentTime - lastTimeRef.current) / 1000
      lastTimeRef.current = currentTime
      
      // Update physics
      simulateStep(world, deltaTime)
      
      // Check battle end
      if (checkBattleEnd(world)) {
        return // Stop animation
      }
      
      // Render
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (canvas && ctx) {
        render(ctx, world)
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [world, battleStarted, render, checkBattleEnd])
  
  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-4 text-white">
        <div className="text-center">
          <div className="text-2xl mb-1">{getCharacterIcon(player1Character)}</div>
          <div className="text-sm">{player1Character.name}</div>
          <div className="text-xs text-blue-400">
            HP: {Math.max(0, Math.round(battleStats.player1Health))}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold">⚔️ BATTLE ⚔️</div>
          <div className="text-sm text-gray-400">
            {Math.round(battleStats.battleTime)}s
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl mb-1">{getCharacterIcon(player2Character)}</div>
          <div className="text-sm">{player2Character.name}</div>
          <div className="text-xs text-red-400">
            HP: {Math.max(0, Math.round(battleStats.player2Health))}
          </div>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="border-2 border-purple-500 rounded-lg bg-gray-900 w-full"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  )
}

function getCharacterIcon(character: Character): string {
  // Extract first emoji/symbol from SVG or use name's first letter
  const match = character.spriteSvg.match(/>\s*([🔥⚡❄️🌟💀⭐])/);
  return match ? match[1] : character.name.charAt(0);
}
