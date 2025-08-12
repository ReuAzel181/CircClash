'use client'

import { useRouter } from 'next/navigation'

export default function StoryPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl mb-8">📖</div>
        <h1 className="text-4xl font-bold mb-4">Story Mode</h1>
        <p className="text-xl text-blue-300 mb-8">
          Epic circular adventures await!
        </p>
        <p className="text-lg mb-8 max-w-md mx-auto">
          Journey through the Circlash universe with progressive levels, story dialogue, and unique objectives.
        </p>
        
        <div className="space-y-4">
          <div className="text-gray-300">
            <p><strong>Planned campaign features:</strong></p>
            <ul className="text-sm mt-2 space-y-1">
              <li>📚 10+ story levels</li>
              <li>💬 Character dialogue system</li>
              <li>🎯 Varied objectives (survive, defeat, collect)</li>
              <li>🏆 Progressive difficulty scaling</li>
              <li>🔓 Character unlock progression</li>
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
