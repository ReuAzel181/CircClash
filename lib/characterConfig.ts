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
  bulletStyle: 'normal' | 'spinning' | 'electric' | 'magical' | 'flame' | 'ice' | 'shadow' | 'heavy' | 'piercing' | 'slashing' | 'explosive' | 'boomerang' | 'barrier' | 'chain' | 'web' | 'mine' | 'clone' | 'shockwave' | 'tunnel' | 'rift' | 'earthquake' | 'fissure' | 'ironhand' | 'energywave' | 'vortex'
  bulletShape: 'circle' | 'star' | 'diamond' | 'triangle' | 'spark' | 'shard' | 'orb' | 'cannon' | 'arrow' | 'arc' | 'beam' | 'bomb' | 'disc' | 'wall' | 'thread' | 'ironhand' | 'sphere'
  trailEffect: boolean
  glowEffect: boolean
  specialAbility: string
  abilityDescription: string
  multiShot?: number // For characters that fire multiple projectiles
  spreadAngle?: number // For spread shots
  boomerangReturn?: boolean // For boomerang projectiles
  chainLightning?: boolean // For chain effects
  homingStrength?: number // For homing projectiles
  explosiveRadius?: number // For explosive projectiles
  slowEffect?: boolean // For slowing projectiles (legacy boolean)
  barriers?: boolean // For barrier creation
  // Tank-specific properties
  tankHealth?: number // Higher health for tank characters
  damageReduction?: number // Percentage damage reduction (0-1)
  knockbackResistance?: number // Resistance to knockback effects (0-1)
  barrierDuration?: number // Duration of protective barriers in ms
  selfHeal?: number // Health regeneration per second
  // Earthquake-specific properties
  earthquakeWaves?: number // Number of sequential earthquake waves
  waveDelay?: number // Delay between waves in ms
  waveSpeed?: number // Speed of expanding earthquake waves
  // Fissure-specific properties
  fissureLength?: number // How far ground fissures extend
  fissureWidth?: number // Damage zone width along fissure
  fissureSpeed?: number // Speed of fissure propagation
  delayBetweenFissures?: number // Delay between each fissure appearing
  // Iron hand-specific properties
  handExtensionSpeed?: number // Speed of hand going out
  handRetractionSpeed?: number // Speed of hand coming back
  maxExtension?: number // Maximum reach of iron hand
  handDamage?: number // Damage on contact
  knockbackForce?: number // Knockback strength
  // Shield wall-specific properties
  shieldDuration?: number // How long shield walls last in ms
  reflectChance?: number // Chance to reflect projectiles (0-1)
  shieldHealth?: number // How much damage each shield can absorb
  // Energy wave-specific properties
  chargeTime?: number // Time to charge up before releasing wave in ms
  waveGrowthRate?: number // How much the wave grows as it travels (multiplier per unit distance)
  damageOverTime?: number // Damage per tick for DOT effect
  dotDuration?: number // How long the DOT effect lasts in ms
  slowEffectStrength?: number // Movement speed reduction (0-1, where 0.4 = 40% slower)
  slowDuration?: number // How long the slow effect lasts in ms
  // Vortex-specific properties
  vortexStopDistance?: number // How far the bullet travels before stopping
  vortexRadius?: number // Area of effect when vortex forms
  vortexPullStrength?: number // Force pulling enemies toward center
  vortexDuration?: number // Duration if untouched by enemies
  vortexTouchedDuration?: number // Duration if touched by enemy
  vortexDamageRate?: number // Damage per second while in vortex
  // Stack system properties
  stacksToTrigger?: number // Number of enemy hits needed to trigger rapid fire
  rapidFireCount?: number // Number of consecutive shots in rapid fire
  rapidFireDelay?: number // Delay between rapid fire shots in ms
}

export const CHARACTER_CONFIGS: Record<string, CharacterConfig> = {
  vortex: {
    name: 'Plasma Vortex',
    color: '#8b5cf6', // Purple
    bulletColor: '#8b5cf6',
    damage: 15,
    projectileSpeed: 400,
    bulletRadius: 3.5,
    firingRate: 800,
    attackRange: 500,
    bulletStyle: 'vortex',
    bulletShape: 'sphere',
    trailEffect: true,
    glowEffect: true,
    specialAbility: 'Plasma Vortex',
    abilityDescription: 'Fires an energy bullet that stops and becomes a swirling vortex, pulling enemies inward',
    vortexStopDistance: 250, // How far the bullet travels before stopping
    vortexRadius: 60, // Area of effect when vortex forms
    vortexPullStrength: 1.2, // Force pulling enemies toward center (increased)
    vortexDuration: 3000, // Always 3 seconds regardless of what it hits
    vortexTouchedDuration: 3000, // Same duration whether touched or not
    vortexDamageRate: 12, // Damage per second while in vortex
    stacksToTrigger: 5, // Trigger rapid fire after 5 enemy hits (reduced from 7)
    rapidFireCount: 3, // Fire 3 consecutive shots
    rapidFireDelay: 150, // 150ms between rapid fire shots
    multiShot: 1
  },
  
  guardian: {
    name: 'Steel Guardian',
    color: '#6b7280', // Gray
    bulletColor: '#6b7280',
    damage: 45, // Higher damage for energy wave
    projectileSpeed: 250, // Slower growing wave
    bulletRadius: 20, // Increased starting size of energy wave (was 15)
    firingRate: 1500, // Reduced cooldown including faster charge time (was 2000)
    attackRange: 400, // Increased wave travel distance (was 300)
    bulletStyle: 'energywave',
    bulletShape: 'circle',
    trailEffect: true,
    glowEffect: true,
    specialAbility: 'Energy Wave Surge',
    abilityDescription: 'Charges metallic energy then unleashes a massive growing wave that damages and slows all enemies it passes through.',
    explosiveRadius: 0, // No explosion, just growing wave
    multiShot: 1, // Single energy wave
    spreadAngle: 0, // No spread
    // Tank-specific properties
    tankHealth: 450, // Much higher health than others (vs normal ~260)
    damageReduction: 0.25, // 25% damage reduction
    knockbackResistance: 0.8, // 80% resistance to knockback
    selfHeal: 2, // Regenerates 2 HP per second
    // Energy wave specific properties
    chargeTime: 1000, // Faster charge-up period (was 1500)
    waveGrowthRate: 1.8, // Increased wave growth rate (was 1.5)
    damageOverTime: 15, // 15 damage per tick
    dotDuration: 3000, // 3 seconds of DOT
    slowEffectStrength: 0.4, // 40% movement speed reduction
    slowDuration: 4000 // 4 seconds of slow effect
  },
  
  striker: {
    name: 'Lightning Striker',
    color: '#fbbf24', // Yellow
    bulletColor: '#fbbf24',
    damage: 10,
    projectileSpeed: 700,
    bulletRadius: 1.96, // Reduced by 30% (from 2.8)
    firingRate: 250,
    attackRange: 450,
    bulletStyle: 'chain',
    bulletShape: 'spark',
    trailEffect: true,
    glowEffect: true,
    specialAbility: 'Chain Surge',
    abilityDescription: 'Lightning that jumps between enemies in chain reactions',
    chainLightning: true
  },
  
  mystic: {
    name: 'Mystic Orb',
    color: '#ec4899', // Pink
    bulletColor: '#ec4899',
    damage: 11,
    projectileSpeed: 450,
    bulletRadius: 2.45, // Reduced by 30% (from 3.5)
    firingRate: 350,
    attackRange: 400,
    bulletStyle: 'web',
    bulletShape: 'thread',
    trailEffect: true,
    glowEffect: true,
    specialAbility: 'Mystic Web',
    abilityDescription: 'Fires magical threads that tether and slightly slow enemies on hit',
    slowEffect: true,
    homingStrength: 0.3
  },
  
  flame: {
    name: 'Fire Warrior',
    color: '#dc2626', // Red
    bulletColor: '#dc2626',
    damage: 12, // Reduced from original 13, but higher than 10
    projectileSpeed: 380, // Reduced from 400, but higher than 350
    bulletRadius: 2.8, // Reduced from original, but higher than 2.5
    firingRate: 650, // Increased from 600, but less than 800 (moderate delay)
    attackRange: 330, // Reduced from 350, but higher than 320
    bulletStyle: 'flame',
    bulletShape: 'circle',
    trailEffect: true,
    glowEffect: true,
    specialAbility: 'Flame Burst',
    abilityDescription: 'Fires explosive projectiles that leave fire trails and area damage on impact',
    explosiveRadius: 28, // Reduced from 30, but higher than 25
    multiShot: 2, // Back to 2 shots from 1
    spreadAngle: 12 // Reduced from 15, but allows dual shots
  },
  
  frost: {
    name: 'Ice Knight',
    color: '#06b6d4', // Cyan
    bulletColor: '#06b6d4',
    damage: 12,
    projectileSpeed: 250,
    bulletRadius: 3.43, // Reduced by 30% (from 4.9)
    firingRate: 450,
    attackRange: 300,
    bulletStyle: 'barrier',
    bulletShape: 'wall',
    trailEffect: false,
    glowEffect: true,
    specialAbility: 'Ice Wall',
    abilityDescription: 'Creates temporary ice barriers that block projectiles and slow nearby enemies',
    barriers: true,
    slowEffect: true
  },
  
  shadow: {
    name: 'Shadow Assassin',
    color: '#374151', // Dark Gray
    bulletColor: '#374151',
    damage: 9,
    projectileSpeed: 600,
    bulletRadius: 1.47, // Reduced by 30% (from 2.1)
    firingRate: 200,
    attackRange: 500,
    bulletStyle: 'clone',
    bulletShape: 'diamond',
    trailEffect: true,
    glowEffect: false,
    specialAbility: 'Shadow Clone',
    abilityDescription: 'Creates brief shadow duplicates that confuse enemies and provide distraction',
    multiShot: 2, // Reduced from 3 to 2
    spreadAngle: 10 // Reduced from 15 to 10
  },
  
  titan: {
    name: 'Iron Titan',
    color: '#059669', // Green
    bulletColor: '#059669',
    damage: 40, // 8 damage x 5 punches = 40 total damage
    projectileSpeed: 600, // Speed of hand extension
    bulletRadius: 12, // Size of iron hand
    firingRate: 1200, // Increased from 900 to 1200 (slower attacks)
    attackRange: 280, // Reduced from 400 to 280
    bulletStyle: 'ironhand',
    bulletShape: 'ironhand',
    trailEffect: true,
    glowEffect: true,
    specialAbility: 'Grab and Punch Combo',
    abilityDescription: 'Extends an iron hand that grabs the target and delivers 5 rapid punches before releasing with knockback',
    explosiveRadius: 35, // Impact zone of the hand
    multiShot: 1, // Single hand strike
    spreadAngle: 0,
    // Iron hand-specific properties
    handExtensionSpeed: 600, // Speed going out
    handRetractionSpeed: 400, // Speed coming back
    maxExtension: 280, // Maximum reach
    handDamage: 8, // Damage per punch (5 punches total)
    knockbackForce: 200 // Increased knockback strength
  },
  
  archer: {
    name: 'Wind Archer',
    color: '#10b981', // Emerald Green
    bulletColor: '#10b981',
    damage: 14,
    projectileSpeed: 800,
    bulletRadius: 1.47, // Reduced by 30% (from 2.1)
    firingRate: 200,
    attackRange: 550,
    bulletStyle: 'tunnel',
    bulletShape: 'arrow',
    trailEffect: true,
    glowEffect: true,
    specialAbility: 'Wind Tunnel',
    abilityDescription: 'Creates gusting wind corridors that redirect and accelerate projectiles',
    homingStrength: 0.2
  },
  
  samurai: {
    name: 'Blade Master',
    color: '#7c3aed', // Violet
    bulletColor: '#7c3aed',
    damage: 16,
    projectileSpeed: 400,
    bulletRadius: 3.92, // Reduced by 30% (from 5.6)
    firingRate: 350,
    attackRange: 200,
    bulletStyle: 'chain',
    bulletShape: 'arc',
    trailEffect: true,
    glowEffect: true,
    specialAbility: 'Lightning Edge',
    abilityDescription: 'Charges weapons with electrical energy that chains damage between nearby enemies',
    chainLightning: true,
    explosiveRadius: 25
  },
  
  sniper: {
    name: 'Void Sniper',
    color: '#0f172a', // Dark Slate
    bulletColor: '#0f172a',
    damage: 22,
    projectileSpeed: 1000,
    bulletRadius: 1.96, // Reduced by 30% (from 2.8)
    firingRate: 800,
    attackRange: 650,
    bulletStyle: 'rift',
    bulletShape: 'ironhand',
    trailEffect: true,
    glowEffect: true,
    specialAbility: 'Void Rifts',
    abilityDescription: 'Opens dimensional rifts that allow attacks from unexpected angles',
    multiShot: 1, // Reduced from 2 to 1 for more precise sniping
    spreadAngle: 0 // No spread for precision
  },
  
  bomber: {
    name: 'Chaos Bomber',
    color: '#f97316', // Orange Red
    bulletColor: '#f97316',
    damage: 20,
    projectileSpeed: 300,
    bulletRadius: 5.88, // Reduced by 30% (from 8.4)
    firingRate: 500,
    attackRange: 400,
    bulletStyle: 'mine',
    bulletShape: 'bomb',
    trailEffect: false,
    glowEffect: true,
    specialAbility: 'Mine Field',
    abilityDescription: 'Deploys proximity mines that detonate when enemies approach',
    explosiveRadius: 40
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
  if (entityId.includes('archer')) return 'archer'
  if (entityId.includes('samurai')) return 'samurai'
  if (entityId.includes('sniper')) return 'sniper'
  if (entityId.includes('bomber')) return 'bomber'
  return 'default'
}

// Helper function to get character config
export function getCharacterConfig(characterType: string): CharacterConfig {
  return CHARACTER_CONFIGS[characterType] || CHARACTER_CONFIGS.striker // Default fallback
}
