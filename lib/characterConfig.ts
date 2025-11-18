// Character configuration for easy modification
// Base projectile configuration that all characters share
export interface BaseProjectileConfig {
  projectileLifetime: number; // Duration before projectile disappears
  piercing: number; // Number of enemies projectile can pierce
  trailOpacity: number; // Opacity of projectile trail effect
  trailLifetime: number; // Duration of trail effect
  multiShot: number; // Number of projectiles to fire at once
  spreadAngle: number; // Angle between multiple projectiles
  homingStrength: number; // Strength of homing behavior
}

export interface CharacterConfig extends BaseProjectileConfig {
  // Flame-specific properties
  burnDuration?: number // Duration of burn effect in ms
  burnTickRate?: number // Rate at which burn damage is applied in ms
  burnDamagePerTick?: number // Damage per tick for burn effect
  immobilizeElectricEffect?: boolean // Show electric effect while immobilized
  electricVibe?: boolean // For electric visual effects
  electricColor?: string // Color for electric effects
  electricParticles?: boolean // Enable electric particles
  immobilize?: boolean // If true, immobilizes on hit
  name: string
  color: string
  bulletColor: string
  damage: number
  projectileSpeed: number
  bulletRadius: number
  firingRate: number // milliseconds between shots
  attackRange: number // maximum distance to attack
  dashSpeed?: number // Speed of dash attack
  dashRange?: number // Range of dash attack
  primaryAttack?: {
    name: string
    description: string
    dashCooldown: number
    minimumRange: number
    showBlade: boolean
    noBullets: boolean
    pureCharge: boolean
    swingDuration?: number // Duration of weapon swing animation
    swingAngle?: number // Angle of weapon swing in degrees
  }
  bulletStyle: 'normal' | 'spinning' | 'electric' | 'magical' | 'flame' | 'ice' | 'shadow' | 'heavy' | 'piercing' | 'slashing' | 'explosive' | 'boomerang' | 'barrier' | 'chain' | 'web' | 'mine' | 'clone' | 'shockwave' | 'tunnel' | 'rift' | 'earthquake' | 'fissure' | 'ironhand' | 'energywave' | 'vortex' | 'spear' | 'thunder' | 'dash'
  bulletShape: 'circle' | 'star' | 'diamond' | 'triangle' | 'spark' | 'shard' | 'orb' | 'cannon' | 'arrow' | 'arc' | 'beam' | 'bomb' | 'disc' | 'wall' | 'thread' | 'ironhand' | 'sphere' | 'spear' | 'thunder' | 'charge' | 'dome'
  stunDuration?: number // ms, for stun abilities
  electricField?: boolean // true if creates electric field
  fieldRadius?: number // AoE radius for electric field
  fieldDuration?: number // ms, duration of electric field
  fieldDamage?: number // damage per tick in field
  fieldTickRate?: number // ms, tick rate for field damage
  trailEffect: boolean
  glowEffect: boolean
  specialAbility: string
  abilityDescription: string
  multiShot: number // For characters that fire multiple projectiles
  spreadAngle: number // For spread shots
  boomerangReturn?: boolean // For boomerang projectiles
  chainLightning?: boolean // For chain effects
  homingStrength: number // For homing projectiles
  explosiveRadius?: number // For explosive projectiles
  slowEffect?: boolean // For slowing projectiles (legacy boolean)
  barriers?: boolean // For barrier creation
  barrierCooldown?: number // Cooldown between barrier spawns
  barrierSize?: number // Size multiplier for barriers
  barrierShape?: 'wall' | 'dome' // Shape of the barrier
  phaseThrough?: boolean // Whether entities can phase through the barrier
  bounceEffect?: boolean // Whether enemies bounce off barriers
  reflectProjectiles?: boolean // Whether barriers reflect incoming projectiles
  showWeaponNearEnemy?: boolean // Show weapon when near enemies
  weaponVisibilityRange?: number // Range at which weapon becomes visible
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
  // Ballistic properties
  ballisticCoefficient?: number // Aerodynamic efficiency
  muzzleVelocity?: number // Initial projectile velocity
  projectileMass?: number // Mass of the projectile
}

// Configurations for characters that haven't been refactored to individual implementations yet
export const CHARACTER_CONFIGS: Record<string, CharacterConfig> = {
  
  archer: {
    projectileLifetime: 3000, // Longer for ballistic arc
    piercing: 0,
    trailOpacity: 0.6,
    trailLifetime: 400,
    multiShot: 1,
    spreadAngle: 0,
    homingStrength: 0.2,
    name: 'Wind Archer',
    color: '#10b981', // Emerald Green
    bulletColor: '#10b981',
    damage: 14,
    projectileSpeed: 650, // Realistic arrow velocity
    bulletRadius: 1.2, // Arrow-like projectile
    firingRate: 200,
    attackRange: 550,
    bulletStyle: 'tunnel',
    bulletShape: 'arrow',
    trailEffect: true,
    glowEffect: true,
    specialAbility: 'Wind Tunnel',
    abilityDescription: 'Creates gusting wind corridors that redirect and accelerate projectiles',
    ballisticCoefficient: 0.5, // Good aerodynamics for arrows
    muzzleVelocity: 650,
    projectileMass: 0.3 // Light arrow
  },
  
  samurai: {
    projectileLifetime: 1500,
    piercing: 1,
    trailOpacity: 0.7,
    trailLifetime: 500,
    multiShot: 1,
    spreadAngle: 0,
    homingStrength: 0,
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
    projectileLifetime: 4000, // Long range ballistic trajectory
    piercing: 1,
    trailOpacity: 0.8,
    trailLifetime: 700,
    multiShot: 1,
    spreadAngle: 0,
    homingStrength: 0,
    name: 'Void Sniper',
    color: '#0f172a', // Dark Slate
    bulletColor: '#0f172a',
    damage: 22,
    projectileSpeed: 850, // High velocity sniper round
    bulletRadius: 1.5, // Small, precise bullet
    firingRate: 800,
    attackRange: 650,
    bulletStyle: 'rift',
    bulletShape: 'ironhand',
    trailEffect: true,
    glowEffect: true,
    specialAbility: 'Void Rifts',
    abilityDescription: 'Opens dimensional rifts that allow attacks from unexpected angles',
    ballisticCoefficient: 0.7, // Excellent aerodynamics for precision
    muzzleVelocity: 850,
    projectileMass: 0.8 // Medium weight for stability
  },
  
  bomber: {
    projectileLifetime: 3500, // Longer for ballistic arc
    piercing: 0,
    trailOpacity: 0.5,
    trailLifetime: 600,
    multiShot: 1,
    spreadAngle: 0,
    homingStrength: 0,
    name: 'Chaos Bomber',
    color: '#f97316', // Orange Red
    bulletColor: '#f97316',
    damage: 20,
    projectileSpeed: 280, // Slower for heavy explosive
    bulletRadius: 4.5, // Smaller but still visible
    firingRate: 500,
    attackRange: 400,
    bulletStyle: 'mine',
    bulletShape: 'bomb',
    trailEffect: false,
    glowEffect: true,
    specialAbility: 'Mine Field',
    abilityDescription: 'Deploys proximity mines that detonate when enemies approach',
    explosiveRadius: 40,
    ballisticCoefficient: 0.25, // Poor aerodynamics due to explosive payload
    muzzleVelocity: 280,
    projectileMass: 2.0 // Heavy explosive projectile
  }
}

// Helper function to get character type from ID
export function getCharacterType(entityId: string): string {
  // Remove 'bot_' prefix if it exists
  const id = entityId.replace('bot_', '')
  
  if (id === 'vortex') return 'vortex'
  if (id === 'guardian') return 'guardian'
  if (id === 'striker') return 'striker'
  if (id === 'mystic') return 'mystic'
  if (id === 'flame') return 'flame'
  if (id === 'frost') return 'frost'
  if (id === 'shadow') return 'shadow'
  if (id === 'titan') return 'titan'
  if (id === 'archer') return 'archer'
  if (id === 'samurai') return 'samurai'
  if (id === 'sniper') return 'sniper'
  if (id === 'bomber') return 'bomber'
  
  // Return default character type if no match is found
  return 'vortex'
}

// Helper function to get character config
export async function getCharacterConfig(characterType: string): Promise<CharacterConfig> {
  // First check if it's a refactored character with individual implementation
  const refactoredCharacters = ['vortex', 'guardian', 'striker', 'mystic', 'flame', 'frost', 'shadow', 'titan', 'blade', 'chaos', 'void'];
  
  if (refactoredCharacters.includes(characterType)) {
    try {
      // Try to import the character's config from its individual implementation
      const characterModule = await import(`./characters/${characterType}`);
      const configName = `${characterType}Config`;
      if (characterModule[configName]) {
        return characterModule[configName];
      }
    } catch (error) {
      console.warn(`Failed to load individual config for ${characterType}, falling back to legacy config:`, error);
    }
  }
  
  // Fall back to legacy CHARACTER_CONFIGS for non-refactored characters
  return CHARACTER_CONFIGS[characterType] || CHARACTER_CONFIGS.archer; // Default fallback
}

// Synchronous version for backward compatibility
export function getCharacterConfigSync(characterType: string): CharacterConfig {
  // First check legacy CHARACTER_CONFIGS
  if (CHARACTER_CONFIGS[characterType]) {
    return CHARACTER_CONFIGS[characterType];
  }
  
  // Try to get config from individual character implementations
  try {
    switch (characterType) {
      case 'vortex': {
        const { vortexConfig } = require('./characters/vortex');
        return vortexConfig;
      }
      case 'guardian': {
        const { guardianConfig } = require('./characters/guardian');
        return guardianConfig;
      }
      case 'striker': {
        const { strikerConfig } = require('./characters/striker');
        return strikerConfig;
      }
      case 'mystic': {
        const { mysticConfig } = require('./characters/mystic');
        return mysticConfig;
      }
      case 'flame': {
        const { flameConfig } = require('./characters/flame');
        return flameConfig;
      }
      case 'frost': {
        const { frostConfig } = require('./characters/frost');
        return frostConfig;
      }
      case 'shadow': {
        const { shadowConfig } = require('./characters/shadow');
        return shadowConfig;
      }
      case 'titan': {
        const { titanConfig } = require('./characters/titan');
        return titanConfig;
      }
      case 'chaos': {
        const { chaosConfig } = require('./characters/chaos');
        return chaosConfig;
      }
      case 'void': {
        const { voidConfig } = require('./characters/void');
        return voidConfig;
      }
      case 'blade': {
        const { bladeConfig } = require('./characters/blade');
        return bladeConfig;
      }
      default:
        return CHARACTER_CONFIGS.archer; // Final fallback
    }
  } catch (error) {
    console.warn(`Failed to load config for ${characterType}, using archer fallback:`, error);
    return CHARACTER_CONFIGS.archer; // Fallback on error
  }
}
