// Plasma Vortex character implementation
import { Vector, CircleEntity, PhysicsWorld } from '../physics';
import { CharacterImplementation, CharacterAbility, ProjectileBehavior } from './characterInterface';
import { BaseCharacter, BaseAbility } from './baseCharacter';
import { getCharacterConfig } from '../characterConfig';

// Vortex primary attack implementation
class VortexPrimaryAttack extends BaseAbility {
  private stacks: number = 0;
  private stacksToTrigger: number;
  private rapidFireCount: number;
  private rapidFireDelay: number;
  
  constructor(characterType: string) {
    const config = getCharacterConfig(characterType);
    super(characterType, config.firingRate);
    
    this.stacksToTrigger = config.stacksToTrigger || 5;
    this.rapidFireCount = config.rapidFireCount || 3;
    this.rapidFireDelay = config.rapidFireDelay || 150;
  }

  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    const entity = world.entities.get(entityId);
    if (!entity) return;
    
    const config = getCharacterConfig(this.characterType);
    const normalizedDir = Vector.normalize(direction);
    
    // Check if we should trigger rapid fire
    if (this.stacks >= this.stacksToTrigger) {
      // Reset stacks and trigger rapid fire
      this.stacks = 0;
      
      // Fire rapid consecutive shots
      for (let i = 0; i < this.rapidFireCount; i++) {
        setTimeout(() => {
          if (!world.entities.has(entityId)) return;
          
          // This will be replaced with the actual fireProjectile call
          // when we extract that function from game.ts
          console.log(`Vortex rapid fire shot ${i+1}/${this.rapidFireCount}`);
          
          // Placeholder for the actual projectile firing
          // fireProjectile(entityId, normalizedDir, { 
          //   baseDamage: config.damage, 
          //   projectileSpeed: config.projectileSpeed,
          //   radius: config.bulletRadius,
          //   isVortex: true,
          //   vortexStopDistance: config.vortexStopDistance || 250,
          //   vortexRadius: config.vortexRadius || 60,
          //   vortexPullStrength: config.vortexPullStrength || 1.2,
          //   vortexDuration: config.vortexDuration || 3000,
          //   vortexTouchedDuration: config.vortexTouchedDuration || 3000,
          //   vortexDamageRate: config.vortexDamageRate || 12
          // });
        }, i * this.rapidFireDelay);
      }
    } else {
      // Normal single shot
      // Placeholder for the actual projectile firing
      console.log('Vortex normal shot');
      
      // fireProjectile(entityId, normalizedDir, { 
      //   baseDamage: config.damage, 
      //   projectileSpeed: config.projectileSpeed,
      //   radius: config.bulletRadius,
      //   isVortex: true,
      //   vortexStopDistance: config.vortexStopDistance || 250,
      //   vortexRadius: config.vortexRadius || 60,
      //   vortexPullStrength: config.vortexPullStrength || 1.2,
      //   vortexDuration: config.vortexDuration || 3000,
      //   vortexTouchedDuration: config.vortexTouchedDuration || 3000,
      //   vortexDamageRate: config.vortexDamageRate || 12
      // });
    }
  }
  
  // Method to increment stacks when hitting enemies
  incrementStacks(): void {
    this.stacks++;
  }
}

// Vortex projectile behavior
const vortexProjectileBehavior: ProjectileBehavior = {
  onUpdate: (projectile, world, deltaTime) => {
    // Check if this is a vortex that has stopped
    if ((projectile as any).isVortex && (projectile as any).vortexActive) {
      const vortexCenter = projectile.position;
      const vortexRadius = (projectile as any).vortexRadius || 60;
      const pullStrength = (projectile as any).vortexPullStrength || 1.2;
      
      // Pull nearby entities toward the vortex center
      for (const [id, entity] of world.entities) {
        // Skip self, non-players, and owner
        if (id === projectile.id || entity.type !== 'player' || id === projectile.ownerId) continue;
        
        const distance = Vector.distance(vortexCenter, entity.position);
        if (distance <= vortexRadius) {
          // Calculate pull direction and strength
          const pullDirection = Vector.normalize(Vector.subtract(vortexCenter, entity.position));
          const pullForce = pullStrength * (1 - distance / vortexRadius);
          
          // Apply pull force
          entity.velocity.x += pullDirection.x * pullForce;
          entity.velocity.y += pullDirection.y * pullForce;
          
          // Apply damage over time
          if ((projectile as any).lastDamageTime && Date.now() - (projectile as any).lastDamageTime >= 1000) {
            entity.health -= (projectile as any).vortexDamageRate || 12;
            (projectile as any).lastDamageTime = Date.now();
          }
        }
      }
    }
  },
  
  onCollision: (projectile, target, world) => {
    // If this is a vortex projectile and not already activated
    if ((projectile as any).isVortex && !(projectile as any).vortexActive) {
      // Stop the projectile and activate vortex mode
      projectile.velocity = { x: 0, y: 0 };
      (projectile as any).vortexActive = true;
      (projectile as any).lastDamageTime = Date.now();
      
      // Set lifetime based on configuration
      projectile.lifetime = (projectile as any).vortexTouchedDuration || 3000;
      
      // Make it static so it doesn't move
      projectile.isStatic = true;
    }
  },
  
  onCreation: (projectile, owner) => {
    // Set up vortex-specific properties
    if ((projectile as any).isVortex) {
      (projectile as any).vortexActive = false;
      (projectile as any).distanceTraveled = 0;
      (projectile as any).initialPosition = { ...projectile.position };
    }
  }
};

// Vortex character implementation
class VortexCharacter extends BaseCharacter {
  constructor() {
    super('vortex');
    
    // Set up vortex-specific abilities
    this.primaryAttack = new VortexPrimaryAttack('vortex');
    
    // Set up vortex-specific projectile behaviors
    this.projectileBehaviors = {
      'default': vortexProjectileBehavior
    };
  }
  
  // Override onUpdate to handle vortex-specific logic
  onUpdate(entity: CircleEntity, world: PhysicsWorld, deltaTime: number): void {
    super.onUpdate(entity, world, deltaTime);
    
    // Additional vortex-specific update logic can go here
  }
}

// Export the vortex character implementation
const vortexCharacter = new VortexCharacter();
export default vortexCharacter;