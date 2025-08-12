'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Users, Trophy, Clock } from 'lucide-react'

export default function BattleRoyalePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Battle Royale
              </h1>
              <p className="text-gray-600">Last circle standing wins it all</p>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="btn-secondary flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>
        
        {/* Mode Info */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm border p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Battle Royale Mode</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
                <Users className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Up to 8 Players</h3>
              <p className="text-sm text-gray-600">Face multiple opponents</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-3">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900">5-8 Minutes</h3>
              <p className="text-sm text-gray-600">Epic survival battles</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Winner Takes All</h3>
              <p className="text-sm text-gray-600">Last player standing</p>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">How it Works:</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>8 players spawn in a large circular arena</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Arena gradually shrinks, forcing players closer together</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Power-ups and weapons appear throughout the match</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Last player alive wins the match</span>
              </li>
            </ul>
          </div>
        </motion.div>
        
        {/* Coming Soon */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm border overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="h-[400px] flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100">
            <div className="text-center">
              <div className="text-6xl mb-4">👑</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Coming Soon!</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                Battle Royale mode is currently in development. We're working on 
                multiplayer support and arena shrinking mechanics.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => router.push('/quickplay')}
                  className="btn-primary"
                >
                  Try Quick Play Instead
                </button>
                <button 
                  onClick={() => router.push('/')}
                  className="btn-secondary"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Development Status */}
        <motion.div 
          className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Development Roadmap</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-blue-800">✅ Core physics engine</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-blue-800">✅ Single player battles</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-blue-800">🔄 Multiplayer support</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-blue-800">🔄 Arena shrinking mechanics</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-blue-800">⏳ Spectator mode</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
