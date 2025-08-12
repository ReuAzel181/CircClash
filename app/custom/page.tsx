'use client'

import { useRouter } from 'next/navigation'

export default function CustomPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-cyan-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl mb-8">⚔️</div>
        <h1 className="text-4xl font-bold mb-4">Custom Mode</h1>
        <p className="text-xl text-green-300 mb-8">
          Create your own battle scenarios!
        </p>
        <p className="text-lg mb-8 max-w-md mx-auto">
          Full customization of game rules, arena settings, and match parameters for endless gameplay possibilities.
        </p>
        
        <div className="space-y-4">
          <div className="text-gray-300">
            <p><strong>Customization options coming:</strong></p>
            <ul className="text-sm mt-2 space-y-1">
              <li>⚙️ Adjustable game rules</li>
              <li>🏟️ Custom arena imports</li>
              <li>🤖 Configurable AI difficulty</li>
              <li>💾 Save/load custom scenarios</li>
              <li>🎲 Random rule generation</li>
            </ul>
          </div>
          
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            🏠 Back to Menu
          </button>
        </div>
      </div>
    </div>
  )
}
