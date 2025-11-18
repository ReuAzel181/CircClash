'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Play, Users, Trophy, Zap, GamepadIcon, Settings, Sparkles } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <motion.div
                className="text-6xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⚔️
              </motion.div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Tarag
              </h1>
              <motion.div
                className="text-6xl"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                🔥
              </motion.div>
            </div>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Watch epic AI battles unfold in real-time. Choose your warriors and witness 
              the ultimate arena combat experience.
            </p>

            <div className="flex items-center justify-center gap-4">
              <motion.button
                onClick={() => router.push('/quickplay')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-6 h-6" />
                Start Battle
              </motion.button>
              
              <motion.button
                onClick={() => router.push('/arena')}
                className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-8 rounded-xl text-lg border border-gray-200 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Users className="w-6 h-6" />
                Arena Mode
              </motion.button>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            className="grid md:grid-cols-3 gap-8 mb-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart AI Combat</h3>
              <p className="text-gray-600">
                Watch intelligent AI fighters battle with unique abilities, strategies, and special moves.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real-Time Action</h3>
              <p className="text-gray-600">
                Experience fast-paced battles with physics-based combat and dynamic environments.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Easy to Watch</h3>
              <p className="text-gray-600">
                Sit back and enjoy the show. No complex controls - just pure entertainment.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-20 left-10 text-6xl opacity-10 animate-pulse">⚔️</div>
        <div className="absolute top-40 right-20 text-4xl opacity-10 animate-pulse" style={{animationDelay: '1s'}}>🛡️</div>
        <div className="absolute bottom-40 left-20 text-5xl opacity-10 animate-pulse" style={{animationDelay: '2s'}}>🔥</div>
        <div className="absolute bottom-20 right-10 text-3xl opacity-10 animate-pulse" style={{animationDelay: '3s'}}>⚡</div>
      </div>
    </div>
  )
}
