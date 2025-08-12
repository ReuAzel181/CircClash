'use client'

import { useState } from 'react'
import ArenaEditor from '../../components/ArenaEditor'
import { ArenaSettings } from '../../data/arena'

export default function EditorPage() {
  const [currentSettings, setCurrentSettings] = useState<ArenaSettings | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Arena Editor</h1>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            Design and customize your battle arena. Set dimensions, add hazards, and create 
            the perfect environment for epic circle battles. Save your creations as presets 
            and export them to share with others.
          </p>
        </div>

        {/* Quick Tips */}
        <div className="bg-slate-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">🎯 Quick Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-primary-400">📏</span>
              <div>
                <strong className="text-white">Size Limits:</strong>
                <br />
                <span className="text-slate-300">Min: 400×240px, Max: 2048×2048px</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-400">⚠️</span>
              <div>
                <strong className="text-white">Hazards:</strong>
                <br />
                <span className="text-slate-300">Click on arena to place, drag to move</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-400">💾</span>
              <div>
                <strong className="text-white">Save & Load:</strong>
                <br />
                <span className="text-slate-300">Create presets for quick access</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-400">📤</span>
              <div>
                <strong className="text-white">Export:</strong>
                <br />
                <span className="text-slate-300">Share your arenas as JSON files</span>
              </div>
            </div>
          </div>
        </div>

        {/* Arena Editor Component */}
        <ArenaEditor onSettingsChange={setCurrentSettings} />

        {/* Arena Info */}
        {currentSettings && (
          <div className="mt-8 bg-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Current Arena Info</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Name:</span>
                <div className="text-white font-semibold">{currentSettings.name}</div>
              </div>
              <div>
                <span className="text-slate-400">Dimensions:</span>
                <div className="text-white font-semibold">
                  {currentSettings.width} × {currentSettings.height}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Hazards:</span>
                <div className="text-white font-semibold">{currentSettings.hazards.length}</div>
              </div>
              <div>
                <span className="text-slate-400">Background:</span>
                <div className="text-white font-semibold capitalize">{currentSettings.background}</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/" className="btn-secondary">
              ← Back to Homepage
            </a>
            <a href="/play" className="btn-primary">
              Test Arena in Game →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
