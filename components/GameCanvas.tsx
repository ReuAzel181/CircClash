'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { 
  getCurrentGame, 
  getGameEntities, 
  movePlayer, 
  fireProjectile, 
  updateBotAI,
  GameState
} from '../lib/game'
import { CircleEntity, Vector } from '../lib/physics'
import { getCharacterType, getCharacterConfig } from '../lib/characterConfig'

interface GameCanvasProps {
  width?: number
  height?: number
  className?: string
  playerId?: string
  onGameStateChange?: (gameState: GameState | null) => void
}

export default function GameCanvas({ 
  width = 1000, 
  height = 600, 
  className = '',
  playerId,
  onGameStateChange 
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize] = useState({ width, height }) // Fixed size, no responsive scaling
  const [scale] = useState(1) // Fixed scale of 1:1
  const [keys, setKeys] = useState<Set<string>>(new Set())
  const [mousePos, setMousePos] = useState<Vector>({ x: 0, y: 0 })
  const animationFrameRef = useRef<number>()

  // Fixed canvas sizing - no responsive behavior
  const updateCanvasSize = useCallback(() => {
    // Canvas uses fixed 1000x600 dimensions with 1:1 scale
    // No dynamic resizing needed
  }, [])

  // Initialize canvas and event listeners
  useEffect(() => {
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [updateCanvasSize])

  // Mouse position tracking for aiming
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) / scale
    const y = (event.clientY - rect.top) / scale
    
    setMousePos({ x, y })
  }, [scale])

  // Mouse click for shooting
  const handleMouseClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!playerId) return
    
    const game = getCurrentGame()
    if (!game) return
    
    const player = game.world.entities.get(playerId)
    if (!player) return
    
    const direction = Vector.subtract(mousePos, player.position)
    fireProjectile(playerId, direction)
  }, [playerId, mousePos])

  // Keyboard input handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setKeys(prev => new Set(prev).add(event.code))
    }
    
    const handleKeyUp = (event: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev)
        newKeys.delete(event.code)
        return newKeys
      })
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Handle player movement based on input
  useEffect(() => {
    if (!playerId || keys.size === 0) return
    
    const moveDirection = Vector.create()
    
    if (keys.has('KeyW') || keys.has('ArrowUp')) moveDirection.y -= 1
    if (keys.has('KeyS') || keys.has('ArrowDown')) moveDirection.y += 1
    if (keys.has('KeyA') || keys.has('ArrowLeft')) moveDirection.x -= 1
    if (keys.has('KeyD') || keys.has('ArrowRight')) moveDirection.x += 1
    
    if (moveDirection.x !== 0 || moveDirection.y !== 0) {
      movePlayer(playerId, moveDirection, 500)
    }
  }, [keys, playerId])

  // Main render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const game = getCurrentGame()
    if (!game) {
      // Draw empty arena
      ctx.fillStyle = '#f8fafc' // slate-50 for light mode
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = '#cbd5e1' // slate-300
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, canvas.width, canvas.height)
      
      ctx.fillStyle = '#64748b'
      ctx.font = '24px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('No Game Active', canvas.width / 2, canvas.height / 2)
      return
    }
    
    // Clear canvas with light background
    ctx.fillStyle = '#f8fafc' // slate-50
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw grid background
    drawGrid(ctx, canvas.width, canvas.height, scale)
    
    // Draw entities
    const entities = getGameEntities()
    entities.forEach(entity => {
      drawEntity(ctx, entity, scale, playerId)
    })
    
    // Draw UI overlays
    if (playerId) {
      drawPlayerUI(ctx, game, playerId, canvas.width, canvas.height)
    }
    
    // Draw crosshair for aiming
    if (playerId && mousePos) {
      drawCrosshair(ctx, mousePos.x * scale, mousePos.y * scale)
    }
    
    // Notify parent of game state changes
    if (onGameStateChange) {
      onGameStateChange(game)
    }
    
    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(render)
  }, [scale, playerId, mousePos, onGameStateChange])

  // Start render loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(render)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [render])

  return (
    <div 
      ref={containerRef}
      className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}
      style={{ width: '1000px', height: '600px' }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseMove={handleMouseMove}
        onClick={handleMouseClick}
        className="border border-gray-300 cursor-crosshair bg-white"
        style={{ 
          width: '1000px', 
          height: '600px',
          imageRendering: 'pixelated'
        }}
      />
      
      {/* Control instructions */}
      {playerId && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 text-gray-800 text-sm p-3 rounded-lg shadow-sm border">
          <div className="font-medium mb-1">Controls:</div>
          <div>WASD/Arrow Keys: Move</div>
          <div>Mouse: Aim & Click to Shoot</div>
        </div>
      )}
    </div>
  )
}

// Helper drawing functions
function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, scale: number): void {
  ctx.strokeStyle = '#e2e8f0' // slate-200 for light mode
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.5
  
  const gridSize = 40 * scale
  
  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  
  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  
  ctx.globalAlpha = 1
}

function drawEntity(ctx: CanvasRenderingContext2D, entity: CircleEntity, scale: number, playerId?: string): void {
  const x = entity.position.x * scale
  const y = entity.position.y * scale
  const radius = entity.radius * scale
  
  ctx.save()
  
  // Draw entity based on type
  switch (entity.type) {
    case 'player':
      // Main circle
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      
      // Color based on character type for bots, otherwise health and player status
      const isCurrentPlayer = entity.id === playerId
      const healthPercent = entity.health / entity.maxHealth
      
      if (isCurrentPlayer) {
        ctx.fillStyle = '#3b82f6' // blue-500
      } else if ((entity as any).isBot) {
        // Character-specific colors for bots (same as their bullets)
        const characterType = getCharacterType(entity.id)
        const config = getCharacterConfig(characterType)
        ctx.fillStyle = config.color
      } else {
        ctx.fillStyle = '#10b981' // green-500
      }
      
      // Dim color based on health
      ctx.globalAlpha = 0.3 + (healthPercent * 0.7)
      ctx.fill()
      
      // Border
      ctx.globalAlpha = 1
      ctx.strokeStyle = isCurrentPlayer ? '#1d4ed8' : '#374151'
      ctx.lineWidth = 2
      ctx.stroke()
      
      // Draw aiming line for bots (show where they're targeting)
      if ((entity as any).isBot) {
        // Simple straight-line targeting without prediction
        const game = getCurrentGame()
        if (game) {
          // Find what this bot is targeting
          let target: any = null
          let minDistance = Infinity
          
          for (const [id, otherEntity] of game.world.entities) {
            if (id !== entity.id && otherEntity.type === 'player' && otherEntity.health > 0) {
              const distance = Vector.distance(entity.position, otherEntity.position)
              if (distance < minDistance && distance < 400) {
                minDistance = distance
                target = otherEntity
              }
            }
          }
          
          if (target) {
            // Draw simple targeting line to current target position
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(target.position.x * scale, target.position.y * scale)
            ctx.strokeStyle = '#ef4444'
            ctx.lineWidth = 1
            ctx.globalAlpha = 0.3
            ctx.setLineDash([5, 5])
            ctx.stroke()
            ctx.setLineDash([])
            ctx.globalAlpha = 1
            
            // Draw target indicator at current position
            ctx.beginPath()
            ctx.arc(target.position.x * scale, target.position.y * scale, 8, 0, 2 * Math.PI)
            ctx.strokeStyle = '#ef4444'
            ctx.lineWidth = 2
            ctx.globalAlpha = 0.5
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }
      }
      
      // Health text in center of character
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${Math.max(12, radius * 0.4)}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Add text shadow for better readability
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 3
      ctx.strokeText(Math.round(entity.health).toString(), x, y)
      ctx.fillText(Math.round(entity.health).toString(), x, y)
      
      // Draw velocity indicator (movement direction)
      const entityVelocity = Vector.magnitude(entity.velocity)
      if (entityVelocity > 50) {
        const velocityDirection = Vector.normalize(entity.velocity)
        const arrowLength = Math.min(entityVelocity * 0.1, 30) * scale
        const arrowEnd = Vector.add(entity.position, Vector.multiply(velocityDirection, arrowLength / scale))
        
        // Movement trail
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(arrowEnd.x * scale, arrowEnd.y * scale)
        ctx.strokeStyle = isCurrentPlayer ? '#3b82f6' : '#ef4444'
        ctx.lineWidth = 3
        ctx.globalAlpha = 0.6
        ctx.stroke()
        
        // Arrow head
        const arrowHeadSize = 8
        const angle = Math.atan2(velocityDirection.y, velocityDirection.x)
        
        ctx.save()
        ctx.translate(arrowEnd.x * scale, arrowEnd.y * scale)
        ctx.rotate(angle)
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(-arrowHeadSize, -arrowHeadSize/2)
        ctx.lineTo(-arrowHeadSize, arrowHeadSize/2)
        ctx.closePath()
        ctx.fillStyle = isCurrentPlayer ? '#3b82f6' : '#ef4444'
        ctx.fill()
        ctx.restore()
        
        ctx.globalAlpha = 1
      }
      
      // Player indicator
      if (isCurrentPlayer) {
        ctx.fillStyle = '#ffffff'
        ctx.font = `${Math.max(8, radius * 0.2)}px Arial`
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2
        ctx.strokeText('YOU', x, y + radius + 15)
        ctx.fillText('YOU', x, y + radius + 15)
      }
      break
      
    case 'projectile':
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      
      // Character-specific bullet colors
      const projectile = entity as any
      const characterType = projectile.characterType || 'default'
      
      if (characterType === 'default') {
        ctx.fillStyle = '#fbbf24' // Yellow default
      } else {
        const config = getCharacterConfig(characterType)
        ctx.fillStyle = config.bulletColor
      }
      
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.stroke()
      
      // Enhanced trail effect based on velocity
      const projectileVelocity = Vector.magnitude(entity.velocity)
      if (projectileVelocity > 100) {
        const trailLength = Math.min(projectileVelocity * 0.1, 20) * scale
        const direction = Vector.normalize(Vector.multiply(entity.velocity, -1))
        const trailEnd = Vector.add(entity.position, Vector.multiply(direction, trailLength / scale))
        
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(trailEnd.x * scale, trailEnd.y * scale)
        
        // Trail color matches projectile
        ctx.strokeStyle = ctx.fillStyle
        ctx.lineWidth = Math.max(2, radius * 0.5)
        ctx.globalAlpha = 0.7
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      break
      
    case 'pickup':
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = '#a855f7' // purple-500
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.stroke()
      ctx.setLineDash([])
      
      // Pickup type icon
      ctx.fillStyle = '#ffffff'
      ctx.font = `${radius}px monospace`
      ctx.textAlign = 'center'
      const powerupType = (entity as any).powerupType
      const icon = powerupType === 'health' ? '+' : 
                  powerupType === 'speed' ? '»' :
                  powerupType === 'damage' ? '!' : '◊'
      ctx.fillText(icon, x, y + 4)
      break
      
    case 'hazard':
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = '#dc2626' // red-600
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
      
      // Warning pattern
      ctx.fillStyle = '#ffffff'
      ctx.font = `${radius * 0.8}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText('!', x, y + 4)
      break
  }
  
  ctx.restore()
}

function drawHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, healthPercent: number): void {
  const barHeight = 4
  
  // Background
  ctx.fillStyle = '#374151' // gray-700
  ctx.fillRect(x - width/2, y, width, barHeight)
  
  // Health
  ctx.fillStyle = healthPercent > 0.6 ? '#10b981' : healthPercent > 0.3 ? '#f59e0b' : '#ef4444'
  ctx.fillRect(x - width/2, y, width * healthPercent, barHeight)
}

function drawPlayerUI(ctx: CanvasRenderingContext2D, game: GameState, playerId: string, canvasWidth: number, canvasHeight: number): void {
  const player = game.world.entities.get(playerId)
  if (!player) return
  
  // Player stats panel
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(10, 10, 200, 80)
  
  ctx.fillStyle = '#ffffff'
  ctx.font = '14px monospace'
  ctx.textAlign = 'left'
  
  ctx.fillText(`Health: ${Math.round(player.health)}/${player.maxHealth}`, 20, 30)
  ctx.fillText(`Speed: ${Math.round(Vector.magnitude(player.velocity))}`, 20, 50)
  ctx.fillText(`Round: ${game.roundNumber}`, 20, 70)
  
  // Mini-map or radar (simple version)
  const radarSize = 80
  const radarX = canvasWidth - radarSize - 10
  const radarY = 10
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(radarX, radarY, radarSize, radarSize)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1
  ctx.strokeRect(radarX, radarY, radarSize, radarSize)
  
  // Draw entities on radar
  const entities = Array.from(game.world.entities.values())
  entities.forEach(entity => {
    if (entity.type === 'projectile') return
    
    const radarPosX = radarX + (entity.position.x / game.config.arenaWidth) * radarSize
    const radarPosY = radarY + (entity.position.y / game.config.arenaHeight) * radarSize
    
    ctx.beginPath()
    ctx.arc(radarPosX, radarPosY, 2, 0, 2 * Math.PI)
    
    if (entity.id === playerId) {
      ctx.fillStyle = '#3b82f6' // blue
    } else if (entity.type === 'player') {
      ctx.fillStyle = '#ef4444' // red
    } else {
      ctx.fillStyle = '#a855f7' // purple for pickups
    }
    
    ctx.fill()
  })
}

function drawCrosshair(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.7
  
  const size = 10
  
  // Cross lines
  ctx.beginPath()
  ctx.moveTo(x - size, y)
  ctx.lineTo(x + size, y)
  ctx.moveTo(x, y - size)
  ctx.lineTo(x, y + size)
  ctx.stroke()
  
  // Center dot
  ctx.beginPath()
  ctx.arc(x, y, 2, 0, 2 * Math.PI)
  ctx.fill()
  
  ctx.globalAlpha = 1
}
