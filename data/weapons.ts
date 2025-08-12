// Data-driven weapon system for Circlash

export interface Weapon {
  id: string
  name: string
  type: 'projectile' | 'dash' | 'aura' | 'melee'
  baseDamage: number
  cooldownMs: number
  projectileSpeed?: number
  radius: number
  special: string[] // Rule tokens for special behaviors
  cost: number // Energy/mana cost
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  description: string
  icon: string
  // Projectile-specific
  piercing?: number
  bounces?: number
  lifetime?: number
  // Dash-specific
  dashDistance?: number
  dashDuration?: number
  // Aura-specific
  auraDuration?: number
  auraRadius?: number
}

export const weapons: Weapon[] = [
  {
    id: 'spinshot',
    name: 'Spinshot',
    type: 'projectile',
    baseDamage: 25,
    cooldownMs: 800,
    projectileSpeed: 300,
    radius: 6,
    special: ['spinning', 'momentum_damage'],
    cost: 10,
    rarity: 'common',
    description: 'A spinning projectile that gains damage with velocity',
    icon: '🌀',
    piercing: 0,
    bounces: 0,
    lifetime: 2000
  },
  {
    id: 'drillspin',
    name: 'Drillspin',
    type: 'projectile',
    baseDamage: 35,
    cooldownMs: 1200,
    projectileSpeed: 250,
    radius: 8,
    special: ['piercing', 'momentum_damage', 'chain_knockback'],
    cost: 20,
    rarity: 'rare',
    description: 'Pierces through enemies and gains power from momentum',
    icon: '🔩',
    piercing: 2,
    bounces: 0,
    lifetime: 3000
  },
  {
    id: 'boomring',
    name: 'Boomring',
    type: 'projectile',
    baseDamage: 40,
    cooldownMs: 1500,
    projectileSpeed: 400,
    radius: 10,
    special: ['bouncing', 'explosion_on_impact', 'return_to_sender'],
    cost: 25,
    rarity: 'epic',
    description: 'Bounces off walls and explodes on impact, then returns',
    icon: '💥',
    piercing: 0,
    bounces: 3,
    lifetime: 4000
  },
  {
    id: 'magnetron',
    name: 'Magnetron',
    type: 'aura',
    baseDamage: 15,
    cooldownMs: 2000,
    radius: 80,
    special: ['magnetic_pull', 'metal_detection', 'weapon_steal'],
    cost: 30,
    rarity: 'epic',
    description: 'Creates a magnetic field that pulls enemies and steals weapons',
    icon: '🧲',
    auraDuration: 3000,
    auraRadius: 80
  },
  {
    id: 'shockwave',
    name: 'Shockwave',
    type: 'aura',
    baseDamage: 50,
    cooldownMs: 3000,
    radius: 120,
    special: ['area_damage', 'knockback_wave', 'terrain_destroy'],
    cost: 40,
    rarity: 'legendary',
    description: 'Devastating area attack that destroys terrain and sends enemies flying',
    icon: '⚡',
    auraDuration: 1000,
    auraRadius: 120
  },
  {
    id: 'pulseshield',
    name: 'PulseShield',
    type: 'aura',
    baseDamage: 0,
    cooldownMs: 5000,
    radius: 50,
    special: ['projectile_reflect', 'damage_absorption', 'pulse_healing'],
    cost: 35,
    rarity: 'legendary',
    description: 'Protective barrier that reflects projectiles and heals the user',
    icon: '🛡️',
    auraDuration: 4000,
    auraRadius: 50
  }
]

export function getWeaponById(id: string): Weapon | undefined {
  return weapons.find(weapon => weapon.id === id)
}

export function getWeaponsByRarity(rarity: Weapon['rarity']): Weapon[] {
  return weapons.filter(weapon => weapon.rarity === rarity)
}

export function getWeaponsByType(type: Weapon['type']): Weapon[] {
  return weapons.filter(weapon => weapon.type === type)
}
