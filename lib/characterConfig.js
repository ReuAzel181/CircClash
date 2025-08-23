// Compiled version of characterConfig.ts for direct execution with Node.js

// Default character configuration
const defaultConfig = {
  health: 100,
  speed: 200,
  damage: 10,
  firingRate: 500, // ms between shots
  projectileSpeed: 400,
  bulletRadius: 5,
  projectileLifetime: 2000 // ms
};

// Character-specific configurations
const characterConfigs = {
  'default': defaultConfig,
  
  'vortex': {
    ...defaultConfig,
    damage: 8,
    firingRate: 600,
    projectileSpeed: 350,
    bulletRadius: 6,
    stacksToTrigger: 5,
    rapidFireCount: 3,
    rapidFireDelay: 150,
    vortexStopDistance: 250
  },
  
  'flame': {
    ...defaultConfig,
    damage: 5,
    firingRate: 700,
    projectileSpeed: 300,
    bulletRadius: 4,
    spreadAngle: 15,
    projectilesPerShot: 3,
    burnDuration: 3000,
    burnDamage: 5,
    burnTickRate: 500
  },
  
  'archer': {
    ...defaultConfig,
    damage: 15,
    firingRate: 1000,
    projectileSpeed: 500,
    bulletRadius: 3,
    maxChargeTime: 1500,
    minDamageMultiplier: 1.0,
    maxDamageMultiplier: 3.0,
    minSpeedMultiplier: 1.0,
    maxSpeedMultiplier: 1.5,
    arrowSize: 1.0
  }
};

/**
 * Get configuration for a specific character type
 */
function getCharacterConfig(characterType) {
  return characterConfigs[characterType] || defaultConfig;
}

module.exports = {
  getCharacterConfig,
  defaultConfig,
  characterConfigs
};