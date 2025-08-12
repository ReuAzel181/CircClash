'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { Home, RotateCcw } from 'lucide-react'

function PlayPageContent() {
  const searchParams = useSearchParams()
  const arenaW = searchParams.get('arenaW') || '800'
  const arenaH = searchParams.get('arenaH') || '600'
  const mode = searchParams.get('mode') || 'roulette'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Game Arena</h1>
              <p className="text-gray-600">Experience the ultimate circle battle</p>
            </div>
            <a 
              href="/"
              className="btn-secondary flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </a>
          </div>
        </div>
        
        {/* Game Settings */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm border p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Game Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 mb-2">Arena Width</label>
              <div className="bg-gray-100 px-4 py-2 rounded-lg text-gray-900 font-mono">{arenaW}px</div>
            </div>
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 mb-2">Arena Height</label>
              <div className="bg-gray-100 px-4 py-2 rounded-lg text-gray-900 font-mono">{arenaH}px</div>
            </div>
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 mb-2">Game Mode</label>
              <div className="bg-gray-100 px-4 py-2 rounded-lg text-gray-900 font-mono capitalize">{mode}</div>
            </div>
          </div>
        </motion.div>
        
        {/* Game Canvas Area */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm border overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="h-[500px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Game Coming Soon</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                The full game interface is being developed. For now, try the Quick Play mode 
                which has a working battle system!
              </p>
              <div className="flex gap-3 justify-center">
                <a href="/quickplay" className="btn-primary">
                  Try Quick Play
                </a>
                <a href="/" className="btn-secondary">
                  Back to Home
                </a>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Mode Info */}
        <motion.div 
          className="mt-6 bg-white rounded-xl shadow-sm border p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-3">About {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode</h3>
          <div className="text-gray-600">
            {mode === 'roulette' && (
              <p>Random 1v1 battles with mystery opponents and unpredictable matchups. Perfect for quick, exciting rounds!</p>
            )}
            {mode === 'quickplay' && (
              <p>Instant battles with AI opponents. No setup required - just jump in and start fighting!</p>
            )}
            {mode === 'battle-royale' && (
              <p>Last circle standing wins! Face multiple opponents in an epic survival battle arena.</p>
            )}
            {mode === 'custom' && (
              <p>Create your own battle scenarios with custom rules, arena sizes, and opponent configurations.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function PlayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚡</div>
          <div className="text-gray-600 text-lg">Loading game...</div>
        </div>
      </div>
    }>
      <PlayPageContent />
    </Suspense>
  )
}
