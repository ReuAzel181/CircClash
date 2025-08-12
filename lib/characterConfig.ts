// Character configuration for easy modification
export interface CharacterConfig {
  name: string
  color: string
  bulletColor: string
  damage: number
  projectileSpeed: number
  bulletRadius: number
  firingRate: number // milliseconds between shots
  attackRange: number // maximum distance to attack
}

export const CHARACTER_CONFIGS: Record<string, CharacterConfig> = {
  vortex: {
    name: 'Plasma Vortex',
    color: '#8b5cf6', // Purple
    bulletColor: '#8b5cf6',
    damage: 12,
    projectileSpeed: 500,
    bulletRadius: 6,
    firingRate: 300,
    attackRange: 400
  },
  
  striker: {
    name: 'Lightning Striker',
    color: '#fbbf24', // Yellow
    bulletColor: '#fbbf24',
    damage: 10,
    projectileSpeed: 700,
    bulletRadius: 4,
    firingRate: 250,
    attackRange: 450
  },
  
  guardian: {
    name: 'Steel Guardian',
    color: '#6b7280', // Gray
    bulletColor: '#6b7280',
    damage: 15,
    projectileSpeed: 300,
    bulletRadius: 8,
    firingRate: 400,
    attackRange: 300
  },
  
  mystic: {
    name: 'Mystic Orb',
    color: '#ec4899', // Pink
    bulletColor: '#ec4899',
    damage: 11,
    projectileSpeed: 450,
    bulletRadius: 5,
    firingRate: 350,
    attackRange: 400
  },
  
  flame: {
    name: 'Fire Warrior',
    color: '#dc2626', // Red
    bulletColor: '#dc2626',
    damage: 13,
    projectileSpeed: 400,
    bulletRadius: 6,
    firingRate: 300,
    attackRange: 350
  },
  
  frost: {
    name: 'Ice Knight',
    color: '#06b6d4', // Cyan
    bulletColor: '#06b6d4',
    damage: 12,
    projectileSpeed: 250,
    bulletRadius: 7,
    firingRate: 450,
    attackRange: 300
  },
  
  shadow: {
    name: 'Shadow Assassin',
    color: '#374151', // Dark Gray
    bulletColor: '#374151',
    damage: 9,
    projectileSpeed: 600,
    bulletRadius: 3,
    firingRate: 200,
    attackRange: 500
  },
  
  titan: {
    name: 'Iron Titan',
    color: '#059669', // Green
    bulletColor: '#059669',
    damage: 18,
    projectileSpeed: 200,
    bulletRadius: 10,
    firingRate: 600,
    attackRange: 250
  }
}

// Helper function to get character type from ID
export function getCharacterType(entityId: string): string {
  if (entityId.includes('vortex')) return 'vortex'
  if (entityId.includes('guardian')) return 'guardian'
  if (entityId.includes('striker')) return 'striker'
  if (entityId.includes('mystic')) return 'mystic'
  if (entityId.includes('flame')) return 'flame'
  if (entityId.includes('frost')) return 'frost'
  if (entityId.includes('shadow')) return 'shadow'
  if (entityId.includes('titan')) return 'titan'
  return 'default'
}

// Helper function to get character config
export function getCharacterConfig(characterType: string): CharacterConfig {
  return CHARACTER_CONFIGS[characterType] || CHARACTER_CONFIGS.striker // Default fallback
}
