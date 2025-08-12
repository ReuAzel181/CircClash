'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ArenaSettings {
  width: string
  height: string
}

export default function ArenaQuickEditor() {
  const router = useRouter()
  const [arenaSettings, setArenaSettings] = useState<ArenaSettings>({
    width: '800',
    height: '600'
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('circlash-arena')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setArenaSettings({
          width: parsed.width || '800',
          height: parsed.height || '600'
        })
      } catch (e) {
        console.warn('Failed to parse arena settings from localStorage')
      }
    }
  }, [])

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('circlash-arena', JSON.stringify(arenaSettings))
  }, [arenaSettings])

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || /^\d+$/.test(value)) {
      setArenaSettings(prev => ({ ...prev, width: value }))
    }
  }

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || /^\d+$/.test(value)) {
      setArenaSettings(prev => ({ ...prev, height: value }))
    }
  }

  const handleStartWithArena = () => {
    router.push(`/play?arenaW=${arenaSettings.width}&arenaH=${arenaSettings.height}&mode=roulette`)
  }

  const getPreviewAspectRatio = () => {
    const width = parseInt(arenaSettings.width) || 800
    const height = parseInt(arenaSettings.height) || 600
    return (height / width) * 100 // Convert to percentage for aspect ratio
  }

  const getArenaTypeLabel = () => {
    const width = parseInt(arenaSettings.width) || 800
    const height = parseInt(arenaSettings.height) || 600
    const ratio = width / height

    if (Math.abs(ratio - 1) < 0.1) return 'Square Arena'
    if (ratio > 1.5) return 'Wide Arena'
    if (ratio < 0.67) return 'Tall Arena'
    return 'Balanced Arena'
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Controls */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white mb-4">Quick Arena Setup</h3>
          
          {/* Width Input */}
          <div>
            <label 
              htmlFor="arena-width" 
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Arena Width (px)
            </label>
            <input
              id="arena-width"
              type="text"
              value={arenaSettings.width}
              onChange={handleWidthChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="800"
              aria-describedby="width-help"
            />
            <p id="width-help" className="text-xs text-slate-500 mt-1">
              Recommended: 400-1200px
            </p>
          </div>

          {/* Height Input */}
          <div>
            <label 
              htmlFor="arena-height" 
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Arena Height (px)
            </label>
            <input
              id="arena-height"
              type="text"
              value={arenaSettings.height}
              onChange={handleHeightChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="600"
              aria-describedby="height-help"
            />
            <p id="height-help" className="text-xs text-slate-500 mt-1">
              Recommended: 300-900px
            </p>
          </div>

          {/* Arena Type Label */}
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-primary-500/20 text-primary-400 text-sm rounded-full">
              {getArenaTypeLabel()}
            </span>
          </div>
        </div>

        {/* Preview Thumbnail */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-white">Preview</h4>
          
          {/* Arena Preview */}
          <div className="bg-slate-700 rounded-lg p-4 flex items-center justify-center min-h-[200px]">
            <div 
              className="border-2 border-dashed border-primary-500 bg-primary-500/10 rounded relative flex items-center justify-center"
              style={{
                width: '150px',
                height: `${Math.min(Math.max(getPreviewAspectRatio(), 40), 150)}px`
              }}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">🏟️</div>
                <div className="text-xs text-slate-400">
                  {arenaSettings.width} × {arenaSettings.height}
                </div>
              </div>
            </div>
          </div>

          {/* Settings Summary */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Dimensions:</span>
              <span className="text-white">{arenaSettings.width} × {arenaSettings.height}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Aspect Ratio:</span>
              <span className="text-white">
                {((parseInt(arenaSettings.width) || 800) / (parseInt(arenaSettings.height) || 600)).toFixed(2)}:1
              </span>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartWithArena}
            className="btn-primary w-full"
            disabled={!arenaSettings.width || !arenaSettings.height}
            aria-label="Start game with current arena settings"
          >
            <span className="flex items-center justify-center gap-2">
              <span>🚀</span>
              <span>Start with Current Arena</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
