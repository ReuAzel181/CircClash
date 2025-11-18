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
  ballisticCoefficient?: number
  muzzleVelocity?: number
  projectileMass?: number
  explosiveRadius?: number
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
    projectileSpeed: 450, // Increased for more realistic bullet velocity
    radius: 4, // Smaller, more realistic bullet size
    special: ['spinning', 'momentum_damage', 'ballistic_trajectory'],
    cost: 10,
    rarity: 'common',
    description: 'A spinning projectile with realistic ballistic trajectory',
    icon: '🌀',
    piercing: 0,
    bounces: 0,
    lifetime: 3000, // Longer lifetime for ballistic arc
    ballisticCoefficient: 0.4, // Good aerodynamics
    muzzleVelocity: 450
  },
  {
    id: 'drillspin',
    name: 'Drillspin',
    type: 'projectile',
    baseDamage: 35,
    cooldownMs: 1200,
    projectileSpeed: 380, // Heavy projectile with moderate velocity
    radius: 6, // Reduced size for realism
    special: ['piercing', 'momentum_damage', 'chain_knockback', 'heavy_projectile'],
    cost: 20,
    rarity: 'rare',
    description: 'Heavy piercing projectile with realistic ballistic drop',
    icon: '🔩',
    piercing: 2,
    bounces: 0,
    lifetime: 4000,
    ballisticCoefficient: 0.6, // Excellent aerodynamics for piercing
    muzzleVelocity: 380,
    projectileMass: 1.5 // Heavier projectile
  },
  {
    id: 'boomring',
    name: 'Boomring',
    type: 'projectile',
    baseDamage: 40,
    cooldownMs: 1500,
    projectileSpeed: 520, // High velocity explosive projectile
    radius: 8, // Reduced for realism
    special: ['bouncing', 'explosion_on_impact', 'return_to_sender', 'high_velocity'],
    cost: 25,
    rarity: 'epic',
    description: 'High-velocity explosive with realistic ballistic trajectory',
    icon: '💥',
    piercing: 0,
    bounces: 3,
    lifetime: 5000,
     ballisticCoefficient: 0.35, // Lower due to explosive payload
     muzzleVelocity: 520,
     explosiveRadius: 25
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
