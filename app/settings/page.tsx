'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Volume2, VolumeX, Monitor, Gamepad2, Bug, RotateCcw, Save } from 'lucide-react'

interface GameSettings {
  soundEnabled: boolean
  musicEnabled: boolean
  debugMode: boolean
  showFPS: boolean
  autoSave: boolean
  difficulty: 'easy' | 'normal' | 'hard'
  arenaTheme: 'default' | 'neon' | 'space' | 'forest'
}

const defaultSettings: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  debugMode: false,
  showFPS: false,
  autoSave: true,
  difficulty: 'normal',
  arenaTheme: 'default'
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings)
  const [showSaveNotification, setShowSaveNotification] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('circlash-settings')
    if (savedSettings) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) })
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
  }, [])

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem('circlash-settings', JSON.stringify(newSettings))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    localStorage.setItem('circlash-settings', JSON.stringify(defaultSettings))
    showSaveMessage()
  }

  const showSaveMessage = () => {
    setShowSaveNotification(true)
    setTimeout(() => setShowSaveNotification(false), 2000)
  }

  const handleSave = () => {
    localStorage.setItem('circlash-settings', JSON.stringify(settings))
    showSaveMessage()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <Settings className="w-8 h-8 text-primary-400" />
            <h1 className="text-4xl font-bold text-white">Game Settings</h1>
          </motion.div>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Customize your gaming experience and debug options
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {/* Audio Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800 rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary-400" />
              Audio Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Sound Effects</label>
                  <p className="text-slate-400 text-sm">Enable game sound effects</p>
                </div>
                <button
                  onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.soundEnabled ? 'bg-primary-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Background Music</label>
                  <p className="text-slate-400 text-sm">Enable background music</p>
                </div>
                <button
                  onClick={() => updateSetting('musicEnabled', !settings.musicEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.musicEnabled ? 'bg-primary-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.musicEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Game Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800 rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary-400" />
              Game Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-white font-medium block mb-2">Difficulty</label>
                <select
                  value={settings.difficulty}
                  onChange={(e) => updateSetting('difficulty', e.target.value as GameSettings['difficulty'])}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-primary-400 focus:outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="text-white font-medium block mb-2">Arena Theme</label>
                <select
                  value={settings.arenaTheme}
                  onChange={(e) => updateSetting('arenaTheme', e.target.value as GameSettings['arenaTheme'])}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-primary-400 focus:outline-none"
                >
                  <option value="default">Default</option>
                  <option value="neon">Neon</option>
                  <option value="space">Space</option>
                  <option value="forest">Forest</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Auto Save</label>
                  <p className="text-slate-400 text-sm">Automatically save progress</p>
                </div>
                <button
                  onClick={() => updateSetting('autoSave', !settings.autoSave)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoSave ? 'bg-primary-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoSave ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Debug Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800 rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Bug className="w-5 h-5 text-primary-400" />
              Debug Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Debug Mode</label>
                  <p className="text-slate-400 text-sm">Enable debug console logs</p>
                </div>
                <button
                  onClick={() => updateSetting('debugMode', !settings.debugMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.debugMode ? 'bg-primary-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.debugMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Show FPS</label>
                  <p className="text-slate-400 text-sm">Display frame rate counter</p>
                </div>
                <button
                  onClick={() => updateSetting('showFPS', !settings.showFPS)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showFPS ? 'bg-primary-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showFPS ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            
            {settings.debugMode && (
              <div className="mt-6 p-4 bg-slate-700 rounded-lg">
                <h3 className="text-white font-medium mb-2">Debug Information</h3>
                <div className="text-sm text-slate-300 space-y-1">
                  <p>• Console logs will show detailed game information</p>
                  <p>• Bullet shooting debug logs enabled</p>
                  <p>• Hazard creation logs enabled</p>
                  <p>• Press F12 to open Developer Tools</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <button
              onClick={handleSave}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105"
            >
              <Save className="w-5 h-5" />
              Save Settings
            </button>
            <button
              onClick={resetSettings}
              className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105"
            >
              <RotateCcw className="w-5 h-5" />
              Reset to Default
            </button>
            <a
              href="/"
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105"
            >
              ← Back to Home
            </a>
          </motion.div>
        </div>

        {/* Save Notification */}
        {showSaveNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>Settings saved successfully!</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}