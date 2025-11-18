"use client"
import Link from 'next/link'
import { Zap, Github, Shield } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  if (pathname.startsWith('/quickplay')) return null
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Zap className="w-5 h-5 text-primary-500" />
            <span className="ml-2 text-sm text-gray-600">Circlash! © 2025</span>
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <Link href="/about" className="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-1">
              About
            </Link>
            <a 
              href="https://github.com/ReuAzel181/TaraG" 
              className="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <Link href="/privacy" className="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-1">
              <Shield className="w-4 h-4" />
              Privacy
            </Link>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Built with Next.js, TypeScript, and Tailwind CSS. 
            <span className="text-primary-600 font-medium"> Open source circle battle arena game.</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
