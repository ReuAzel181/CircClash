import { CircleEntity, Vector } from '../physics';

export interface ProjectileProperties {
  homingStrength?: number;
  visualEffects: {
    color: string;
    trail: {
      color: string;
      opacity: number;
      lifetime: number;
    };
    glow: {
      color: string;
      strength: number;
    };
  };
  activeTimeouts?: NodeJS.Timeout[];
  // Vortex-specific properties
  isVortex?: boolean;
  vortexStopDistance?: number;
  vortexRadius?: number;
  vortexStartTime?: number;
  distanceTraveled?: number;
  vortexPullStrength?: number;
  vortexDuration?: number;
  vortexTouchedDuration?: number;
  vortexDamageRate?: number;
  lastDamageTime?: number;
  // Flame-specific properties
  isFlameProjectile?: boolean;
  isInfernoBurst?: boolean;
  hasExploded?: boolean;
  explosionRadius?: number;
  explosionDamage?: number;
  burnDamage?: number;
  burnDuration?: number;
  igniteChance?: number;
  // Frost-specific properties
  isIceShard?: boolean;
  freezeDuration?: number;
  slowStrength?: number;
  shatterDamage?: number;
  iceSpikesCount?: number;
  shatterOnImpact?: boolean;
  isDefensiveSpike?: boolean;
  shardCount?: number;
  isShatterShard?: boolean;
  // Mystic-specific properties
  isMysticThread?: boolean;
  webRadius?: number;
  webDuration?: number;
  webSlowStrength?: number;
  hasHomed?: boolean;
  targetId?: string | null;
  isMysticWeb?: boolean;
  creationTime?: number;
  trappedEnemies?: Set<string>;
  healAmount?: number;
  lastHealTime?: number;
  isImpactWeb?: boolean;
  // Shadow-specific properties
  isShadowBolt?: boolean;
  criticalChance?: number;
  criticalMultiplier?: number;
  phaseThrough?: boolean;
  shadowStepOnHit?: boolean;
  guaranteedCritical?: boolean;
  isCloneProjectile?: boolean;
  // Titan-specific properties
  isIronShot?: boolean;
  knockbackForce?: number;
  armorPiercing?: boolean;
  heavyImpact?: boolean;
  shockwaveOnHit?: boolean;
}

export interface ProjectileEntity extends CircleEntity {
  type: 'projectile';
  speed: number;
  lifetime: number;
  piercing: number;
  hitsRemaining: number;
  ownerId: string;
  properties: ProjectileProperties;
}

export function createProjectile(
  id: string,
  position: Vector,
  direction: Vector,
  config: {
    speed: number;
    radius: number;
    damage: number;
    lifetime: number;
    piercing: number;
    homingStrength?: number;
    properties: ProjectileProperties;
  },
  ownerId: string
): ProjectileEntity {
  return {
    id,
    position,
    velocity: Vector.multiply(Vector.normalize(direction), config.speed),
    acceleration: Vector.create(),
    radius: config.radius,
    mass: 0,
    health: 1,
    maxHealth: 1,
    damage: config.damage,
    restitution: 0.2,
    friction: 1,
    isStatic: false,
    type: 'projectile' as const,
    ownerId,
    speed: config.speed,
    lifetime: config.lifetime,
    piercing: config.piercing,
    hitsRemaining: config.piercing + 1,
    properties: {
      ...config.properties,
      homingStrength: config.homingStrength
    }
  };
}