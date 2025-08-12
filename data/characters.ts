export interface Character {
  id: string
  name: string
  description: string
  stats: {
    speed: number // 0-100
    damage: number // 0-100
    defense: number // 0-100
  }
  weaponId: string
  spriteSvg: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  abilities: {
    primary: {
      name: string
      description: string
      cooldown: number // in seconds
    }
    secondary: {
      name: string
      description: string
      cooldown: number
    }
  }
  unlocked: boolean
}

export const characters: Character[] = [
  {
    id: 'plasma-vortex',
    name: 'Plasma Vortex',
    description: 'A swirling mass of energy that can bend the battlefield to its will.',
    stats: {
      speed: 85,
      damage: 88,
      defense: 72
    },
    weaponId: 'energy-blast',
    spriteSvg: '🌀',
    rarity: 'legendary',
    abilities: {
      primary: {
        name: 'Energy Shield',
        description: 'Absorbs incoming damage for 3 seconds',
        cooldown: 8
      },
      secondary: {
        name: 'Plasma Burst',
        description: 'Area damage explosion that affects nearby enemies',
        cooldown: 12
      }
    },
    unlocked: true
  },
  {
    id: 'steel-guardian',
    name: 'Steel Guardian',
    description: 'A heavily armored defender with impenetrable defenses.',
    stats: {
      speed: 45,
      damage: 65,
      defense: 95
    },
    weaponId: 'shield-bash',
    spriteSvg: '🛡️',
    rarity: 'epic',
    abilities: {
      primary: {
        name: 'Fortress Mode',
        description: 'Becomes immobile but gains 50% damage reduction',
        cooldown: 15
      },
      secondary: {
        name: 'Shield Slam',
        description: 'Stunning melee attack that knocks back enemies',
        cooldown: 6
      }
    },
    unlocked: true
  },
  {
    id: 'lightning-striker',
    name: 'Lightning Striker',
    description: 'Lightning-fast attacks with electrical precision.',
    stats: {
      speed: 93,
      damage: 92,
      defense: 45
    },
    weaponId: 'lightning-bolt',
    spriteSvg: '⚡',
    rarity: 'rare',
    abilities: {
      primary: {
        name: 'Lightning Dash',
        description: 'Instantly teleports to target location',
        cooldown: 4
      },
      secondary: {
        name: 'Chain Lightning',
        description: 'Electrical attack that bounces between enemies',
        cooldown: 10
      }
    },
    unlocked: true
  },
  {
    id: 'mystic-orb',
    name: 'Mystic Orb',
    description: 'A mysterious sphere with ancient magical powers.',
    stats: {
      speed: 79,
      damage: 78,
      defense: 68
    },
    weaponId: 'magic-missile',
    spriteSvg: '🔮',
    rarity: 'epic',
    abilities: {
      primary: {
        name: 'Arcane Shield',
        description: 'Magic barrier that reflects projectiles',
        cooldown: 12
      },
      secondary: {
        name: 'Mystic Blast',
        description: 'Homing projectile that follows enemies',
        cooldown: 8
      }
    },
    unlocked: true
  },
  {
    id: 'fire-spirit',
    name: 'Fire Spirit',
    description: 'A blazing entity that leaves trails of destruction.',
    stats: {
      speed: 82,
      damage: 90,
      defense: 55
    },
    weaponId: 'flame-burst',
    spriteSvg: '🔥',
    rarity: 'rare',
    abilities: {
      primary: {
        name: 'Flame Trail',
        description: 'Leaves burning path that damages enemies',
        cooldown: 6
      },
      secondary: {
        name: 'Inferno',
        description: 'Creates a fiery explosion around the character',
        cooldown: 14
      }
    },
    unlocked: true
  },
  {
    id: 'ice-crystal',
    name: 'Ice Crystal',
    description: 'Frozen solid with the power to slow and freeze opponents.',
    stats: {
      speed: 60,
      damage: 75,
      defense: 85
    },
    weaponId: 'frost-shard',
    spriteSvg: '❄️',
    rarity: 'common',
    abilities: {
      primary: {
        name: 'Frost Armor',
        description: 'Reduces incoming damage and slows attackers',
        cooldown: 10
      },
      secondary: {
        name: 'Ice Spike',
        description: 'Ranged attack that can freeze enemies',
        cooldown: 7
      }
    },
    unlocked: true
  }
]

export function getCharacterById(id: string): Character | undefined {
  return characters.find(char => char.id === id)
}

export function getUnlockedCharacters(): Character[] {
  return characters.filter(char => char.unlocked)
}

export function getCharactersByRarity(rarity: Character['rarity']): Character[] {
  return characters.filter(char => char.rarity === rarity)
}
