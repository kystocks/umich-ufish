# Authentic Odell Down Under - Implementation Plan

Based on comprehensive research of the original 1994 MECC game.

---

## CORE MECHANICS (Verified from Original)

### 1. SPECIES PROGRESSION SYSTEM

**NOT Growth - Species Evolution**
- Player progresses through **55 playable fish species** sequentially
- Each species is a distinct character with unique stats
- Advancement triggered by earning enough points

**Progression Path:**
```
Silver Sprat (smallest)
  → Small herbivores/planktivores
  → Medium carnivores (Moray Eel, Achilles Tang)
  → Large predators (Blacktip Shark)
  → Great White Shark (apex)
```

**Species Attributes:**
```javascript
{
  name: "Flashlight Fish",
  size: "small",
  speed: 3,          // 1-5 scale
  agility: 4,
  endurance: 3,
  diet: ["plankton"],
  timeOfDay: "nocturnal",
  abilities: ["illuminate"],
  pointsToNext: 150,
  canHideInCoral: true,
  canHideInCaves: true,
  canHideInGrass: true
}
```

---

### 2. DUAL METER SYSTEM

#### Energy (Primary Survival)
- Constantly depletes over time
- Depletes faster when moving/exerting
- Replenished by eating appropriate food
- Reaching 0 = death by starvation
- Green bar in UI

#### Health (Secondary Survival)
- Damaged by:
  - Eating poisonous organisms (sea slugs, sponges)
  - Contact with hazards
  - Predator attacks (if implemented)
- **Only restored by cleaner species:**
  - Diurnal fish → seek Bluestreak Cleaner Wrasse
  - Nocturnal fish → seek Banded Coral Shrimp
- Reaching 0 = death
- Red bar in UI

---

### 3. FOOD CHAIN & DIET SYSTEM

#### Base Food Sources
```javascript
const BASE_FOOD = {
  algae: {
    type: "plant",
    energyValue: 3,
    respawns: true,
    fixedLocations: true,
    eatenBy: ["herbivores"]
  },
  plankton: {
    type: "microorganism",
    energyValue: 5,
    drifts: true,
    eatenBy: ["planktivores", "filter-feeders"]
  },
  detritus: {
    type: "organic-matter",
    energyValue: 2,
    settles: true,
    eatenBy: ["detritivores"]
  }
}
```

#### Example Species Diets
```javascript
const SPECIES_DIETS = {
  "Silver Sprat": ["plankton", "detritus"],
  "Flashlight Fish": ["plankton"],
  "Yellow Seahorse": ["plankton"],
  "Achilles Tang": ["algae", "detritus"],
  "Yellowspot Emperor": ["small-fish", "crustaceans", "mollusks"],
  "Moray Eel": ["fish", "crustaceans"],
  "Blacktip Shark": ["fish", "rays", "squid"],
  "Great White Shark": ["large-fish", "sharks", "rays", "sponges"]  // can eat poison
}
```

#### Poisonous Organisms
```javascript
const HAZARDOUS_FOOD = {
  "sea-slug": {
    healthDamage: -30,
    energyValue: 5,
    description: "Poisonous to most fish"
  },
  "sponge": {
    healthDamage: -40,
    energyValue: 10,
    immuneSpecies: ["Great White Shark"]
  }
}
```

#### Cleaner Species (Restore Health Only)
```javascript
const CLEANERS = {
  "Bluestreak Cleaner Wrasse": {
    restoresHealth: 20,
    servesTimeOfDay: "diurnal",
    zones: ["reef-crest", "mid-level"],
    notFood: true  // Cannot be eaten
  },
  "Banded Coral Shrimp": {
    restoresHealth: 15,
    servesTimeOfDay: "nocturnal",
    zones: ["caves", "crevices"],
    notFood: true
  }
}
```

---

### 4. ZONE SYSTEM (3x3 Grid)

#### Grid Structure
```
[0,0 Reef Crest] [1,0 Reef Crest] [2,0 Reef Crest]  <- Shallow, most light
[0,1 Mid-Level]  [1,1 Mid-Level]  [2,1 Mid-Level]   <- Medium depth
[0,2 Bottom]     [1,2 Bottom]     [2,2 Bottom]       <- Deep, sandy/rocky
```

#### Zone Properties
```javascript
const ZONES = {
  // Top row - Reef Crest (shallowest)
  "0,0": {
    depth: "shallow",
    terrain: "coral-rich",
    lightLevel: 1.0,
    algaeDensity: 0.9,
    coralCover: 0.8,
    species: ["Silver Sprat", "Flashlight Fish", "Yellow Seahorse", "herbivores"],
    cleaners: ["Bluestreak Cleaner Wrasse"],
    hidingSpots: ["coral", "grass"]
  },

  // Middle row - Mid-Level
  "1,1": {
    depth: "mid",
    terrain: "mixed-coral-sand",
    lightLevel: 0.6,
    algaeDensity: 0.5,
    coralCover: 0.5,
    species: ["Achilles Tang", "Yellowspot Emperor", "medium-predators"],
    cleaners: ["Bluestreak Cleaner Wrasse"],
    hidingSpots: ["coral", "caves", "grass"]
  },

  // Bottom row - Sandy Bottom (deepest)
  "2,2": {
    depth: "deep",
    terrain: "sandy-rocky",
    lightLevel: 0.3,
    algaeDensity: 0.1,
    coralCover: 0.2,
    species: ["Moray Eel", "Stingray", "Blacktip Shark", "large-predators"],
    cleaners: ["Banded Coral Shrimp"],
    hidingSpots: ["caves", "crevices", "rocks"]
  }
}
```

#### Zone Transitions
- Player reaches screen edge → pan to adjacent zone
- Smooth camera transition (0.5s)
- Edge wrapping: left of [0,1] connects to right of [2,1]
- Species populations are zone-specific
- Some species migrate between adjacent zones

---

### 5. GAME MODES

#### Tournament Mode (Main Mode)
```javascript
const TOURNAMENT = {
  speciesCount: 55,
  progression: "sequential",  // must complete each species in order
  startingSpecies: "Silver Sprat",
  finalSpecies: "Great White Shark",
  pointRequirements: [
    { species: "Silver Sprat", pointsNeeded: 100 },
    { species: "Flashlight Fish", pointsNeeded: 150 },
    // ... 53 more species
    { species: "Great White Shark", pointsNeeded: 0 }  // final
  ],
  winCondition: "Complete as Great White Shark",
  rewardTitle: "Reef Ruler"
}
```

#### Challenge Mode
```javascript
const CHALLENGE = {
  speciesCount: 4,  // randomly selected
  progression: "small to large",
  randomSelection: true,
  shorterPlaytime: true,
  winCondition: "Complete all 4 species",
  rewardTitle: "Reef Ruler (displayed in opening movie)"
}
```

#### Practice Mode
```javascript
const PRACTICE = {
  selectAnySpecies: true,
  noPointTracking: true,
  endlessPlay: true,
  purpose: "Learn mechanics and species"
}
```

#### Create-A-Fish Mode
```javascript
const CREATE_A_FISH = {
  customizable: {
    speed: "1-5 skill points",
    agility: "1-5 skill points",
    endurance: "1-5 skill points",
    size: "1-5 skill points",
    color: "custom palette",
    ability: ["sonic-blast", "electric-shock", "squirt-ink", "poisonous"],
    timeOfDay: ["diurnal", "nocturnal"]
  },
  totalSkillPoints: 15,  // distribute among stats
  balancing: "higher stats = more skill points consumed"
}
```

---

### 6. POINT SYSTEM

#### Earning Points
```javascript
function awardPoints(preyEaten) {
  let points = preyEaten.baseValue;

  // Bonus for appropriate diet match
  if (currentSpecies.diet.includes(preyEaten.type)) {
    points *= 1.5;
  }

  // Bonus for difficulty (larger prey = more points)
  if (preyEaten.size === "large") {
    points *= 2.0;
  }

  // Survival time bonus
  points += Math.floor(survivalTime / 60) * 10;  // 10 pts per minute

  return points;
}
```

#### Advancement Triggers
```javascript
function checkAdvancement() {
  if (currentPoints >= currentSpecies.pointsToNext) {
    // Trigger species evolution
    playTransitionAnimation();
    loadNextSpecies();
    grantBonusPoints(currentSpecies.advancementBonus);
    displayMessage(`You are now a ${nextSpecies.name}!`);

    // Update UI
    updateFieldGuide(nextSpecies);
    updateHidingSpotsAvailable(nextSpecies.size);
  }
}
```

---

### 7. HIDING MECHANICS

#### Size-Based Restrictions
```javascript
const HIDING_RULES = {
  coral: {
    maxSize: "medium",
    blocksLineOfSight: true,
    entryPoints: "gaps-between-branches"
  },
  grass: {
    maxSize: "small",
    blocksLineOfSight: true,
    entryPoints: "anywhere"
  },
  caves: {
    maxSize: "large",  // some caves fit big fish
    blocksLineOfSight: true,
    entryPoints: "cave-mouth",
    types: ["small-crevice", "medium-cave", "large-cavern"]
  }
}
```

#### Predator Detection
- Player hidden → predators cannot detect
- Must be fully inside hiding spot
- Can remain hidden indefinitely
- Energy still depletes while hidden

---

### 8. DAY/NIGHT CYCLE

```javascript
const TIME_SYSTEM = {
  cycleDuration: 480,  // 8 real minutes = 24 game hours
  phases: {
    dawn: { start: 0, duration: 60, lightLevel: 0.5 },
    day: { start: 60, duration: 180, lightLevel: 1.0 },
    dusk: { start: 240, duration: 60, lightLevel: 0.5 },
    night: { start: 300, duration: 180, lightLevel: 0.2 }
  },

  effects: {
    diurnal: {
      activePhases: ["dawn", "day", "dusk"],
      sleepPhase: "night",
      cleaner: "Bluestreak Cleaner Wrasse"
    },
    nocturnal: {
      activePhases: ["night"],
      sleepPhase: "day",
      cleaner: "Banded Coral Shrimp",
      abilities: ["illuminate"]  // Flashlight Fish
    }
  }
}
```

---

### 9. FIELD GUIDE (Educational Component)

```javascript
const FIELD_GUIDE = {
  entries: 100+,  // Over 100 marine life forms
  accessible: "pause-menu",
  content: {
    species: {
      name: "Flashlight Fish",
      scientificName: "Photoblepharon palpebratus",
      diet: ["plankton"],
      habitat: "reef crevices",
      behavior: "nocturnal, uses bioluminescence",
      size: "small",
      funFact: "Has light-producing organ under eye"
    }
  },
  categories: ["fish", "invertebrates", "plants", "coral", "hazards"]
}
```

---

### 10. UI/HUD ELEMENTS

```javascript
const HUD = {
  topLeft: {
    energyBar: { color: "green", depletes: true },
    healthBar: { color: "red", depletes: false },
    currentSpecies: "Flashlight Fish",
    currentPoints: 85,
    pointsToNext: 150
  },
  topRight: {
    survivalTime: "2:34",
    timeOfDay: "Night",
    currentZone: "[1,1]"
  },
  bottomRight: {
    miniMap: "3x3 grid, current zone highlighted"
  },
  menuBar: {
    file: ["New Game", "Load", "Save", "Quit"],
    game: ["Pause", "Field Guide", "Options"],
    help: ["How to Play", "About"]
  }
}
```

---

## IMPLEMENTATION PRIORITY

### Phase 3A: Core Systems (Week 1)
1. ✅ Dual meter system (energy + health)
2. ✅ Species data structure (start with 5-10 species)
3. ✅ Point accumulation and advancement
4. ✅ Basic diet system (can eat X, cannot eat Y)

### Phase 3B: Zone System (Week 2)
1. ✅ 3x3 grid with camera system
2. ✅ Zone transitions
3. ✅ Per-zone species spawning
4. ✅ Mini-map UI

### Phase 3C: Food Chain (Week 3)
1. ✅ Algae patches (fixed locations, respawn)
2. ✅ Cleaner species interactions (restore health)
3. ✅ Poisonous organisms (damage health)
4. ✅ Diet enforcement (can only eat valid prey)

### Phase 3D: Polish (Week 4)
1. ✅ Day/night cycle
2. ✅ Field Guide UI
3. ✅ Species progression animations
4. ✅ Tournament mode structure
5. ✅ Balance and playtesting

---

## INITIAL SPECIES ROSTER (Simplified for MVP)

Starting with 10 species to prove the system:

1. **Silver Sprat** (starting fish)
   - Size: tiny, Diet: plankton/detritus, Points: 100

2. **Flashlight Fish**
   - Size: small, Diet: plankton, Nocturnal, Points: 150

3. **Yellow Seahorse**
   - Size: small, Diet: plankton, Points: 150

4. **Achilles Tang**
   - Size: medium, Diet: algae/detritus, Points: 200

5. **Yellowspot Emperor**
   - Size: medium, Diet: small-fish/crustaceans, Points: 250

6. **Moray Eel**
   - Size: large, Diet: fish/crustaceans, Points: 300

7. **Short-tail Electric Ray**
   - Size: large, Diet: fish/mollusks, Ability: shock, Points: 350

8. **Blacktip Shark**
   - Size: large, Diet: fish/rays/squid, Points: 400

9. **Blackspotted Puffer**
   - Size: medium, Diet: mollusks/crustaceans, Ability: inflate, Points: 300

10. **Great White Shark** (final)
    - Size: apex, Diet: everything, Immune to poison, Win condition

Later expand to full 55 species.

---

## TECHNICAL ARCHITECTURE

### New Files Needed
```
js/
  species/
    speciesData.js       - All 55 species definitions
    speciesManager.js    - Handle current species, progression
  systems/
    healthSystem.js      - Health meter, damage, healing
    pointSystem.js       - Point accumulation, advancement
    dietSystem.js        - Food validation, eating rules
    timeSystem.js        - Day/night cycle
  world/
    worldGrid.js         - 3x3 zone management
    zoneData.js          - Zone definitions
    camera.js            - Zone transition camera
  food/
    algae.js             - Algae patch system
    cleaners.js          - Cleaner species interactions
    hazards.js           - Poisonous organisms
  ui/
    fieldGuide.js        - Educational database UI
    miniMap.js           - Zone mini-map
    advancementUI.js     - "You are now a X!" screens
```

---

This design is based on verified information from the original game. Ready to implement!
