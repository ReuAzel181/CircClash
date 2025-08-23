# Character System

This directory contains the modular character system implementation, which separates character-specific code from the main game logic.

## Structure

- `characterInterface.ts` - Defines the interfaces for character abilities and implementations
- `baseCharacter.ts` - Provides base classes for character implementations
- `characterFactory.ts` - Factory for loading and managing character implementations
- `characterUtils.ts` - Utility functions for character-related operations
- `projectileUtils.ts` - Utilities for projectile creation and management
- `physicsUtils.ts` - Physics-related utilities for character system
- `gameUtils.ts` - Game-related utilities extracted from game.ts

## Character Implementations

- `defaultCharacter.ts` - Default fallback character implementation
- `vortex.ts` - Plasma Vortex character implementation
- `flame.ts` - Fire Warrior character implementation
- `archer.ts` - Wind Archer character implementation

## Usage

To use the character system, import the necessary functions from the appropriate files:

```typescript
// To get a character implementation
import { getCharacterImplementation } from './characters/characterFactory';

// To fire a character-specific attack
import { fireCharacterAttack } from './characters/gameUtils';

// To handle character-specific collision logic
import { handleCollision } from './characters/physicsUtils';
```

## Adding New Characters

To add a new character:

1. Create a new file in the `characters` directory (e.g., `newCharacter.ts`)
2. Implement the `CharacterImplementation` interface
3. Export a default instance of your character class
4. Update `characterFactory.ts` to include your new character

Example:

```typescript
// newCharacter.ts
import { BaseCharacter, BaseAbility } from './baseCharacter';
import { CharacterAbility, ProjectileBehavior } from './characterInterface';

class NewCharacterPrimaryAttack extends BaseAbility implements CharacterAbility {
  execute(entityId: string, direction: Vector, world: PhysicsWorld): void {
    // Implement primary attack logic
  }
}

const newCharacterProjectileBehavior: ProjectileBehavior = {
  onUpdate: (projectile, world) => { /* ... */ },
  onCollision: (projectile, target, world) => { /* ... */ },
  onCreate: (projectile) => { /* ... */ }
};

class NewCharacter extends BaseCharacter {
  constructor() {
    super();
    this.primaryAttack = new NewCharacterPrimaryAttack();
    this.projectileBehavior = newCharacterProjectileBehavior;
  }
}

export default new NewCharacter();
```

## Testing

Use the `test.ts` file to verify character implementations:

```bash
node -r ts-node/register lib/characters/test.ts
```