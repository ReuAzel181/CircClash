'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Play, Zap, Users, Trophy } from 'lucide-react'

export default function Hero() {
  const router = useRouter()

  const handlePlayNow = () => {
    // Navigate directly to quickplay for immediate action
    router.push('/quickplay')
  }

  return (
    <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto text-center">
        {/* Logo/Title */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-5xl sm:text-6xl mb-4 animate-bounce-gentle">⚡</div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-4">
            <span className="gaming-title">Circlash!</span>
          </h1>
        </motion.div>
        
        {/* Tagline */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            The ultimate circle battle arena where strategy meets action.
            <br className="hidden sm:block" />
            <span className="text-primary-600 font-semibold">Play instantly. No downloads required.</span>
          </p>
        </motion.div>
        
        {/* Main CTA */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <button
            onClick={handlePlayNow}
            className="btn-primary text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-5 rounded-xl 
                     transform hover:scale-110 transition-all duration-300 
                     focus:ring-4 focus:ring-primary-500/50 group"
            aria-label="Start playing Circlash now"
          >
            <span className="flex items-center gap-3">
              <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="font-bold">PLAY NOW</span>
            </span>
          </button>
        </motion.div>
        
        {/* Quick stats */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 
                          rounded-full mb-3 group-hover:bg-primary-200 transition-colors">
              <Zap className="w-6 h-6 text-primary-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">5</div>
            <div className="text-sm text-gray-600">Game Modes</div>
          </div>
          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-accent-100 
                          rounded-full mb-3 group-hover:bg-accent-200 transition-colors">
              <Users className="w-6 h-6 text-accent-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">12+</div>
            <div className="text-sm text-gray-600">Characters</div>
          </div>
          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-success-100 
                          rounded-full mb-3 group-hover:bg-success-200 transition-colors">
              <Trophy className="w-6 h-6 text-success-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">∞</div>
            <div className="text-sm text-gray-600">Possibilities</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
