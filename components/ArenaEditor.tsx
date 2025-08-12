'use client'

import { useState, useEffect } from 'react'
import { 
  ArenaSettings, 
  Hazard, 
  defaultArenaSettings, 
  hazardTypes, 
  validateArenaSettings,
  generateArenaId,
  saveArenaToLocalStorage,
  loadArenasFromLocalStorage,
  exportArenaAsJSON
} from '../data/arena'
import ArenaPreview from './ArenaPreview'

interface ArenaEditorProps {
  onSettingsChange?: (settings: ArenaSettings) => void
}

export default function ArenaEditor({ onSettingsChange }: ArenaEditorProps) {
  const [settings, setSettings] = useState<ArenaSettings>(defaultArenaSettings)
  const [zoom, setZoom] = useState(0.5)
  const [showGrid, setShowGrid] = useState(true)
  const [selectedHazard, setSelectedHazard] = useState<string | null>(null)
  const [selectedHazardType, setSelectedHazardType] = useState<Hazard['type']>('spike')
  const [errors, setErrors] = useState<string[]>([])
  const [presets, setPresets] = useState<ArenaSettings[]>([])
  const [showPresets, setShowPresets] = useState(false)
  const [showToast, setShowToast] = useState<string | null>(null)

  useEffect(() => {
    setPresets(loadArenasFromLocalStorage())
  }, [])

  useEffect(() => {
    const validationErrors = validateArenaSettings(settings)
    setErrors(validationErrors)
    
    if (onSettingsChange) {
      onSettingsChange(settings)
    }
  }, [settings, onSettingsChange])

  const showToastMessage = (message: string) => {
    setShowToast(message)
    setTimeout(() => setShowToast(null), 3000)
  }

  const updateSettings = (updates: Partial<ArenaSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }

  const handleDimensionChange = (dimension: 'width' | 'height', value: string) => {
    const numValue = parseInt(value) || 0
    updateSettings({ [dimension]: numValue })
  }

  const addHazard = () => {
    const newHazard: Hazard = {
      id: `hazard_${Date.now()}`,
      type: selectedHazardType,
      x: Math.random() * (settings.width - 50),
      y: Math.random() * (settings.height - 50),
      width: 40,
      height: 40,
      rotation: 0
    }

    updateSettings({
      hazards: [...settings.hazards, newHazard]
    })
  }

  const removeHazard = (hazardId: string) => {
    updateSettings({
      hazards: settings.hazards.filter(h => h.id !== hazardId)
    })
    if (selectedHazard === hazardId) {
      setSelectedHazard(null)
    }
  }

  const updateHazard = (hazardId: string, updates: Partial<Hazard>) => {
    updateSettings({
      hazards: settings.hazards.map(h => 
        h.id === hazardId ? { ...h, ...updates } : h
      )
    })
  }

  const savePreset = () => {
    if (errors.length > 0) {
      showToastMessage('Please fix validation errors before saving')
      return
    }

    const newSettings = {
      ...settings,
      id: generateArenaId(),
      created: new Date().toISOString()
    }

    saveArenaToLocalStorage(newSettings)
    setPresets(loadArenasFromLocalStorage())
    showToastMessage('Arena preset saved!')
  }

  const loadPreset = (preset: ArenaSettings) => {
    setSettings(preset)
    setShowPresets(false)
    showToastMessage('Arena preset loaded!')
  }

  const exportArena = () => {
    if (errors.length > 0) {
      showToastMessage('Please fix validation errors before exporting')
      return
    }

    exportArenaAsJSON(settings)
    showToastMessage('Arena exported as JSON!')
  }

  const importArena = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        setSettings(imported)
        showToastMessage('Arena imported successfully!')
      } catch (error) {
        showToastMessage('Failed to import arena: Invalid JSON')
      }
    }
    reader.readAsText(file)
  }

  const selectedHazardObj = selectedHazard 
    ? settings.hazards.find(h => h.id === selectedHazard)
    : null

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Left Panel - Controls */}
      <div className="xl:col-span-1 space-y-6">
        {/* Basic Settings */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Arena Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Arena Name
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => updateSettings({ name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="My Arena"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Width (px)
                </label>
                <input
                  type="number"
                  min="400"
                  max="2048"
                  value={settings.width}
                  onChange={(e) => handleDimensionChange('width', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Height (px)
                </label>
                <input
                  type="number"
                  min="240"
                  max="2048"
                  value={settings.height}
                  onChange={(e) => handleDimensionChange('height', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Background Style
              </label>
              <select
                value={settings.background}
                onChange={(e) => updateSettings({ background: e.target.value as ArenaSettings['background'] })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="grid">Grid</option>
                <option value="dark">Dark</option>
                <option value="neon">Neon</option>
                <option value="space">Space</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Grid Size (px)
              </label>
              <input
                type="number"
                min="10"
                max="50"
                value={settings.gridSize}
                onChange={(e) => updateSettings({ gridSize: parseInt(e.target.value) || 20 })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
              <div className="text-sm text-red-400">
                {errors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* View Controls */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">View Controls</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Zoom: {Math.round(zoom * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showGrid"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="showGrid" className="text-sm text-slate-300">
                Show Grid
              </label>
            </div>
          </div>
        </div>

        {/* Hazard Controls */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Hazards</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Hazard Type
              </label>
              <select
                value={selectedHazardType}
                onChange={(e) => setSelectedHazardType(e.target.value as Hazard['type'])}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {hazardTypes.map(type => (
                  <option key={type.type} value={type.type}>
                    {type.icon} {type.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={addHazard}
              className="w-full btn-secondary"
            >
              Add Hazard
            </button>

            {/* Hazard List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {settings.hazards.map(hazard => {
                const hazardType = hazardTypes.find(t => t.type === hazard.type)
                return (
                  <div
                    key={hazard.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedHazard === hazard.id
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-slate-600 bg-slate-700 hover:bg-slate-600'
                    }`}
                    onClick={() => setSelectedHazard(hazard.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>{hazardType?.icon}</span>
                        <span className="text-sm text-white">{hazardType?.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeHazard(hazard.id)
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Hazard Properties */}
        {selectedHazardObj && (
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Hazard Properties</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">X</label>
                  <input
                    type="number"
                    value={Math.round(selectedHazardObj.x)}
                    onChange={(e) => updateHazard(selectedHazardObj.id, { x: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Y</label>
                  <input
                    type="number"
                    value={Math.round(selectedHazardObj.y)}
                    onChange={(e) => updateHazard(selectedHazardObj.id, { y: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Width</label>
                  <input
                    type="number"
                    min="10"
                    value={selectedHazardObj.width}
                    onChange={(e) => updateHazard(selectedHazardObj.id, { width: parseInt(e.target.value) || 10 })}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Height</label>
                  <input
                    type="number"
                    min="10"
                    value={selectedHazardObj.height}
                    onChange={(e) => updateHazard(selectedHazardObj.id, { height: parseInt(e.target.value) || 10 })}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Rotation: {selectedHazardObj.rotation}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selectedHazardObj.rotation}
                  onChange={(e) => updateHazard(selectedHazardObj.id, { rotation: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Center Panel - Preview */}
      <div className="xl:col-span-2">
        <ArenaPreview
          settings={settings}
          zoom={zoom}
          showGrid={showGrid}
          selectedHazard={selectedHazard}
          onHazardClick={(hazard) => setSelectedHazard(hazard.id)}
        />

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-4">
          <button
            onClick={savePreset}
            className="btn-primary"
            disabled={errors.length > 0}
          >
            Save Preset
          </button>
          
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="btn-secondary"
          >
            Load Preset ({presets.length})
          </button>
          
          <button
            onClick={exportArena}
            className="btn-secondary"
            disabled={errors.length > 0}
          >
            Export JSON
          </button>
          
          <label className="btn-secondary cursor-pointer">
            Import JSON
            <input
              type="file"
              accept=".json"
              onChange={importArena}
              className="hidden"
            />
          </label>
        </div>

        {/* Presets List */}
        {showPresets && (
          <div className="mt-6 bg-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Saved Presets</h3>
            {presets.length === 0 ? (
              <p className="text-slate-400">No presets saved yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {presets.map(preset => (
                  <div
                    key={preset.id}
                    className="p-4 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors"
                    onClick={() => loadPreset(preset)}
                  >
                    <h4 className="font-semibold text-white">{preset.name}</h4>
                    <p className="text-sm text-slate-400">
                      {preset.width} × {preset.height} | {preset.hazards.length} hazards
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(preset.created).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-primary-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up">
          {showToast}
        </div>
      )}
    </div>
  )
}
