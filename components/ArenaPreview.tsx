'use client'

import { useEffect, useRef, useCallback } from 'react'
import { ArenaSettings, Hazard } from '../data/arena'

interface ArenaPreviewProps {
  settings: ArenaSettings
  zoom: number
  showGrid: boolean
  selectedHazard?: string | null
  onHazardClick?: (hazard: Hazard) => void
}

export default function ArenaPreview({ 
  settings, 
  zoom, 
  showGrid, 
  selectedHazard,
  onHazardClick 
}: ArenaPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const drawArena = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Calculate display dimensions
    const displayWidth = Math.min(600, settings.width * zoom)
    const displayHeight = Math.min(400, settings.height * zoom)
    
    canvas.width = displayWidth
    canvas.height = displayHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background
    drawBackground(ctx, displayWidth, displayHeight)

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, displayWidth, displayHeight)
    }

    // Draw hazards
    settings.hazards.forEach(hazard => {
      drawHazard(ctx, hazard, zoom)
    })

    // Draw arena border
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, canvas.width, canvas.height)
  }, [settings, zoom, showGrid, selectedHazard])

  useEffect(() => {
    if (canvasRef.current) {
      drawArena()
    }
  }, [settings, zoom, showGrid, selectedHazard])

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    switch (settings.background) {
      case 'dark':
        ctx.fillStyle = '#0f172a' // slate-900
        break
      case 'neon':
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height)
        gradient.addColorStop(0, '#1e293b') // slate-800
        gradient.addColorStop(1, '#312e81') // purple-900
        ctx.fillStyle = gradient
        break
      case 'space':
        ctx.fillStyle = '#000000'
        break
      default: // grid
        ctx.fillStyle = '#1e293b' // slate-800
    }
    ctx.fillRect(0, 0, width, height)

    // Add some texture for space background
    if (settings.background === 'space') {
      // Draw stars
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * width
        const y = Math.random() * height
        const size = Math.random() * 2 + 1
        
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(x, y, size, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
  }

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#475569' // slate-600
    ctx.lineWidth = 1

    const gridSize = settings.gridSize * zoom

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
  }

  const drawHazard = (ctx: CanvasRenderingContext2D, hazard: Hazard, zoom: number) => {
    const x = hazard.x * zoom
    const y = hazard.y * zoom
    const width = hazard.width * zoom
    const height = hazard.height * zoom

    ctx.save()
    
    // Apply rotation
    ctx.translate(x + width / 2, y + height / 2)
    ctx.rotate((hazard.rotation * Math.PI) / 180)
    ctx.translate(-width / 2, -height / 2)

    // Draw hazard based on type
    switch (hazard.type) {
      case 'spike':
        ctx.fillStyle = '#ef4444'
        // Draw triangle spikes
        ctx.beginPath()
        ctx.moveTo(0, height)
        ctx.lineTo(width / 2, 0)
        ctx.lineTo(width, height)
        ctx.closePath()
        ctx.fill()
        break

      case 'fire':
        ctx.fillStyle = '#f97316'
        // Draw flame shape
        ctx.beginPath()
        ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, 2 * Math.PI)
        ctx.fill()
        // Add inner flame
        ctx.fillStyle = '#fbbf24'
        ctx.beginPath()
        ctx.ellipse(width / 2, height / 2, width / 3, height / 3, 0, 0, 2 * Math.PI)
        ctx.fill()
        break

      case 'ice':
        ctx.fillStyle = '#06b6d4'
        // Draw hexagon
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3
          const px = width / 2 + (width / 2) * Math.cos(angle)
          const py = height / 2 + (height / 2) * Math.sin(angle)
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.fill()
        break

      case 'electric':
        ctx.fillStyle = '#eab308'
        // Draw lightning bolt
        ctx.beginPath()
        ctx.moveTo(width * 0.3, 0)
        ctx.lineTo(width * 0.7, height * 0.4)
        ctx.lineTo(width * 0.5, height * 0.4)
        ctx.lineTo(width * 0.8, height)
        ctx.lineTo(width * 0.4, height * 0.6)
        ctx.lineTo(width * 0.6, height * 0.6)
        ctx.closePath()
        ctx.fill()
        break

      case 'void':
        ctx.fillStyle = '#6b21a8'
        // Draw swirling void
        ctx.beginPath()
        ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, 2 * Math.PI)
        ctx.fill()
        // Add inner darkness
        ctx.fillStyle = '#000000'
        ctx.beginPath()
        ctx.ellipse(width / 2, height / 2, width / 4, height / 4, 0, 0, 2 * Math.PI)
        ctx.fill()
        break
    }

    // Highlight if selected
    if (selectedHazard === hazard.id) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.strokeRect(-2, -2, width + 4, height + 4)
    }

    ctx.restore()
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onHazardClick) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clickX = ((event.clientX - rect.left) / canvas.offsetWidth) * canvas.width
    const clickY = ((event.clientY - rect.top) / canvas.offsetHeight) * canvas.height

    // Check if click hit any hazard
    for (let i = settings.hazards.length - 1; i >= 0; i--) {
      const hazard = settings.hazards[i]
      const x = hazard.x * zoom
      const y = hazard.y * zoom
      const width = hazard.width * zoom
      const height = hazard.height * zoom

      if (clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height) {
        onHazardClick(hazard)
        return
      }
    }
  }

  return (
    <div className="bg-slate-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Arena Preview</h3>
        <div className="text-sm text-slate-400">
          {settings.width} × {settings.height} px
        </div>
      </div>
      
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="border border-slate-600 rounded cursor-pointer"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
      
      <div className="mt-4 text-center text-xs text-slate-500">
        Zoom: {Math.round(zoom * 100)}% | Background: {settings.background}
        {showGrid && ` | Grid: ${settings.gridSize}px`}
      </div>
    </div>
  )
}
