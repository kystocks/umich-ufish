# Phase 3: Authentic Odell Down Under - Design Document

## Overview
Redesign the game to match the original Odell Down Under's core mechanics:
- 3x3 grid world system (9 unique zones)
- Species-specific diets (algae, fish, omnivores)
- Player growth/size progression
- Food chain complexity

---

## 1. ZONE SYSTEM (3x3 Grid)

### Architecture
```
Zone Layout (conceptual):
[0,0] [1,0] [2,0]  <- Surface zones (shallow, light)
[0,1] [1,1] [2,1]  <- Mid-depth zones
[0,2] [1,2] [2,2]  <- Deep zones (darker, predators)
```

### Zone Properties
Each zone has:
- `depth`: 'shallow' | 'mid' | 'deep'
- `biome`: 'reef' | 'kelp' | 'rocky' | 'sandy' | 'cave'
- `lightLevel`: 0-1 (affects visibility and algae growth)
- `temperature`: 'warm' | 'moderate' | 'cool'
- `species`: Array of species that spawn in this zone
- `algaeDensity`: How much algae grows here
- `hidingSpots`: Zone-specific environmental features

### Example Zone Configs
```javascript
zones[0][0] = {
  depth: 'shallow',
  biome: 'reef',
  lightLevel: 1.0,
  algaeDensity: 0.8,
  species: ['plankton', 'algae', 'smallHerbivore', 'shrimp'],
  hidingSpots: ['coral', 'anemone']
}

zones[2][2] = {
  depth: 'deep',
  biome: 'cave',
  lightLevel: 0.2,
  algaeDensity: 0.1,
  species: ['largePredator', 'eel', 'anglerfish'],
  hidingSpots: ['cave', 'crevice']
}
```

### Transition Mechanics
- Player moves to zone edge → transition to adjacent zone
- Smooth camera pan (0.5s animation)
- Edge wrapping: left edge of [0,1] connects to right edge of [2,1]
- Mini-map shows current zone and adjacent zones

---

## 2. SPECIES DIET SYSTEM

### Food Types
1. **Algae** - Grows on surfaces, respawns slowly
2. **Plankton** - Drifts, eaten by small fish
3. **Small Fish** - Prey for medium creatures
4. **Medium Fish** - Prey for large predators
5. **Large Fish** - Top of food chain

### Species Diet Matrix
```javascript
const DIETS = {
  // Herbivores (eat algae)
  parrotfish: ['algae'],
  surgeonfish: ['algae', 'plankton'],

  // Omnivores
  damselfish: ['algae', 'plankton'],
  clownfish: ['algae', 'plankton', 'shrimp'],

  // Small Carnivores
  shrimp: ['plankton'],
  smallFish: ['plankton'],

  // Medium Carnivores
  mediumPredator: ['shrimp', 'smallFish', 'damselfish'],

  // Large Carnivores
  largePredator: ['smallFish', 'mediumPredator', 'omnivores'],
  shark: ['mediumPredator', 'largePredator', 'player']
}
```

### Eating Rules
- Species can only eat items in their diet
- Size still matters: can't eat something >1.5x your size
- Player follows same rules (starts herbivore, becomes carnivore as grows)

---

## 3. PLAYER GROWTH SYSTEM

### Growth Stages
```javascript
const GROWTH_STAGES = [
  {
    name: 'Fry',
    size: 1.0,      // scale multiplier
    energyNeeded: 0,
    diet: ['algae', 'plankton'],
    speed: 200,
    color: '#f0a030'
  },
  {
    name: 'Juvenile',
    size: 1.5,
    energyNeeded: 50,
    diet: ['algae', 'plankton', 'shrimp'],
    speed: 220,
    color: '#f0a030'
  },
  {
    name: 'Teen',
    size: 2.0,
    energyNeeded: 150,
    diet: ['plankton', 'shrimp', 'smallFish'],
    speed: 240,
    color: '#e09020'
  },
  {
    name: 'Adult',
    size: 2.5,
    energyNeeded: 300,
    diet: ['smallFish', 'mediumFish', 'omnivores'],
    speed: 250,
    color: '#d08020'
  },
  {
    name: 'Apex',
    size: 3.5,
    energyNeeded: 500,
    diet: ['mediumFish', 'mediumPredator', 'largeFish'],
    speed: 270,
    color: '#c07010'
  }
]
```

### Growth Mechanics
- Player has `totalEnergyConsumed` counter
- When threshold reached, trigger growth event
- Smooth size transition animation (1 second)
- Update hitbox, speed, and diet
- Display "YOU'VE GROWN!" message

### Visual Changes
- Body size scales by growth stage multiplier
- Color darkens as player grows
- Fins/features become more prominent

---

## 4. ALGAE SYSTEM

### Algae Patches
```javascript
class AlgaePatch {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;        // 15-30 pixels
    this.density = 1.0;          // 0-1, decreases when eaten
    this.regrowthRate = 0.05;    // per second
    this.bites = [];             // track eaten areas
  }

  canEat(playerX, playerY) {
    // Check if player overlaps and density > 0.2
  }

  eat(amount) {
    this.density -= amount;
    // Record eaten area
  }

  regrow(dt) {
    this.density = Math.min(1.0, this.density + this.regrowthRate * dt);
  }
}
```

### Algae Generation
- Spawn 8-15 patches per zone
- Attach to surfaces (rocks, coral, bottom)
- Higher density in shallow, light zones
- Deep zones have bioluminescent algae (rare)

### Algae Rendering
- Green/brown clusters on surfaces
- Transparency based on density
- Sway animation for realism

---

## 5. IMPLEMENTATION PHASES

### Phase 3A: Grid System
1. Create `WorldGrid` class (9 zones)
2. Define zone properties
3. Implement zone transitions
4. Add mini-map UI
5. Update camera to track current zone

### Phase 3B: Diet System
1. Add `diet` property to all species
2. Implement `canEat(predator, prey)` function
3. Refactor collision to check diet compatibility
4. Add algae patches to zones
5. Update species spawning per zone

### Phase 3C: Growth System
1. Add growth stages to Player class
2. Track `totalEnergyConsumed`
3. Implement growth triggers
4. Add size scaling animation
5. Update player diet based on stage
6. Display growth notifications

### Phase 3D: Polish
1. Balance zone difficulty (easy shallow, hard deep)
2. Add zone-specific visual themes
3. Implement proper food chain (fish eat each other)
4. Add educational info popups
5. Win condition: reach apex stage and survive 60s

---

## 6. FILE STRUCTURE

New files needed:
```
js/
  worldGrid.js      - Zone management, transitions
  algae.js          - Algae patch system
  diets.js          - Diet definitions and rules
  growth.js         - Player growth system
  minimap.js        - Mini-map UI component
```

Modified files:
```
js/
  game.js           - Update to use WorldGrid
  player.js         - Add growth mechanics
  species.js        - Add diet properties
  fish.js           - Check diet before eating
  environment.js    - Per-zone generation
```

---

## 7. CONFIGURATION DATA

### Zone Definitions (zones.json or inline)
```javascript
const ZONE_CONFIG = {
  '0,0': { depth: 'shallow', biome: 'reef', light: 1.0, ... },
  '1,0': { depth: 'shallow', biome: 'kelp', light: 0.9, ... },
  // ... all 9 zones
}
```

### Species Definitions
```javascript
const SPECIES_CONFIG = {
  plankton: {
    diet: [],
    zones: ['0,0', '1,0', '2,0', '0,1', '1,1'],
    size: 0.3,
    // ...
  },
  // ... all species
}
```

---

## Next Steps

1. Review this design with you
2. Start with Phase 3A (Grid System)
3. Build incrementally, testing each phase
4. Adjust based on gameplay feel

Questions to clarify:
- Do you remember specific zone layouts from the original?
- Were there specific fish species (parrotfish, damselfish, etc.)?
- Was there a win condition or just survival?
- Did zones have names or were they just numbered?
