// Compiled version of baseCharacter.ts for direct execution with Node.js
const { getCharacterConfig } = require('../characterConfig');

// Base ability class that can be extended by specific abilities
class BaseAbility {
  constructor(characterType, cooldown) {
    this.cooldown = cooldown;
    this.characterType = characterType;
  }

  execute(entityId, direction, world) {
    // Base implementation does nothing - to be overridden
  }

  getCooldown() {
    return this.cooldown;
  }
}

// Base character implementation with common functionality
class BaseCharacter {
  constructor(type) {
    this.type = type;
    const config = getCharacterConfig(type);
    this.name = config.name;
    this.projectileBehaviors = {};
    
    // Default implementations will be overridden by subclasses
    this.primaryAttack = new BaseAbility(type, config.firingRate);
  }

  // Common utility methods for all characters
  getEntity(entityId, world) {
    return world.entities.get(entityId) || null;
  }

  // Default implementations of lifecycle hooks
  onUpdate(entity, world, deltaTime) {
    // Default implementation does nothing
  }

  onDamaged(entity, damageAmount, source) {
    // Default implementation does nothing
  }

  onKill(entity, target) {
    // Default implementation does nothing
  }
}

module.exports = {
  BaseAbility,
  BaseCharacter
};