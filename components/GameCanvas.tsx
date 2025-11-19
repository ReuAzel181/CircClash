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
import { getCharacterConfigSync, getCharacterType } from '../lib/characterConfig'

// Theme configuration
const getThemeColors = (theme: 'dark' | 'light' | 'sunset' | 'ocean' | 'forest') => {
  switch (theme) {
    case 'light':
      return {
        background: '#f8fafc', // slate-50
        border: '#3b82f6', // blue-500
        grid: '#e2e8f0', // slate-200
        text: '#1f2937', // gray-800
        entityOutline: '#374151' // gray-700
      }
    case 'sunset':
      return {
        background: '#fed7aa', // orange-200
        border: '#ea580c', // orange-600
        grid: '#fdba74', // orange-300
        text: '#9a3412', // orange-800
        entityOutline: '#c2410c' // orange-700
      }
    case 'ocean':
      return {
        background: '#dbeafe', // blue-100
        border: '#2563eb', // blue-600
        grid: '#93c5fd', // blue-300
        text: '#1e3a8a', // blue-800
        entityOutline: '#1d4ed8' // blue-700
      }
    case 'forest':
      return {
        background: '#dcfce7', // green-100
        border: '#16a34a', // green-600
        grid: '#86efac', // green-300
        text: '#14532d', // green-800
        entityOutline: '#15803d' // green-700
      }
    case 'dark':
    default:
      return {
        background: '#0f172a', // slate-900
        border: '#fbbf24', // yellow-400
        grid: '#1e293b', // slate-800
        text: '#ffffff', // white
        entityOutline: '#ffffff' // white
      }
  }
}

// Visual tuning constants (smaller characters + tighter grid make arena feel larger)
const CHARACTER_SCALE = 0.72 // visual scale for drawn character circles (does not change physics)
const GRID_SIZE_BASE = 24 // smaller grid squares (was 40)
const CENTER_CIRCLE_RATIO = 0.06 // center circle size relative to arena (was 0.1)
const TEXT_STROKE_WIDTH = 2 // thin outline for health text

// Character color mapping for stroke colors - dark, highly distinct shades
const characterColors: { [key: string]: string } = {
  'vortex': '#6B21A8',    // Dark Purple
  'guardian': '#475569',  // Dark Slate Gray
  'striker': '#C2410C',   // Dark Orange
  'mystic': '#BE185D',    // Dark Pink/Rose
  'flame': '#B91C1C',     // Dark Red
  'frost': '#0E7490',     // Dark Cyan/Teal
  'shadow': '#000000',    // Pure Black
  'titan': '#334155',     // Dark Slate
  'archer': '#047857',    // Dark Emerald Green
  'samurai': '#5B21B6',   // Dark Violet
  'sniper': '#0F172A',    // Dark Slate
  'bomber': '#C2410C'     // Dark Orange Red
}

// Function to get character color from entity ID
function getCharacterColor(entityId: string): string {
  // Extract character type from bot ID (e.g., "bot_vortex" -> "vortex")
  const characterType = entityId.replace('bot_', '')
  return characterColors[characterType] || '#374151' // Default to steel gray
}

interface GameCanvasProps {
  width?: number
  height?: number
  className?: string
  playerId?: string
  onGameStateChange?: (gameState: GameState | null) => void
  paused?: boolean
  onPauseChange?: (paused: boolean) => void
  theme?: 'dark' | 'light' | 'sunset' | 'ocean' | 'forest'
  immersive?: boolean
}

export default function GameCanvas({ 
  width = 600, 
  height = 300, // Optimized for 100% zoom fit
  className = '',
  playerId,
  onGameStateChange,
  paused,
  onPauseChange,
  theme = 'dark',
  immersive = false
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width, height })
  // local pause state as a fallback if parent doesn't control pause
  const [localPaused, setLocalPaused] = useState(false)
  const isPaused = typeof paused === 'boolean' ? paused : localPaused
  const animationFrameRef = useRef<number>()

  // Simple canvas size setup - no responsive observer to avoid infinite loops
  useEffect(() => {
    setCanvasSize({ width, height })
  }, [width, height])

  // Mouse and keyboard input handlers removed for autonomous gameplay

  // Keyboard input and player movement removed for autonomous gameplay

  // Main render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
  if (isPaused) {
      // When paused, draw a subtle overlay and skip game rendering updates
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffffff'
      ctx.font = '24px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2)
      animationFrameRef.current = requestAnimationFrame(render)
      return
    }
    
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
    
    // Get theme colors
    const themeColors = getThemeColors(theme)
    
    // Clear canvas with themed arena background
    ctx.fillStyle = themeColors.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
  // NOTE: removed explicit arena stroke/border per UX request to avoid visible canvas stroke
    
    // Draw grid background
    drawGrid(ctx, canvas.width, canvas.height, 1, themeColors.grid)
    
    // Draw entities in proper order: projectiles first (background), then players (foreground)
    const entities = getGameEntities()
    
    // First pass: Draw all projectiles (including ice walls) in the background
    entities.forEach(entity => {
      if (entity.type === 'projectile') {
        drawEntity(ctx, entity, 1, theme)
      }
    })
    
    // Second pass: Draw all players and other entities in the foreground
    entities.forEach(entity => {
      if (entity.type !== 'projectile') {
        drawEntity(ctx, entity, 1, theme)
      }
    })
    
    // UI overlays removed for autonomous gameplay
    
    // Notify parent of game state changes
    if (onGameStateChange) {
      onGameStateChange(game)
    }
    
    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(render)
  }, [playerId, onGameStateChange])

  // Start render loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(render)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [render])

  // Ensure canvas fills its container by syncing to container size
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w > 0 && h > 0) setCanvasSize({ width: w, height: h })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      ro.disconnect()
    }
  }, [])

  return (
    <div 
      ref={containerRef}
       className={`
        relative 
        flex-1 
        min-h-0 
        ${immersive ? '' : 'bg-gray-100 rounded-lg'} 
        overflow-hidden 
        w-full 
        h-full 
        ${className}
      `}
    >
  {/* Pause is now controlled by parent; in-canvas toggle removed */}
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
          display: "block"
        }}
      />

    </div>
  )
}

// Helper drawing functions
function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, scale: number, gridColor: string = '#1e293b'): void {
  // Themed arena grid with enhanced visual effects
  ctx.strokeStyle = gridColor
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.3

  const gridSize = GRID_SIZE_BASE * scale
  // Inset the grid slightly to avoid overlapping the arena border stroke
  const inset = 4

  // Vertical lines with subtle glow effect (inset from edges)
  for (let x = inset; x <= width - inset; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, inset)
    ctx.lineTo(x, height - inset)
    ctx.stroke()
  }

  // Horizontal lines (inset from edges)
  for (let y = inset; y <= height - inset; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(inset, y)
    ctx.lineTo(width - inset, y)
    ctx.stroke()
  }

  // Add corner markers - tournament style, drawn inside inset so they don't clash with border
  const cornerSize = 20
  ctx.globalAlpha = 0.4
  // Removed corner markers per user request
  ctx.globalAlpha = 1
}

function drawEntity(ctx: CanvasRenderingContext2D, entity: CircleEntity, scale: number, theme: 'dark' | 'light' | 'sunset' | 'ocean' | 'forest' = 'dark'): void {
  const x = entity.position.x * scale
  const y = entity.position.y * scale
  // Drawn radius uses a visual scale to make arena feel larger without changing physics
  const radius = entity.radius * scale * CHARACTER_SCALE
  
  // Get theme colors for consistent styling
  const themeColors = getThemeColors(theme)
  
  ctx.save()

  // Draw range indicator if enabled
  if ((entity as any).showRangeIndicator) {
    ctx.beginPath()
    ctx.arc(x, y, ((entity as any).rangeIndicatorRadius as number) * scale, 0, 2 * Math.PI)
    ctx.strokeStyle = ((entity as any).rangeIndicatorColor as string) || '#06b6d4'
    ctx.globalAlpha = ((entity as any).rangeIndicatorOpacity as number) || 0.5
    ctx.lineWidth = ((entity as any).rangeIndicatorThickness as number) || 2
    if ((entity as any).rangeIndicatorStyle === 'stroke') {
      ctx.stroke()
    } else {
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  // Draw weapon if visible
  if (((entity as any).showWeapon === true) && ((entity as any).weaponState?.visible === true)) {
    const characterType = getCharacterType(entity.id)
    const weaponConfig = getCharacterConfigSync(characterType)
    
    ctx.save()
    ctx.translate(x, y)
    
    // Draw weapon with swing animation if active
    if ((entity as any).weaponState?.swinging) {
      const swingProgress = ((Date.now() - (((entity as any).weaponState.swingStartTime as number) || Date.now())) % (weaponConfig.primaryAttack?.swingDuration || 400)) / (weaponConfig.primaryAttack?.swingDuration || 400)
      const swingAngle = ((weaponConfig.primaryAttack?.swingAngle || 120) * Math.PI / 180) * Math.sin(swingProgress * Math.PI)
      ctx.rotate(swingAngle)
    }
    
    // Draw the weapon (blade)
    ctx.beginPath()
    ctx.moveTo(0, -radius * 0.5)
    ctx.lineTo(radius * 1.5, 0)
    ctx.lineTo(0, radius * 0.5)
    ctx.closePath()
    ctx.fillStyle = weaponConfig.color
    ctx.globalAlpha = 0.8
    ctx.fill()
    ctx.restore()
  }
  
  // Draw entity based on type
  switch (entity.type) {
    case 'player':
      // Main circle
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      
      // Color based on character type for autonomous entities
      const healthPercent = entity.health / entity.maxHealth
      
      // Character-specific colors for all entities (autonomous gameplay)
      const characterType = getCharacterType(entity.id)
      const entityConfig = getCharacterConfigSync(characterType)
      ctx.fillStyle = entityConfig.color
      
      // Dim color based on health
      ctx.globalAlpha = 0.3 + (healthPercent * 0.7)
      ctx.fill()
      
      // Enhanced border with defense-based thickness and character-specific color
      ctx.globalAlpha = 1
      const defenseValue = (entity as any).defense || 50
      // Map defense value (40-100 range) to stroke thickness (3-10 pixels) - increased for visibility
      const shieldThickness = Math.max(3, Math.min(10, 3 + ((defenseValue - 40) / 60) * 7))
      
      // Use character-specific color for stroke (autonomous gameplay)
      ctx.strokeStyle = getCharacterColor(entity.id)
      ctx.shadowColor = getCharacterColor(entity.id)
      ctx.shadowBlur = 6
      
      ctx.lineWidth = shieldThickness
      ctx.stroke()
      ctx.shadowBlur = 0
      
      // Special visual effects for tank characters
      if ((entity as any).isBot) {
        const characterType = getCharacterType(entity.id)
        
        if (characterType === 'guardian') {
          // Steel Guardian - Armor plating and defensive appearance
          ctx.strokeStyle = '#9ca3af' // Lighter gray for armor details
          ctx.lineWidth = 2
          ctx.globalAlpha = 0.8
          
          // Draw armor segments around the tank
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6
            const segmentRadius = radius * 0.7
            const x1 = x + Math.cos(angle) * segmentRadius
            const y1 = y + Math.sin(angle) * segmentRadius
            const x2 = x + Math.cos(angle + Math.PI / 6) * segmentRadius
            const y2 = y + Math.sin(angle + Math.PI / 6) * segmentRadius
            
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
          }
          
          // Draw central armor core
          ctx.fillStyle = '#6b7280'
          ctx.globalAlpha = 0.6
          ctx.beginPath()
          ctx.arc(x, y, radius * 0.3, 0, 2 * Math.PI)
          ctx.fill()
          
          // Energy Wave charging effect
          if ((entity as any).isCharging) {
            const chargeTime = Date.now() - ((entity as any).chargeStartTime || Date.now())
            const isDesperate = (entity as any).isDesperate
            const maxChargeTime = isDesperate ? 500 : 1000 // Faster charge time when desperate
            const chargeProgress = Math.min(chargeTime / maxChargeTime, 1.0)
            
            // Growing energy ring during charge
            const energyRadius = radius * (1.0 + chargeProgress * 0.8)
            const energyIntensity = Math.sin(Date.now() * (isDesperate ? 0.04 : 0.02)) * 0.3 + 0.7
            
            // Invulnerability shield effect (red when desperate)
            ctx.strokeStyle = isDesperate ? '#dc2626' : '#fbbf24' // Red when desperate, gold normally
            ctx.shadowColor = isDesperate ? '#dc2626' : '#fbbf24'
            ctx.shadowBlur = isDesperate ? 25 : 20
            ctx.lineWidth = isDesperate ? 8 : 6
            ctx.globalAlpha = 0.8
            
            ctx.beginPath()
            ctx.arc(x, y, radius * 1.4, 0, 2 * Math.PI)
            ctx.stroke()
            
            // Energy charging ring (more intense when desperate)
            ctx.strokeStyle = isDesperate ? '#ef4444' : '#6b7280'
            ctx.shadowColor = isDesperate ? '#ef4444' : '#6b7280'
            ctx.shadowBlur = 15 + chargeProgress * (isDesperate ? 20 : 10)
            ctx.lineWidth = 4 + chargeProgress * (isDesperate ? 5 : 3)
            ctx.globalAlpha = energyIntensity * chargeProgress
            
            ctx.beginPath()
            ctx.arc(x, y, energyRadius, 0, 2 * Math.PI)
            ctx.stroke()
            
            // Energy sparks around the charging Guardian (more when desperate)
            const sparkCount = isDesperate ? 12 : 8
            for (let i = 0; i < sparkCount; i++) {
              const sparkAngle = (i * Math.PI * 2) / sparkCount + Date.now() * (isDesperate ? 0.008 : 0.005)
              const sparkDistance = radius * (1.3 + Math.sin(Date.now() * 0.01 + i) * 0.2)
              const sparkX = x + Math.cos(sparkAngle) * sparkDistance
              const sparkY = y + Math.sin(sparkAngle) * sparkDistance
              
              ctx.fillStyle = isDesperate ? '#ffffff' : '#ffffff'
              ctx.globalAlpha = energyIntensity * chargeProgress * (isDesperate ? 1.0 : 0.8)
              ctx.beginPath()
              ctx.arc(sparkX, sparkY, (2 + chargeProgress * 2) * (isDesperate ? 1.5 : 1), 0, 2 * Math.PI)
              ctx.fill()
            }
            
            ctx.shadowBlur = 0
          }
          
          // Health regeneration indicator (pulsing green effect when healing)
          if ((entity as any).selfHeal && entity.health < entity.maxHealth) {
            const healPulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7
            ctx.strokeStyle = '#10b981' // Green
            ctx.lineWidth = 3
            ctx.globalAlpha = healPulse * 0.5
            ctx.beginPath()
            ctx.arc(x, y, radius * 1.2, 0, 2 * Math.PI)
            ctx.stroke()
          }
          
          ctx.globalAlpha = 1
        } else if (characterType === 'frost') {
          // Ice Knight - Range indicator and weapon rendering
          if ((entity as any).showRangeIndicator) {
            ctx.strokeStyle = (entity as any).rangeIndicatorColor || '#06b6d4'
            ctx.lineWidth = (entity as any).rangeIndicatorThickness || 2
            ctx.globalAlpha = (entity as any).rangeIndicatorOpacity || 0.5
            
            ctx.beginPath()
            ctx.arc(x, y, ((entity as any).rangeIndicatorRadius || 200) * scale, 0, 2 * Math.PI)
            ctx.stroke()
            ctx.globalAlpha = 1
          }

          // Weapon rendering - only show during dash attacks and make it much larger
          if ((entity as any).showWeapon && (entity as any).weaponState?.visible && (entity as any).isDashing) {
            const weaponLength = radius * 3.5 // Much larger weapon
            const weaponWidth = radius * 0.8 // Wider weapon
            
            // Get weapon direction, default to entity's facing direction if not specified
            const weaponDir = (entity as any).weaponState.direction || { x: 1, y: 0 }
            const weaponAngle = Math.atan2(weaponDir.y, weaponDir.x)
            
            // Calculate weapon position
            const weaponX = x + Math.cos(weaponAngle) * radius
            const weaponY = y + Math.sin(weaponAngle) * radius
            
            // Draw weapon with ice theme
            ctx.save()
            ctx.translate(weaponX, weaponY)
            ctx.rotate(weaponAngle)
            
            // Weapon swing animation
            if ((entity as any).weaponState.swinging) {
              const swingProgress = ((Date.now() - ((entity as any).weaponState.swingStartTime || Date.now())) % 500) / 500
              const swingAngle = Math.sin(swingProgress * Math.PI * 2) * Math.PI / 3
              ctx.rotate(swingAngle)
            }
            
            // Draw ice blade
            ctx.fillStyle = '#06b6d4'
            ctx.globalAlpha = 0.8
            ctx.beginPath()
            ctx.moveTo(0, -weaponWidth/2)
            ctx.lineTo(weaponLength, 0)
            ctx.lineTo(0, weaponWidth/2)
            ctx.closePath()
            ctx.fill()
            
            // Ice crystal effects
            const crystalCount = 5
            for (let i = 0; i < crystalCount; i++) {
              const progress = i / (crystalCount - 1)
              const crystalX = weaponLength * progress
              const crystalSize = weaponWidth * 0.3 * (1 - progress)
              
              ctx.fillStyle = '#a5f3fc'
              ctx.globalAlpha = 0.6
              ctx.beginPath()
              ctx.arc(crystalX, 0, crystalSize, 0, 2 * Math.PI)
              ctx.fill()
            }
            
            ctx.restore()
            ctx.globalAlpha = 1
          }
        } else if (characterType === 'titan') {
          // Iron Titan - Heavy industrial appearance with ground slam indicators
          ctx.strokeStyle = '#16a34a' // Bright green for power lines
          ctx.lineWidth = 3
          ctx.globalAlpha = 0.9
          
          // Draw power conduits in cross pattern
          for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI * 2) / 4 + Math.PI / 4
            const innerR = radius * 0.4
            const outerR = radius * 0.8
            const x1 = x + Math.cos(angle) * innerR
            const y1 = y + Math.sin(angle) * innerR
            const x2 = x + Math.cos(angle) * outerR
            const y2 = y + Math.sin(angle) * outerR
            
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
          }
          
          // Draw central power core
          const time = Date.now() * 0.01
          const corePulse = Math.sin(time) * 0.2 + 0.8
          ctx.fillStyle = '#22c55e' // Bright green core
          ctx.globalAlpha = corePulse
          ctx.beginPath()
          ctx.arc(x, y, radius * 0.25, 0, 2 * Math.PI)
          ctx.fill()
          
          // Ground slam charging indicator (when about to attack)
          const cooldownRatio = ((entity as any).attackCooldown || 0) / 900 // 900ms cooldown
          if (cooldownRatio > 0.6) { // Show charging effect in last 40% of cooldown
            const chargePulse = Math.sin(Date.now() * 0.03) * 0.4 + 0.6
            
            // Ground impact indicator lines
            ctx.strokeStyle = '#fbbf24' // Orange warning
            ctx.lineWidth = 3
            ctx.globalAlpha = chargePulse
            
            // Draw 6 ground crack indicators radiating outward
            for (let i = 0; i < 6; i++) {
              const crackAngle = (i * Math.PI * 2) / 6
              const crackStart = radius * 1.2
              const crackEnd = radius * 1.8
              const x1 = x + Math.cos(crackAngle) * crackStart
              const y1 = y + Math.sin(crackAngle) * crackStart
              const x2 = x + Math.cos(crackAngle) * crackEnd
              const y2 = y + Math.sin(crackAngle) * crackEnd
              
              ctx.beginPath()
              ctx.moveTo(x1, y1)
              ctx.lineTo(x2, y2)
              ctx.stroke()
            }
            
            // Central slam indicator
            ctx.strokeStyle = '#dc2626' // Red danger
            ctx.lineWidth = 4
            ctx.globalAlpha = chargePulse * 0.8
            ctx.beginPath()
            ctx.arc(x, y, radius * 1.4, 0, 2 * Math.PI)
            ctx.stroke()
          }
          
          // Combo invulnerability shield effect
          const currentTime = Date.now()
          if ((entity as any).comboInvulnerableUntil > currentTime) {
            const shieldPulse = Math.sin(currentTime * 0.02) * 0.3 + 0.7
            
            // Golden invulnerability shield
            ctx.strokeStyle = '#fbbf24' // Golden color
            ctx.lineWidth = 4
            ctx.globalAlpha = shieldPulse * 0.8
            ctx.beginPath()
            ctx.arc(x, y, radius * 1.6, 0, 2 * Math.PI)
            ctx.stroke()
            
            // Inner shield ring
            ctx.strokeStyle = '#f59e0b' // Darker gold
            ctx.lineWidth = 2
            ctx.globalAlpha = shieldPulse * 0.6
            ctx.beginPath()
            ctx.arc(x, y, radius * 1.3, 0, 2 * Math.PI)
            ctx.stroke()
            
            // Shield particles
            for (let i = 0; i < 8; i++) {
              const angle = (i * Math.PI * 2) / 8 + currentTime * 0.01
              const particleX = x + Math.cos(angle) * radius * 1.5
              const particleY = y + Math.sin(angle) * radius * 1.5
              
              ctx.fillStyle = '#fbbf24'
              ctx.globalAlpha = shieldPulse * 0.9
              ctx.beginPath()
              ctx.arc(particleX, particleY, 3, 0, 2 * Math.PI)
              ctx.fill()
            }
          }
          
          ctx.globalAlpha = 1
        }
      }
      
  // Draw aiming line for bots (show where they're targeting) - simplified (no dashed connector)
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
            // Draw only a small target indicator (no connecting line)
            ctx.beginPath()
            ctx.arc(target.position.x * scale, target.position.y * scale, 6, 0, 2 * Math.PI)
            ctx.strokeStyle = '#ef4444'
            ctx.lineWidth = 1.5
            ctx.globalAlpha = 0.6
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }
      }
      
      // Enhanced health text with theme-appropriate colors
      ctx.fillStyle = themeColors.text
      // Smaller, tighter health font so numbers don't dominate the circle
      const healthFontSize = Math.max(10, radius * 0.36)
      ctx.font = `bold ${healthFontSize}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Enhanced text shadow for better readability
      ctx.strokeStyle = themeColors.background
      ctx.lineWidth = TEXT_STROKE_WIDTH
      ctx.strokeText(Math.round(entity.health).toString(), x, y)
      
      // Add glow effect for health text
      ctx.shadowColor = themeColors.text
      ctx.shadowBlur = 4
      ctx.fillText(Math.round(entity.health).toString(), x, y)
      ctx.shadowBlur = 0
      
      // Removed player indicator for autonomous gameplay
      break
      
    case 'projectile':
      // Get character-specific bullet styling
      const projectile = entity as any
      const projectileCharacterType = projectile.characterType || 'default'
      const projectileConfig = getCharacterConfigSync(projectileCharacterType)
      
      ctx.save()
      
      // Apply glow effect if character has it
      if (projectileConfig.glowEffect && projectileCharacterType !== 'default') {
        ctx.shadowColor = projectileConfig.bulletColor
        ctx.shadowBlur = 6 // Reduced from 15 to 6 for subtler glow
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
      }
      
      // Enhanced glow for special projectiles
      if (projectile.explosive) {
        ctx.shadowColor = '#ff4444'
        ctx.shadowBlur = 12
      } else if (projectile.electric || projectile.chainLightning) {
        ctx.shadowColor = '#44aaff'
        ctx.shadowBlur = 10
      } else if (projectile.homing || projectile.homingStrength) {
        ctx.shadowColor = '#ff44ff'
        ctx.shadowBlur = 8
      } else if (projectile.freezing || projectile.slowEffect) {
        ctx.shadowColor = '#44ddff'
        ctx.shadowBlur = 8
      } else if (projectile.isBoomerang) {
        ctx.shadowColor = '#aa44ff'
        ctx.shadowBlur = 10
      } else if (projectile.voidRift) {
        ctx.shadowColor = '#000000'
        ctx.shadowBlur = 15
      } else if (projectile.proximityMine) {
        ctx.shadowColor = '#ff8800'
        ctx.shadowBlur = 8
      } else if (projectile.isShockwave) {
        ctx.shadowColor = '#888888'
        ctx.shadowBlur = 20
      } else if (projectile.isEarthquake) {
        ctx.shadowColor = '#059669'
        ctx.shadowBlur = 25
      } else if (projectile.isFissure) {
        ctx.shadowColor = '#16a34a'
        ctx.shadowBlur = 15
      } else if (projectile.isIronHand) {
        ctx.shadowColor = '#374151'
        ctx.shadowBlur = 12
      } else if (projectile.isEnergyWave) {
        const waveIntensity = Math.min(projectile.radius / (projectile.originalRadius || 20), 3.0)
        const isDesperate = (projectile as any).isDesperate
        ctx.shadowColor = isDesperate ? '#ef4444' : '#6b7280' // Red glow when desperate
        ctx.shadowBlur = (15 + (waveIntensity * 10)) * (isDesperate ? 1.5 : 1)
      }
      
      // Draw bullet based on character's bullet shape
      if (projectileCharacterType === 'default') {
        // Default bullet style
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI)
        ctx.fillStyle = '#fbbf24' // Yellow default
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1
        ctx.stroke()
      } else {
        // Character-specific bullet shapes
        ctx.fillStyle = projectileConfig.bulletColor
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1
        
        // Use projectile's shape if available, otherwise use character's bulletShape
        const projectileShape = (projectile as any).shape || projectileConfig.bulletShape
        
        switch (projectileShape) {
          case 'thunder': // Lightning Striker - enhanced jagged lightning
            ctx.save();
            // Calculate angle from velocity
            let angle = 0;
            if (projectile.velocity && (projectile.velocity.x !== 0 || projectile.velocity.y !== 0)) {
              angle = Math.atan2(projectile.velocity.y, projectile.velocity.x);
            }
            ctx.translate(x, y);
            ctx.rotate(angle);
            
            // Draw main lightning bolt with enhanced visuals
            ctx.beginPath();
            ctx.moveTo(0, -radius * 1.5);
            ctx.lineTo(radius * 0.3, -radius * 0.9);
            ctx.lineTo(-radius * 0.2, -radius * 0.6);
            ctx.lineTo(radius * 0.4, -radius * 0.3);
            ctx.lineTo(-radius * 0.1, 0);
            ctx.lineTo(radius * 0.2, radius * 0.3);
            ctx.lineTo(0, radius * 0.15);
            ctx.lineTo(-radius * 0.3, radius * 0.4);
            ctx.lineTo(-radius * 0.1, 0);
            ctx.lineTo(-radius * 0.4, -radius * 0.3);
            ctx.lineTo(radius * 0.2, -radius * 0.6);
            ctx.lineTo(-radius * 0.3, -radius * 0.9);
            ctx.closePath();
            
            // Enhanced glow effect
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#fbbf24'; // More vibrant yellow glow
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Add inner bright core
            ctx.beginPath();
            ctx.moveTo(0, -radius * 1.3);
            ctx.lineTo(radius * 0.2, -radius * 0.8);
            ctx.lineTo(-radius * 0.15, -radius * 0.55);
            ctx.lineTo(radius * 0.3, -radius * 0.25);
            ctx.lineTo(-radius * 0.08, 0);
            ctx.lineTo(radius * 0.15, radius * 0.25);
            ctx.lineTo(0, radius * 0.1);
            ctx.lineTo(-radius * 0.25, radius * 0.35);
            ctx.lineTo(-radius * 0.08, 0);
            ctx.lineTo(-radius * 0.35, -radius * 0.25);
            ctx.lineTo(radius * 0.15, -radius * 0.55);
            ctx.lineTo(-radius * 0.25, -radius * 0.8);
            ctx.closePath();
            
            ctx.fillStyle = '#fde68a'; // Light yellow core
            ctx.fill();
            
            // Add electric sparks around the bolt
            ctx.fillStyle = '#fbbf24';
            for (let i = 0; i < 5; i++) {
              const sparkAngle = (i * Math.PI * 2) / 5;
              const sparkDistance = radius * (0.8 + Math.random() * 0.4);
              const sparkX = Math.cos(sparkAngle) * sparkDistance;
              const sparkY = Math.sin(sparkAngle) * sparkDistance;
              const sparkSize = 1 + Math.random() * 2;
              
              ctx.beginPath();
              ctx.arc(sparkX, sparkY, sparkSize, 0, 2 * Math.PI);
              ctx.fill();
            }
            
            ctx.restore();
            break;
  // Shock effect for stunned enemies
  if (entity.type === 'player' && (entity as any).isStunned && (entity as any).electricEffectActive) {
    ctx.save();
    
    // Get character-specific config for electric effects
    const characterType = getCharacterType(entity.id);
    const electricConfig = getCharacterConfigSync(characterType);
    const electricColor = electricConfig.electricColor || '#4f46e5';
    
    // Draw multiple pulsing circles for enhanced electric effect
    const time = Date.now() * 0.01;
    const baseRadius = entity.radius * scale * 1.2;
    
    // Add glow effect
    ctx.shadowColor = electricColor;
    ctx.shadowBlur = 15;
    
    // Outer pulsing circles
    for (let i = 0; i < 3; i++) {
      const pulse = Math.sin(time * 2 + i) * 0.3 + 0.7;
      const radius = baseRadius * (1 + i * 0.3) * pulse;
      
      ctx.beginPath();
      ctx.arc(entity.position.x, entity.position.y, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = electricColor;
      ctx.lineWidth = 3 - i;
      ctx.globalAlpha = 0.7 - i * 0.15; // Increased visibility
      ctx.stroke();
    }
    
    // Add lightning bolts around the entity
    const boltCount = 5;
    const maxOffset = entity.radius * scale * 1.5;
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = electricColor;
    ctx.globalAlpha = 0.8;
    
    for (let i = 0; i < boltCount; i++) {
      const angle = (Math.PI * 2 * i / boltCount) + (time * 0.1);
      const startX = entity.position.x + Math.cos(angle) * baseRadius;
      const startY = entity.position.y + Math.sin(angle) * baseRadius;
      const endX = entity.position.x + Math.cos(angle) * maxOffset;
      const endY = entity.position.y + Math.sin(angle) * maxOffset;
      
      // Draw jagged lightning bolt
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      const segments = 3;
      for (let j = 1; j <= segments; j++) {
        const t = j / segments;
        const xPos = startX + (endX - startX) * t;
        const yPos = startY + (endY - startY) * t;
        const offset = Math.sin(time * 3 + i + j) * entity.radius * scale * 0.3;
        
        ctx.lineTo(
          xPos + Math.cos(angle + Math.PI/2) * offset,
          yPos + Math.sin(angle + Math.PI/2) * offset
        );
      }
      
      ctx.stroke();
    }
    
    // Add crackling lightning bolts
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6 + time;
      const innerRadius = baseRadius * 0.5;
      const outerRadius = baseRadius * 1.5;
      const startX = entity.position.x + Math.cos(angle) * innerRadius;
      const startY = entity.position.y + Math.sin(angle) * innerRadius;
      const endX = entity.position.x + Math.cos(angle + Math.sin(time * 2 + i) * 0.5) * outerRadius;
      const endY = entity.position.y + Math.sin(angle + Math.sin(time * 2 + i) * 0.5) * outerRadius;
      
      // Create zigzag lightning effect
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      const segments = 4;
      for (let j = 1; j <= segments; j++) {
        const t = j / segments;
        const midX = startX + (endX - startX) * t;
        const midY = startY + (endY - startY) * t;
        
        // Add random offset for zigzag effect
        if (j < segments) {
          const offsetAngle = angle + Math.PI / 2;
          const offset = Math.sin(time * 3 + i + j) * 10;
          const zigzagX = midX + Math.cos(offsetAngle) * offset;
          const zigzagY = midY + Math.sin(offsetAngle) * offset;
          ctx.lineTo(zigzagX, zigzagY);
        } else {
          ctx.lineTo(endX, endY);
        }
      }
      
      ctx.stroke();
    }
    
    // Add electric sparks
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 8; i++) {
      const sparkAngle = (i * Math.PI * 2) / 8 + time;
      const sparkRadius = baseRadius * (0.8 + Math.sin(time * 3 + i) * 0.2);
      const sparkX = entity.position.x + Math.cos(sparkAngle) * sparkRadius;
      const sparkY = entity.position.y + Math.sin(sparkAngle) * sparkRadius;
      const sparkSize = 2 + Math.sin(time * 4 + i) * 1;
      
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, sparkSize, 0, 2 * Math.PI);
      ctx.globalAlpha = 0.9;
      ctx.fill();
    }
    
    ctx.globalAlpha = 1;
    ctx.restore();
  }
          case 'orb': // Vortex - spinning plasma orb
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, 2 * Math.PI)
            ctx.fill()
            
            // Draw spinning effect
            if (projectileConfig.bulletStyle === 'spinning') {
              const time = Date.now() * 0.01
              ctx.strokeStyle = projectileConfig.bulletColor
              ctx.lineWidth = 2
              for (let i = 0; i < 3; i++) {
                const angle = time + (i * Math.PI * 2 / 3)
                const spiralX = Math.cos(angle) * radius * 0.6
                const spiralY = Math.sin(angle) * radius * 0.6
                ctx.beginPath()
                ctx.arc(x + spiralX, y + spiralY, 2, 0, 2 * Math.PI)
                ctx.stroke()
              }
            }
            break
            
            
          case 'cannon': // Guardian/Titan - heavy cannonball
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, 2 * Math.PI)
            ctx.fill()
            
            // Draw metallic shine
            ctx.beginPath()
            ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, 2 * Math.PI)
            ctx.fillStyle = '#ffffff'
            ctx.globalAlpha = 0.4
            ctx.fill()
            ctx.globalAlpha = 1
            break
            
          case 'star': // Mystic - magical star
            // Draw 5-pointed star
            ctx.beginPath()
            for (let i = 0; i < 5; i++) {
              const angle = (i * Math.PI * 2 / 5) - Math.PI / 2
              const outerX = x + Math.cos(angle) * radius
              const outerY = y + Math.sin(angle) * radius
              const innerAngle = angle + Math.PI / 5
              const innerX = x + Math.cos(innerAngle) * (radius * 0.5)
              const innerY = y + Math.sin(innerAngle) * (radius * 0.5)
              
              if (i === 0) ctx.moveTo(outerX, outerY)
              else ctx.lineTo(outerX, outerY)
              ctx.lineTo(innerX, innerY)
            }
            ctx.closePath()
            ctx.fill()
            ctx.stroke()
            break
            
          case 'shard': // Frost - ice shard
            // Draw crystal shard shape
            ctx.beginPath()
            ctx.moveTo(x, y - radius)
            ctx.lineTo(x + radius * 0.6, y - radius * 0.3)
            ctx.lineTo(x + radius * 0.8, y + radius * 0.2)
            ctx.lineTo(x, y + radius)
            ctx.lineTo(x - radius * 0.8, y + radius * 0.2)
            ctx.lineTo(x - radius * 0.6, y - radius * 0.3)
            ctx.closePath()
            ctx.fill()
            ctx.stroke()
            
            // Add ice crystals
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 1
            ctx.globalAlpha = 0.7
            ctx.beginPath()
            ctx.moveTo(x - radius * 0.3, y - radius * 0.5)
            ctx.lineTo(x + radius * 0.3, y + radius * 0.5)
            ctx.moveTo(x + radius * 0.3, y - radius * 0.5)
            ctx.lineTo(x - radius * 0.3, y + radius * 0.5)
            ctx.stroke()
            ctx.globalAlpha = 1
            break
            
          case 'diamond': // Shadow - shadow diamond
            // Draw diamond shape
            ctx.beginPath()
            ctx.moveTo(x, y - radius)
            ctx.lineTo(x + radius, y)
            ctx.lineTo(x, y + radius)
            ctx.lineTo(x - radius, y)
            ctx.closePath()
            ctx.fill()
            ctx.stroke()
            break
            
          case 'arrow': // Archer - wind arrow
            // Draw arrow shape
            ctx.beginPath()
            ctx.moveTo(x - radius, y)
            ctx.lineTo(x + radius, y - radius * 0.3)
            ctx.lineTo(x + radius * 0.7, y)
            ctx.lineTo(x + radius, y + radius * 0.3)
            ctx.closePath()
            ctx.fill()
            ctx.stroke()
            
            // Add wind effect
            ctx.strokeStyle = '#10b981'
            ctx.lineWidth = 1
            ctx.globalAlpha = 0.6
            for (let i = 0; i < 3; i++) {
              const windX = x - radius * (0.5 + i * 0.3)
              ctx.beginPath()
              ctx.moveTo(windX, y - radius * 0.2)
              ctx.lineTo(windX + radius * 0.2, y)
              ctx.lineTo(windX, y + radius * 0.2)
              ctx.stroke()
            }
            ctx.globalAlpha = 1
            break
            
          case 'arc': // Samurai - energy slash arc
            // Draw curved slash
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, Math.PI, false)
            ctx.lineWidth = radius * 0.8
            ctx.strokeStyle = projectileConfig.bulletColor
            ctx.stroke()
            
            // Add energy effect
            ctx.beginPath()
            ctx.arc(x, y, radius * 1.2, 0, Math.PI, false)
            ctx.lineWidth = 2
            ctx.strokeStyle = '#ffffff'
            ctx.globalAlpha = 0.7
            ctx.stroke()
            ctx.globalAlpha = 1
            break
            
          case 'beam': // Sniper - void beam OR Iron Titan - ground fissure
            if (projectile.isFissure) {
              // Draw ground fissure effect
              const fissureNumber = projectile.fissureNumber || 1
              const time = Date.now() * 0.01
              
              // Calculate fissure direction
              const dx = projectile.velocity?.x || 1
              const dy = projectile.velocity?.y || 0
              const length = Vector.magnitude({x: dx, y: dy})
              const normalizedDx = length > 0 ? dx / length : 1
              const normalizedDy = length > 0 ? dy / length : 0
              
              // Main fissure crack
              ctx.strokeStyle = '#8b5a00' // Brown earth color
              ctx.lineWidth = radius
              ctx.globalAlpha = 0.9
              ctx.lineCap = 'round'
              
              // Draw jagged fissure line
              ctx.beginPath()
              const fissureLength = radius * 3
              const startX = x - normalizedDx * fissureLength / 2
              const startY = y - normalizedDy * fissureLength / 2
              const endX = x + normalizedDx * fissureLength / 2
              const endY = y + normalizedDy * fissureLength / 2
              
              // Create jagged line with random offsets
              const segments = 8
              ctx.moveTo(startX, startY)
              for (let i = 1; i <= segments; i++) {
                const t = i / segments
                const segmentX = startX + (endX - startX) * t
                const segmentY = startY + (endY - startY) * t
                
                // Add perpendicular random offset for jagged effect
                const offsetMagnitude = (Math.sin(time + i + fissureNumber) * radius * 0.3)
                const offsetX = segmentX + (-normalizedDy) * offsetMagnitude
                const offsetY = segmentY + normalizedDx * offsetMagnitude
                
                ctx.lineTo(offsetX, offsetY)
              }
              ctx.stroke()
              
              // Add glowing core
              ctx.strokeStyle = projectileConfig.bulletColor
              ctx.lineWidth = Math.max(2, radius * 0.3)
              ctx.globalAlpha = 0.8
              ctx.beginPath()
              ctx.moveTo(startX, startY)
              ctx.lineTo(endX, endY)
              ctx.stroke()
              
              // Add debris particles
              ctx.fillStyle = '#666666'
              ctx.globalAlpha = 0.6
              for (let i = 0; i < 4; i++) {
                const debrisX = x + (Math.random() - 0.5) * radius * 2
                const debrisY = y + (Math.random() - 0.5) * radius * 2
                ctx.beginPath()
                ctx.arc(debrisX, debrisY, 1 + Math.random() * 2, 0, 2 * Math.PI)
                ctx.fill()
              }
              
              ctx.globalAlpha = 1
            } else {
              // Regular void beam (Sniper)
              ctx.beginPath()
              ctx.ellipse(x, y, radius * 2, radius * 0.5, 0, 0, 2 * Math.PI)
              ctx.fill()
              
              // Add void effect
              ctx.strokeStyle = '#ffffff'
              ctx.lineWidth = 1
              ctx.globalAlpha = 0.8
              ctx.beginPath()
              ctx.ellipse(x, y, radius * 1.5, radius * 0.3, 0, 0, 2 * Math.PI)
              ctx.stroke()
              ctx.globalAlpha = 1
            }
            break
            
          case 'bomb': // Bomber - explosive bomb
            // Draw round bomb with fuse
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, 2 * Math.PI)
            ctx.fill()
            
            // Add fuse
            ctx.strokeStyle = '#fbbf24'
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.moveTo(x, y - radius)
            ctx.lineTo(x - radius * 0.3, y - radius * 1.5)
            ctx.stroke()
            
            // Add spark at fuse tip
            const time = Date.now() * 0.01
            if (Math.sin(time) > 0) {
              ctx.fillStyle = '#fbbf24'
              ctx.beginPath()
              ctx.arc(x - radius * 0.3, y - radius * 1.5, 2, 0, 2 * Math.PI)
              ctx.fill()
            }
            
            // Add warning stripes
            ctx.strokeStyle = '#000000'
            ctx.lineWidth = 2
            for (let i = 0; i < 3; i++) {
              const angle = (i * Math.PI * 2 / 3)
              const stripeX = Math.cos(angle) * radius * 0.7
              const stripeY = Math.sin(angle) * radius * 0.7
              ctx.beginPath()
              ctx.moveTo(x + stripeX - 3, y + stripeY - 3)
              ctx.lineTo(x + stripeX + 3, y + stripeY + 3)
              ctx.stroke()
            }
            break
            
          case 'ironhand': // Iron Titan - grab and punch combo
            const projectileSpecial = projectile as any
            const isExtending = projectileSpecial.isExtending !== false
            const startPos = projectileSpecial.startPosition
            const hasGrabbedTarget = projectileSpecial.hasGrabbedTarget
            const justPunched = projectileSpecial.justPunched
            const punchCount = projectileSpecial.punchCount || 0
            const grabRadius = projectileSpecial.grabRadius || 25
            
            if (startPos) {
              // Draw connection line from start position to hand
              ctx.strokeStyle = hasGrabbedTarget ? '#dc2626' : '#4b5563' // Red when grabbing, gray normally
              ctx.lineWidth = hasGrabbedTarget ? 6 : 4
              ctx.globalAlpha = 0.8
              ctx.beginPath()
              ctx.moveTo(startPos.x, startPos.y)
              ctx.lineTo(x, y)
              ctx.stroke()
              
              // Draw segments to make it look mechanical
              const distance = Vector.distance(startPos, {x, y})
              const segments = Math.floor(distance / 20)
              ctx.strokeStyle = hasGrabbedTarget ? '#991b1b' : '#374151' // Darker red when grabbing
              ctx.lineWidth = hasGrabbedTarget ? 8 : 6
              ctx.globalAlpha = 1
              for (let i = 1; i < segments; i++) {
                const t = i / segments
                const segmentX = startPos.x + (x - startPos.x) * t
                const segmentY = startPos.y + (y - startPos.y) * t
                ctx.beginPath()
                ctx.arc(segmentX, segmentY, hasGrabbedTarget ? 4 : 3, 0, 2 * Math.PI)
                ctx.stroke()
              }
            }
            
            // Removed dashed grab detection ring visual (was causing unwanted connector lines).
            
            // Draw the iron hand itself
            const handColor = hasGrabbedTarget ? '#dc2626' : '#374151' // Red when grabbing
            const outlineColor = hasGrabbedTarget ? '#991b1b' : '#1f2937'
            
            ctx.fillStyle = handColor
            ctx.strokeStyle = outlineColor
            ctx.lineWidth = 2
            
            // Draw fist shape - larger when grabbing
            const handSize = hasGrabbedTarget ? 1.5 : 1.2
            ctx.beginPath()
            ctx.ellipse(x, y, radius * handSize, radius * (handSize * 0.8), 0, 0, 2 * Math.PI)
            ctx.fill()
            ctx.stroke()
            
            // Add knuckle details
            ctx.fillStyle = hasGrabbedTarget ? '#fca5a5' : '#6b7280' // Lighter when grabbing
            for (let i = 0; i < 3; i++) {
              const knuckleX = x + (i - 1) * radius * 0.4
              const knuckleY = y - radius * 0.3
              ctx.beginPath()
              ctx.arc(knuckleX, knuckleY, hasGrabbedTarget ? 3 : 2, 0, 2 * Math.PI)
              ctx.fill()
            }
            
            // Show punch effect when just punched - enhanced animation
            if (justPunched) {
              ctx.strokeStyle = '#fbbf24' // Golden punch effect
              ctx.lineWidth = 4
              ctx.globalAlpha = 0.9
              
              // Multiple impact rings for more dramatic effect
              for (let i = 0; i < 4; i++) {
                ctx.beginPath()
                ctx.arc(x, y, radius * (1.6 + i * 0.3), 0, 2 * Math.PI)
                ctx.stroke()
              }
              
              // Add punch direction lines
              for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI * 2) / 8
                const lineStart = radius * 1.4
                const lineEnd = radius * 2.2
                ctx.beginPath()
                ctx.moveTo(x + Math.cos(angle) * lineStart, y + Math.sin(angle) * lineStart)
                ctx.lineTo(x + Math.cos(angle) * lineEnd, y + Math.sin(angle) * lineEnd)
                ctx.stroke()
              }
              
              ctx.globalAlpha = 1
            }
            
            // Show punch counter and timing when grabbing
            if (hasGrabbedTarget) {
              // Punch counter
              if (punchCount > 0) {
                ctx.fillStyle = '#fbbf24'
                ctx.font = 'bold 16px monospace'
                ctx.textAlign = 'center'
                ctx.fillText(`${punchCount}/5`, x, y - radius * 2.8)
              }
              
              // Show grab indicator
              ctx.fillStyle = '#dc2626'
              ctx.font = 'bold 12px monospace'
              ctx.textAlign = 'center'
              ctx.fillText('GRABBED!', x, y - radius * 3.5)
              
              // Pulsing grab effect
              const pulseTime = Date.now() * 0.01
              const pulseSize = 1 + Math.sin(pulseTime * 3) * 0.1
              ctx.strokeStyle = '#dc2626'
              ctx.lineWidth = 2
              ctx.globalAlpha = 0.6
              ctx.beginPath()
              ctx.arc(x, y, radius * 2 * pulseSize, 0, 2 * Math.PI)
              ctx.stroke()
              ctx.globalAlpha = 1
            }
            
            // Add motion blur when extending (and not grabbing)
            if (isExtending && !hasGrabbedTarget) {
              ctx.strokeStyle = '#9ca3af' // Gray-400 for motion blur
              ctx.lineWidth = 1
              ctx.globalAlpha = 0.3
              for (let i = 1; i <= 3; i++) {
                ctx.beginPath()
                ctx.ellipse(x - i * 3, y, radius * 1.2, radius, 0, 0, 2 * Math.PI)
                ctx.stroke()
              }
              ctx.globalAlpha = 1
            }
            break
            
          case 'circle': // Steel Guardian - energy wave (now uses circle shape)
            const waveSpecial = projectile as any
            if (waveSpecial.isEnergyWave) {
              const originalRadius = waveSpecial.originalRadius || 20 // Updated to match larger starting size
              const currentSize = projectile.radius
              const growthFactor = currentSize / originalRadius
              const isDesperate = waveSpecial.isDesperate
              
              // Wave appearance based on size and power
              const waveIntensity = Math.min(growthFactor, 3.0)
              const waveAlpha = Math.max(0.3, 1.0 - (growthFactor - 1) * 0.3)
              
              // Different colors for desperate mode
              const waveColor = isDesperate ? '#ef4444' : projectileConfig.bulletColor
              const coreColor = isDesperate ? '#fca5a5' : '#ffffff'
              
              // Outer energy ring
              ctx.fillStyle = waveColor
              ctx.globalAlpha = waveAlpha * (isDesperate ? 0.6 : 0.4)
              ctx.beginPath()
              ctx.arc(x, y, radius, 0, 2 * Math.PI)
              ctx.fill()
              
              // Inner core
              ctx.fillStyle = coreColor
              ctx.globalAlpha = waveAlpha * 0.8
              ctx.beginPath()
              ctx.arc(x, y, radius * 0.6, 0, 2 * Math.PI)
              ctx.fill()
              
              // Energy crackling effects (more intense when desperate)
              ctx.strokeStyle = waveColor
              ctx.lineWidth = isDesperate ? 3 : 2
              ctx.globalAlpha = waveAlpha
              const time = Date.now() * (isDesperate ? 0.015 : 0.01)
              const crackleCount = isDesperate ? 8 : 6
              for (let i = 0; i < crackleCount; i++) {
                const angle = (time + i * Math.PI / (crackleCount/2)) % (2 * Math.PI)
                const innerRadius = radius * 0.7
                const outerRadius = radius * (isDesperate ? 1.3 : 1.2)
                const startX = x + Math.cos(angle) * innerRadius
                const startY = y + Math.sin(angle) * innerRadius
                const endX = x + Math.cos(angle) * outerRadius
                const endY = y + Math.sin(angle) * outerRadius
                
                ctx.beginPath()
                ctx.moveTo(startX, startY)
                ctx.lineTo(endX, endY)
                ctx.stroke()
              }
              
              // Pulsing outer glow (more intense when desperate)
              ctx.shadowColor = waveColor
              ctx.shadowBlur = (20 + Math.sin(time) * 8) * (isDesperate ? 1.5 : 1)
              ctx.strokeStyle = waveColor
              ctx.lineWidth = isDesperate ? 4 : 3
              ctx.globalAlpha = waveAlpha * (isDesperate ? 0.8 : 0.6)
              ctx.beginPath()
              ctx.arc(x, y, radius * 1.1, 0, 2 * Math.PI)
              ctx.stroke()
              
              ctx.globalAlpha = 1
              ctx.shadowBlur = 0
            } else {
              // Regular circle projectile
              ctx.beginPath()
              ctx.arc(x, y, radius, 0, 2 * Math.PI)
              ctx.fill()
              ctx.stroke()
            }
            break
            
          case 'disc': // Plasma Vortex - spinning disc for boomerang
            // Draw spinning disc
            const discTime = Date.now() * 0.01
            const rotation = discTime * 2
            ctx.save()
            ctx.translate(x, y)
            ctx.rotate(rotation)
            
            // Draw disc with spinning effect
            ctx.beginPath()
            ctx.ellipse(0, 0, radius * 1.2, radius * 0.6, 0, 0, 2 * Math.PI)
            ctx.fill()
            
            // Add spinning marks
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 2
            ctx.globalAlpha = 0.8
            for (let i = 0; i < 4; i++) {
              const angle = (i * Math.PI / 2)
              const markX = Math.cos(angle) * radius * 0.8
              const markY = Math.sin(angle) * radius * 0.4
              ctx.beginPath()
              ctx.arc(markX, markY, 2, 0, 2 * Math.PI)
              ctx.stroke()
            }
            ctx.globalAlpha = 1
            ctx.restore()
            break
            
          case 'wall': // Steel Guardian/Ice Knight - barrier projectile
            if (projectile.isIceWall || projectile.characterType === 'frost') {
              // Draw ice wall for Ice Knight with proper orientation and size
              const time = Date.now() * 0.005

              // Convert world units to pixels using the known ratio between rendered radius and entity radius
              const scaleFactor = projectile.radius && projectile.radius > 0 ? (radius / projectile.radius) : 1
              const wallLength = (projectile as any).wallLength ? ((projectile as any).wallLength as number) * scaleFactor : radius * 3
              const wallThickness = (projectile as any).wallThickness ? ((projectile as any).wallThickness as number) * scaleFactor : radius
              const face = (projectile as any).facingDirection as { x: number, y: number } | undefined
              const angle = face ? Math.atan2(face.y, face.x) : 0

              ctx.save()
              ctx.translate(x, y)
              ctx.rotate(angle)

              // Draw main ice wall structure centered at origin
              ctx.beginPath()
              ctx.rect(-wallLength / 2, -wallThickness / 2, wallLength, wallThickness)
              ctx.fillStyle = '#a5f3fc' // Light cyan for ice
              ctx.fill()

              // Add ice crystal border
              ctx.strokeStyle = '#0891b2' // Darker cyan for border
              ctx.lineWidth = 3
              ctx.stroke()

              // Add ice crystal details
              ctx.strokeStyle = '#e0f2fe' // Very light blue
              ctx.lineWidth = 1
              ctx.globalAlpha = 0.8

              // Vertical ice crystal formations
              for (let i = 0; i < 5; i++) {
                const lineX = -wallLength / 2 + (i * wallLength / 4)
                const heightVariation = Math.sin(time + i) * 0.2 + 0.8 // Varying heights

                ctx.beginPath()
                ctx.moveTo(lineX, -wallThickness * 0.5 * heightVariation)
                ctx.lineTo(lineX, wallThickness * 0.5 * heightVariation)
                ctx.stroke()

                // Add crystal spikes at top and bottom
                ctx.beginPath()
                ctx.moveTo(lineX - 3, -wallThickness * 0.5 * heightVariation)
                ctx.lineTo(lineX, -wallThickness * 0.5 * heightVariation - 5)
                ctx.lineTo(lineX + 3, -wallThickness * 0.5 * heightVariation)
                ctx.stroke()

                ctx.beginPath()
                ctx.moveTo(lineX - 3, wallThickness * 0.5 * heightVariation)
                ctx.lineTo(lineX, wallThickness * 0.5 * heightVariation + 5)
                ctx.lineTo(lineX + 3, wallThickness * 0.5 * heightVariation)
                ctx.stroke()
              }

              // Add frost particle effect
              ctx.fillStyle = '#e0f2fe' // Very light blue
              ctx.globalAlpha = 0.6
              for (let i = 0; i < 8; i++) {
                const particleX = -wallLength / 2 + Math.random() * wallLength
                const particleY = -wallThickness / 2 + Math.random() * wallThickness
                const particleSize = 1 + Math.random() * 2

                ctx.beginPath()
                ctx.arc(particleX, particleY, particleSize, 0, 2 * Math.PI)
                ctx.fill()
              }

              // Add cold aura effect
              ctx.strokeStyle = '#0ea5e9' // Blue
              ctx.lineWidth = 1
              ctx.globalAlpha = 0.3 + Math.sin(time * 2) * 0.1
              ctx.beginPath()
              ctx.rect(-wallLength * 0.55, -wallThickness * 0.65, wallLength * 1.1, wallThickness * 1.3)
              ctx.stroke()

              ctx.globalAlpha = 1
              ctx.restore()
            } else {
              // Draw rectangular barrier shape for other characters
              ctx.beginPath()
              ctx.rect(x - radius * 1.5, y - radius * 0.5, radius * 3, radius)
              ctx.fill()
              ctx.stroke()
              
              // Add reinforcement lines
              ctx.strokeStyle = '#ffffff'
              ctx.lineWidth = 1
              ctx.globalAlpha = 0.7
              for (let i = 0; i < 3; i++) {
                const lineX = x - radius + (i * radius)
                ctx.beginPath()
                ctx.moveTo(lineX, y - radius * 0.5)
                ctx.lineTo(lineX, y + radius * 0.5)
                ctx.stroke()
              }
              ctx.globalAlpha = 1
            }
            break
            
          case 'sphere': // Plasma Vortex - energy sphere that becomes vortex
            if (projectile.hasFormedVortex) {
              // Simple, clean vortex design
              const time = Date.now() * 0.002
              const rotation = time * 2
              
              ctx.save()
              ctx.translate(x, y)
              
              // Outer boundary ring
              ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)'
              ctx.lineWidth = 2
              ctx.beginPath()
              ctx.arc(0, 0, radius, 0, 2 * Math.PI)
              ctx.stroke()
              
              // Inner rotating ring
              ctx.save()
              ctx.rotate(rotation)
              ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)'
              ctx.lineWidth = 3
              // Removed dashed inner ring for cleaner visuals
              ctx.beginPath()
              ctx.arc(0, 0, radius * 0.7, 0, 2 * Math.PI)
              ctx.stroke()
              ctx.restore()
              
              // Central core
              const coreSize = radius * 0.15 * (1 + Math.sin(time * 8) * 0.3)
              ctx.fillStyle = 'rgba(139, 92, 246, 0.9)'
              ctx.beginPath()
              ctx.arc(0, 0, coreSize, 0, 2 * Math.PI)
              ctx.fill()
              
              // Suction visuals removed to match non-suction physics behavior
              
              ctx.restore()
            } else {
              // Simple energy bullet
              const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.2
              
              // Glowing sphere
              ctx.shadowBlur = 10
              ctx.shadowColor = '#8b5cf6'
              ctx.fillStyle = '#8b5cf6'
              ctx.beginPath()
              ctx.arc(x, y, radius * pulse, 0, 2 * Math.PI)
              ctx.fill()
              
              // White center
              ctx.shadowBlur = 0
              ctx.fillStyle = '#ffffff'
              ctx.beginPath()
              ctx.arc(x, y, radius * 0.5, 0, 2 * Math.PI)
              ctx.fill()
            }
            break
            
          case 'circle': // Default circle, special handling for shockwave and earthquake
            if (projectile.isShockwave) {
              // Draw expanding shockwave (Steel Guardian)
              ctx.strokeStyle = projectileConfig.bulletColor
              ctx.lineWidth = 3
              ctx.globalAlpha = 0.7
              
              // Outer expanding ring
              ctx.beginPath()
              ctx.arc(x, y, radius, 0, 2 * Math.PI)
              ctx.stroke()
              
              // Inner pulse ring
              ctx.lineWidth = 2
              ctx.globalAlpha = 0.4
              ctx.beginPath()
              ctx.arc(x, y, radius * 0.7, 0, 2 * Math.PI)
              ctx.stroke()
              
              // Energy waves effect
              const time = Date.now() * 0.005
              ctx.strokeStyle = '#ffffff'
              ctx.lineWidth = 1
              ctx.globalAlpha = 0.6
              for (let i = 0; i < 3; i++) {
                const waveRadius = radius * (0.3 + i * 0.2) + Math.sin(time + i) * 5
                // Ensure radius is always positive
                const safeRadius = Math.max(1, waveRadius)
                ctx.beginPath()
                ctx.arc(x, y, safeRadius, 0, 2 * Math.PI)
                ctx.stroke()
              }
              ctx.globalAlpha = 1
            } else if (projectile.isEarthquake) {
              // Draw expanding earthquake (Iron Titan)
              const waveNumber = projectile.waveNumber || 1
              ctx.strokeStyle = projectileConfig.bulletColor
              ctx.lineWidth = 4 + waveNumber // Thicker lines for later waves
              ctx.globalAlpha = 0.8
              
              // Main earthquake ring
              ctx.beginPath()
              ctx.arc(x, y, radius, 0, 2 * Math.PI)
              ctx.stroke()
              
              // Ground fracture effect
              ctx.strokeStyle = '#8b5a00' // Brown fracture lines
              ctx.lineWidth = 2
              ctx.globalAlpha = 0.6
              for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI * 2) / 8
                const innerR = radius * 0.3
                const outerR = radius * 1.1
                const x1 = x + Math.cos(angle) * innerR
                const y1 = y + Math.sin(angle) * innerR
                const x2 = x + Math.cos(angle) * outerR
                const y2 = y + Math.sin(angle) * outerR
                
                ctx.beginPath()
                ctx.moveTo(x1, y1)
                ctx.lineTo(x2, y2)
                ctx.stroke()
              }
              
              // Debris effect
              const time = Date.now() * 0.01
              ctx.fillStyle = '#666666'
              ctx.globalAlpha = 0.4
              for (let i = 0; i < 6; i++) {
                const debrisAngle = (i * Math.PI * 2) / 6 + time
                const debrisR = radius * (0.6 + Math.sin(time + i) * 0.2)
                const debrisX = x + Math.cos(debrisAngle) * debrisR
                const debrisY = y + Math.sin(debrisAngle) * debrisR
                ctx.beginPath()
                ctx.arc(debrisX, debrisY, 2, 0, 2 * Math.PI)
                ctx.fill()
              }
              
              ctx.globalAlpha = 1
            } else {
              // Regular circle projectile
              ctx.beginPath()
              ctx.arc(x, y, radius, 0, 2 * Math.PI)
              ctx.fill()
              ctx.stroke()
            }
            break
            
          case 'thread': // Mystic Orb - magical thread
            // Draw wavy thread
            ctx.beginPath()
            ctx.lineWidth = radius * 0.8
            ctx.strokeStyle = projectileConfig.bulletColor
            
            const waveLength = radius * 4
            const amplitude = radius * 0.5
            const threadTime = Date.now() * 0.005
            
            ctx.moveTo(x - waveLength, y)
            for (let i = 0; i <= waveLength * 2; i += 2) {
              const waveX = x - waveLength + i
              const waveY = y + Math.sin((i / 10) + threadTime) * amplitude
              ctx.lineTo(waveX, waveY)
            }
            ctx.stroke()
            
            // Add magical sparkles
            ctx.fillStyle = '#ffffff'
            ctx.globalAlpha = 0.8
            for (let i = 0; i < 3; i++) {
              const sparkX = x + (Math.random() - 0.5) * radius * 2
              const sparkY = y + (Math.random() - 0.5) * radius * 2
              ctx.beginPath()
              ctx.arc(sparkX, sparkY, 1, 0, 2 * Math.PI)
              ctx.fill()
            }
            ctx.globalAlpha = 1
            break
            
          default: // Flame and others - enhanced circle
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, 2 * Math.PI)
            ctx.fill()
            
            // Add flame effect for fire character
            if (projectileConfig.bulletStyle === 'flame') {
              ctx.strokeStyle = '#ff6b35'
              ctx.lineWidth = 2
              ctx.globalAlpha = 0.6
              const time = Date.now() * 0.02
              for (let i = 0; i < 4; i++) {
                const angle = time + (i * Math.PI / 2)
                const flameX = Math.cos(angle) * radius * 1.2
                const flameY = Math.sin(angle) * radius * 1.2
                ctx.beginPath()
                ctx.arc(x + flameX, y + flameY, 2, 0, 2 * Math.PI)
                ctx.stroke()
              }
              ctx.globalAlpha = 1
            }
            ctx.stroke()
            break
        }
      }
      
      ctx.restore()
      
      // Special projectile effects (optimized)
      ctx.save()
      
      // Cache time calculation for all effects
      const effectTime = Date.now() * 0.01
      
      // Explosive projectiles - pulsing danger indicator
      if (projectile.explosive) {
  const pulseRadius = radius + Math.sin(effectTime) * 2 // Reduced from 3 to 2
  // Ensure we never pass a negative or zero radius to ctx.arc which would throw
  const safePulseRadius = Math.max(0.5, pulseRadius)
  ctx.strokeStyle = '#ff4444'
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.5 // Reduced from 0.6
  ctx.beginPath()
  ctx.arc(x, y, safePulseRadius, 0, 2 * Math.PI)
  ctx.stroke()
  ctx.globalAlpha = 1
      }
      
      // Electric projectiles - crackling effect (reduced complexity)
      if (projectile.electric) {
        ctx.strokeStyle = '#44aaff'
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.6 // Reduced from 0.8
        // Reduced from 6 sparks to 4 for performance
        for (let i = 0; i < 4; i++) {
          const angle = effectTime + (i * Math.PI / 2)
          const sparkX = Math.cos(angle) * (radius + 4) // Reduced from 5 to 4
          const sparkY = Math.sin(angle) * (radius + 4)
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + sparkX, y + sparkY)
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      }
      
      // Homing projectiles - targeting reticle
      if (projectile.homing) {
        const time = Date.now() * 0.005
        const reticleRadius = radius + 8 + Math.sin(time) * 2
        ctx.strokeStyle = '#ff44ff'
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.7
        
        // Draw targeting circles
        ctx.beginPath()
        ctx.arc(x, y, reticleRadius, 0, 2 * Math.PI)
        ctx.stroke()
        
        ctx.beginPath()
        ctx.arc(x, y, reticleRadius - 4, 0, 2 * Math.PI)
        ctx.stroke()
        
        // Draw crosshairs
        ctx.beginPath()
        ctx.moveTo(x - reticleRadius - 3, y)
        ctx.lineTo(x - reticleRadius + 3, y)
        ctx.moveTo(x + reticleRadius - 3, y)
        ctx.lineTo(x + reticleRadius + 3, y)
        ctx.moveTo(x, y - reticleRadius - 3)
        ctx.lineTo(x, y - reticleRadius + 3)
        ctx.moveTo(x, y + reticleRadius - 3)
        ctx.lineTo(x, y + reticleRadius + 3)
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      
      // Freezing projectiles - ice crystals
      if (projectile.freezing) {
        const time = Date.now() * 0.01
        ctx.strokeStyle = '#44ddff'
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.6
        for (let i = 0; i < 8; i++) {
          const angle = time + (i * Math.PI / 4)
          const crystalSize = 4 + Math.sin(time + i) * 2
          const crystalX = Math.cos(angle) * (radius + 6)
          const crystalY = Math.sin(angle) * (radius + 6)
          
          ctx.beginPath()
          ctx.moveTo(x + crystalX - crystalSize, y + crystalY)
          ctx.lineTo(x + crystalX + crystalSize, y + crystalY)
          ctx.moveTo(x + crystalX, y + crystalY - crystalSize)
          ctx.lineTo(x + crystalX, y + crystalY + crystalSize)
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      }
      
      // Piercing projectiles - energy aura
      if (projectile.piercing > 0) {
        const auraRadius = radius + 3
        ctx.strokeStyle = '#ffff44'
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.arc(x, y, auraRadius, 0, 2 * Math.PI)
        ctx.stroke()
        
        // Add piercing lines
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI / 2) + Date.now() * 0.01
          const lineStartX = Math.cos(angle) * radius
          const lineStartY = Math.sin(angle) * radius
          const lineEndX = Math.cos(angle) * auraRadius
          const lineEndY = Math.sin(angle) * auraRadius
          
          ctx.beginPath()
          ctx.moveTo(x + lineStartX, y + lineStartY)
          ctx.lineTo(x + lineEndX, y + lineEndY)
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      }
      
      ctx.restore()
      
      // Enhanced trail effect based on character
      const projectileVelocity = Vector.magnitude(entity.velocity)
      if (projectileVelocity > 100 && (projectileCharacterType === 'default' || projectileConfig.trailEffect)) {
        const trailLength = Math.min(projectileVelocity * 0.15, 25) * scale
        const direction = Vector.normalize(Vector.multiply(entity.velocity, -1))
        const trailEnd = Vector.add(entity.position, Vector.multiply(direction, trailLength / scale))
        
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(trailEnd.x * scale, trailEnd.y * scale)
        
        // Character-specific trail effects
        if (projectileCharacterType === 'striker') {
          // Enhanced electric trail with crackling effect and multiple segments
          ctx.strokeStyle = projectileConfig.electricColor || '#fbbf24';
          ctx.lineWidth = Math.max(3, radius * 1.2);
          ctx.shadowColor = projectileConfig.electricColor || '#fbbf24';
          ctx.shadowBlur = 8;
          ctx.globalAlpha = 0.9;
          
          // Add crackling effect to the trail
          ctx.lineCap = 'round';
          const crackleTime = Date.now() * 0.02;
          const trailSegments = 3;
          const segmentLength = trailLength / trailSegments;
          
          for (let i = 0; i < trailSegments; i++) {
            const offset = Math.sin(crackleTime + i) * 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(trailEnd.x * scale + offset, trailEnd.y * scale + offset);
            ctx.stroke();
          }
          
          // Add electric sparks along the trail
          if (projectileConfig.electricParticles) {
            for (let i = 0; i < 5; i++) {
              const sparkX = x + (trailEnd.x * scale - x) * (i / 5) + (Math.random() - 0.5) * 10;
              const sparkY = y + (trailEnd.y * scale - y) * (i / 5) + (Math.random() - 0.5) * 10;
              const sparkSize = 1 + Math.random() * 2;
              
              ctx.beginPath();
              ctx.arc(sparkX, sparkY, sparkSize, 0, 2 * Math.PI);
              ctx.fillStyle = projectileConfig.electricColor || '#fbbf24';
              ctx.globalAlpha = 0.7;
              ctx.fill();
            }
          }
          ctx.globalAlpha = 0.9;
        } else if (projectileCharacterType === 'vortex' && projectileConfig.bulletStyle === 'spinning') {
          // Spiral trail
          ctx.strokeStyle = projectileConfig.bulletColor
          ctx.lineWidth = Math.max(2, radius * 0.6)
          ctx.shadowColor = projectileConfig.bulletColor
          ctx.shadowBlur = 3 // Reduced from 8 to 3
          ctx.globalAlpha = 0.7
        } else if (projectileCharacterType === 'flame' && projectileConfig.bulletStyle === 'flame') {
          // Fire trail
          ctx.strokeStyle = '#ff6b35'
          ctx.lineWidth = Math.max(3, radius * 0.9)
          ctx.shadowColor = '#ff6b35'
          ctx.shadowBlur = 5 // Reduced from 12 to 5
          ctx.globalAlpha = 0.6
        } else if (projectileCharacterType === 'shadow' && projectileConfig.bulletStyle === 'shadow') {
          // Dark shadow trail
          ctx.strokeStyle = '#1f2937'
          ctx.lineWidth = Math.max(2, radius * 0.7)
          ctx.globalAlpha = 0.5
        } else if (projectileCharacterType === 'archer' && projectileConfig.bulletStyle === 'piercing') {
          // Wind trail
          ctx.strokeStyle = '#10b981'
          ctx.lineWidth = Math.max(2, radius * 0.5)
          ctx.shadowColor = '#10b981'
          ctx.shadowBlur = 3
          ctx.globalAlpha = 0.8
        } else if (projectileCharacterType === 'samurai' && projectileConfig.bulletStyle === 'slashing') {
          // Energy slash trail
          ctx.strokeStyle = '#7c3aed'
          ctx.lineWidth = Math.max(4, radius * 1.0)
          ctx.shadowColor = '#7c3aed'
          ctx.shadowBlur = 6
          ctx.globalAlpha = 0.7
        } else if (projectileCharacterType === 'sniper' && projectileConfig.bulletStyle === 'piercing') {
          // Void trail
          ctx.strokeStyle = '#0f172a'
          ctx.lineWidth = Math.max(1, radius * 0.3)
          ctx.shadowColor = '#8b5cf6'
          ctx.shadowBlur = 4
          ctx.globalAlpha = 0.9
        } else if (projectileCharacterType === 'bomber' && projectileConfig.bulletStyle === 'explosive') {
          // Explosive trail with sparks
          ctx.strokeStyle = '#f97316'
          ctx.lineWidth = Math.max(3, radius * 0.8)
          ctx.shadowColor = '#f97316'
          ctx.shadowBlur = 5
          ctx.globalAlpha = 0.6
        } else {
          // Default trail
          ctx.strokeStyle = projectileCharacterType === 'default' ? '#fbbf24' : projectileConfig.bulletColor;
          ctx.lineWidth = Math.max(2, radius * 0.5);
          ctx.globalAlpha = 0.7
        }
        
        ctx.stroke()
        ctx.restore()
      }
      break
      
    case 'pickup':
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = '#a855f7' // purple-500
      ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  // Removed dashed outline for pickups
  ctx.stroke()
      
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
