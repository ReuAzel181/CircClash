'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock, ArrowRight } from 'lucide-react'

interface GameMode {
  id: string
  name: string
  description: string
  duration: string
  icon: string
}

interface ModeCardProps {
  mode: GameMode
  onSelect: (mode: GameMode) => void
  index?: number
}

export default function ModeCard({ mode, onSelect, index = 0 }: ModeCardProps) {
  const router = useRouter()

  const handleClick = () => {
    onSelect(mode)
    
    // Navigate to specific mode pages
    switch (mode.id) {
      case 'roulette':
        router.push('/roulette')
        break
      case 'battle-royale':
        router.push('/battle-royale')
        break
      case 'story':
        router.push('/story')
        break
      case 'custom':
        router.push('/custom')
        break
      case 'quickplay':
        router.push('/quickplay')
        break
      default:
        // Fallback to play page
        router.push(`/play?mode=${mode.id}`)
    }
  }

  return (
    <motion.div 
      className="game-mode-card group"
      onClick={handleClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      <div 
        className="text-center h-full flex flex-col"
        role="button"
        tabIndex={0}
        aria-label={`Select ${mode.name} game mode - ${mode.description}, estimated duration ${mode.duration}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        {/* Icon */}
        <div className="text-4xl sm:text-5xl mb-4 group-hover:scale-110 transition-transform duration-200 animate-float">
          {mode.icon}
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
          {mode.name}
        </h3>
        
        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 leading-relaxed flex-grow">
          {mode.description}
        </p>
        
        {/* Duration */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-6">
          <Clock className="w-4 h-4" />
          <span>{mode.duration}</span>
        </div>
        
        {/* CTA Button */}
        <button 
          className="btn-secondary w-full text-sm group-hover:btn-primary group-hover:text-white 
                   transition-all duration-200 flex items-center justify-center gap-2"
          onClick={(e) => {
            e.stopPropagation()
            handleClick()
          }}
        >
          <span>Play {mode.name}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  )
}
