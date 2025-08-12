export interface ArenaSettings {
  id: string
  name: string
  width: number
  height: number
  hazards: Hazard[]
  background: 'grid' | 'dark' | 'neon' | 'space'
  gridSize: number
  created: string
}

export interface Hazard {
  id: string
  type: 'spike' | 'fire' | 'ice' | 'electric' | 'void'
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

export const defaultArenaSettings: ArenaSettings = {
  id: 'default',
  name: 'Default Arena',
  width: 800,
  height: 600,
  hazards: [],
  background: 'grid',
  gridSize: 20,
  created: new Date().toISOString()
}

export const hazardTypes = [
  {
    type: 'spike' as const,
    name: 'Spike Trap',
    icon: '⚠️',
    color: '#ef4444',
    description: 'Damages players who touch it'
  },
  {
    type: 'fire' as const,
    name: 'Fire Hazard',
    icon: '🔥',
    color: '#f97316',
    description: 'Burns players over time'
  },
  {
    type: 'ice' as const,
    name: 'Ice Patch',
    icon: '❄️',
    color: '#06b6d4',
    description: 'Slows down movement'
  },
  {
    type: 'electric' as const,
    name: 'Electric Field',
    icon: '⚡',
    color: '#eab308',
    description: 'Stuns players briefly'
  },
  {
    type: 'void' as const,
    name: 'Void Zone',
    icon: '🕳️',
    color: '#6b21a8',
    description: 'Instantly eliminates players'
  }
]

export function validateArenaSettings(settings: Partial<ArenaSettings>): string[] {
  const errors: string[] = []
  
  if (!settings.width || settings.width < 400) {
    errors.push('Arena width must be at least 400px')
  }
  if (!settings.height || settings.height < 240) {
    errors.push('Arena height must be at least 240px')
  }
  if (settings.width && settings.width > 2048) {
    errors.push('Arena width cannot exceed 2048px')
  }
  if (settings.height && settings.height > 2048) {
    errors.push('Arena height cannot exceed 2048px')
  }
  if (!settings.name || settings.name.trim().length === 0) {
    errors.push('Arena name is required')
  }
  
  return errors
}

export function generateArenaId(): string {
  return `arena_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function saveArenaToLocalStorage(settings: ArenaSettings): void {
  const saved = JSON.parse(localStorage.getItem('circlash-arena-presets') || '[]')
  const existingIndex = saved.findIndex((preset: ArenaSettings) => preset.id === settings.id)
  
  if (existingIndex >= 0) {
    saved[existingIndex] = settings
  } else {
    saved.push(settings)
  }
  
  localStorage.setItem('circlash-arena-presets', JSON.stringify(saved))
}

export function loadArenasFromLocalStorage(): ArenaSettings[] {
  try {
    const saved = localStorage.getItem('circlash-arena-presets')
    return saved ? JSON.parse(saved) : []
  } catch (e) {
    console.warn('Failed to load arena presets from localStorage')
    return []
  }
}

export function exportArenaAsJSON(settings: ArenaSettings): void {
  const dataStr = JSON.stringify(settings, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  
  const link = document.createElement('a')
  link.href = URL.createObjectURL(dataBlob)
  link.download = `${settings.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_arena.json`
  link.click()
}
