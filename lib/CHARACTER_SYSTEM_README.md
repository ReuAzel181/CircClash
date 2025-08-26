# Character System Architecture

This directory contains the modular character system implementation. Each character has its own dedicated directory containing all character-specific code.

## Directory Structure

```
characters/
├── archer/      # Wind Archer implementation
├── blade/       # Blade Master implementation
├── chaos/       # Chaos Bomber implementation
├── flame/       # Fire Warrior implementation
├── frost/       # Ice Knight implementation
├── guardian/    # Steel Guardian implementation
├── mystic/      # Mystic Orb implementation
├── shadow/      # Shadow Assassin implementation
├── striker/     # Lightning Striker implementation
├── titan/       # Iron Titan implementation
├── void/        # Void Sniper implementation
├── vortex/      # Plasma Vortex implementation
└── baseCharacter.ts  # Base character class implementation
```

## Character Directory Structure

Each character directory contains the following files:

```
character-name/
├── abilities.ts     # Character-specific attack mechanics
├── behaviors.ts     # Projectile and effect behaviors
├── config.ts        # Character stats and properties
└── index.ts         # Main character class implementation
```

## Implementation Guidelines

### abilities.ts
- Defines primary attack and special abilities
- Implements damage calculation and scaling
- Creates projectiles and special effects
- Handles ability cooldowns and resources
- Manages ability state and transitions

### behaviors.ts
- Implements projectile movement patterns
- Handles collision detection and response
- Creates and manages visual effects
- Controls particle systems and trails
- Implements status effects and debuffs

### config.ts
- Defines character base stats
- Configures ability properties
- Sets visual effect parameters
- Defines gameplay constants
- Specifies character metadata

### index.ts
- Extends BaseCharacter class
- Integrates abilities and behaviors
- Implements character-specific logic
- Handles state management
- Controls visual feedback

## Character List

1. **Plasma Vortex**
   - Tech Trickster DPS
   - Gravitational control mechanics
   - Area denial and crowd control

2. **Steel Guardian**
   - Shield Sentinel Tank
   - Energy wave mechanics
   - Defensive barriers and protection

3. **Lightning Striker**
   - Storm Phantom Assassin
   - Chain lightning abilities
   - High mobility and burst damage

4. **Mystic Orb**
   - Arcane Weaver Support
   - Magical thread mechanics
   - Healing and buff abilities

5. **Fire Warrior**
   - Pyro Vanguard DPS
   - Flame trail mechanics
   - Area damage and DoT effects

6. **Ice Knight**
   - Frostwarden Tank
   - Ice barrier mechanics
   - Crowd control and defense

7. **Shadow Assassin**
   - Night Stalker
   - Clone deception mechanics
   - Stealth and burst damage

8. **Iron Titan**
   - Mechanical Striker
   - Grab combo mechanics
   - Heavy melee and control

9. **Wind Archer**
   - Gale Sniper
   - Wind tunnel mechanics
   - Precision and mobility

10. **Blade Master**
    - Volt Swordsman
    - Chain lightning mechanics
    - Combo and critical hits

11. **Void Sniper**
    - Eclipse Marksman
    - Dimensional rift mechanics
    - Long-range and void effects

12. **Chaos Bomber**
    - Demolitionist
    - Proximity mine mechanics
    - Area denial and chain reactions

## Best Practices

### Code Organization
1. Keep character-specific code isolated
2. Follow existing patterns for consistency
3. Use clear, descriptive names
4. Document complex mechanics
5. Maintain type safety

### Performance
1. Optimize effect creation
2. Clean up resources properly
3. Use efficient data structures
4. Minimize memory allocations
5. Profile critical paths

### Visual Feedback
1. Provide clear ability indicators
2. Use consistent effect styling
3. Implement smooth transitions
4. Add appropriate sound cues
5. Consider visual clarity

### Testing
1. Unit test core mechanics
2. Verify behavior interactions
3. Test edge cases
4. Check performance impact
5. Validate visual effects

## Adding New Characters

1. Create character directory
2. Implement required files
3. Define character config
4. Create abilities and behaviors
5. Integrate with character factory
6. Add tests and documentation
7. Review and optimize

Update this README when adding new character patterns or implementation guidelines.