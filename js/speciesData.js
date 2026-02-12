/**
 * Species definitions for Odell Down Under
 * Based on the original 1994 MECC game
 *
 * Players progress through species sequentially in Tournament mode.
 * Each species has unique attributes, diet, and point requirements.
 */

const SPECIES_DATA = [
    // 1. SILVER SPRAT - Starting fish
    {
        id: 'silverSprat',
        name: 'Silver Sprat',
        size: 'tiny',
        sizeValue: 0.8,  // visual scale multiplier
        speed: 120,  // Reduced from 180
        agility: 4,
        endurance: 2,
        width: 32,
        height: 18,
        radius: 16,
        color: '#c0c0c0',
        tailColor: '#909090',
        diet: ['plankton', 'detritus'],
        timeOfDay: 'diurnal',
        pointsToNext: 100,
        canHideInCoral: true,
        canHideInCaves: true,
        canHideInGrass: true,
        description: 'Tiny schooling fish that feeds on plankton and organic matter.'
    },

    // 2. FLASHLIGHT FISH
    {
        id: 'flashlightFish',
        name: 'Flashlight Fish',
        size: 'small',
        sizeValue: 1.0,
        speed: 110,  // Reduced from 160
        agility: 5,
        endurance: 3,
        width: 36,
        height: 22,
        radius: 18,
        color: '#2c3e50',
        tailColor: '#1a252f',
        diet: ['plankton'],
        timeOfDay: 'nocturnal',
        abilities: ['illuminate'],
        pointsToNext: 150,
        canHideInCoral: true,
        canHideInCaves: true,
        canHideInGrass: true,
        description: 'Nocturnal fish with bioluminescent organs that illuminate dark waters.'
    },

    // 3. YELLOW SEAHORSE
    {
        id: 'yellowSeahorse',
        name: 'Yellow Seahorse',
        size: 'small',
        sizeValue: 0.9,
        speed: 70,  // Reduced from 100
        agility: 3,
        endurance: 4,
        width: 24,
        height: 40,
        radius: 20,
        color: '#f9e79f',
        tailColor: '#f4d03f',
        diet: ['plankton'],
        timeOfDay: 'diurnal',
        pointsToNext: 150,
        canHideInCoral: true,
        canHideInCaves: false,
        canHideInGrass: true,
        description: 'Slow-moving planktivore that anchors to coral with its prehensile tail.'
    },

    // 4. ACHILLES TANG
    {
        id: 'achillesTang',
        name: 'Achilles Tang',
        size: 'medium',
        sizeValue: 1.3,
        speed: 150,  // Reduced from 220
        agility: 4,
        endurance: 4,
        width: 50,
        height: 36,
        radius: 25,
        color: '#34495e',
        tailColor: '#1c2833',
        diet: ['algae', 'detritus'],
        timeOfDay: 'diurnal',
        pointsToNext: 200,
        canHideInCoral: true,
        canHideInCaves: true,
        canHideInGrass: false,
        description: 'Herbivorous surgeonfish that grazes on algae growing on reef surfaces.'
    },

    // 5. YELLOWSPOT EMPEROR
    {
        id: 'yellowspotEmperor',
        name: 'Yellowspot Emperor',
        size: 'medium',
        sizeValue: 1.5,
        speed: 130,  // Reduced from 200
        agility: 3,
        endurance: 4,
        width: 60,
        height: 38,
        radius: 30,
        color: '#e74c3c',
        tailColor: '#c0392b',
        diet: ['smallFish', 'shrimp', 'mollusks'],
        timeOfDay: 'diurnal',
        pointsToNext: 250,
        canHideInCoral: false,
        canHideInCaves: true,
        canHideInGrass: false,
        description: 'Carnivorous reef fish that hunts small fish and crustaceans.'
    },

    // 6. MORAY EEL
    {
        id: 'morayEel',
        name: 'Moray Eel',
        size: 'large',
        sizeValue: 2.0,
        speed: 120,  // Reduced from 180
        agility: 3,
        endurance: 5,
        width: 90,
        height: 30,
        radius: 45,
        color: '#7d6608',
        tailColor: '#5d4808',
        diet: ['smallFish', 'mediumFish', 'shrimp'],
        timeOfDay: 'nocturnal',
        pointsToNext: 300,
        canHideInCoral: false,
        canHideInCaves: true,
        canHideInGrass: false,
        description: 'Ambush predator that hides in crevices and strikes at passing prey.'
    },

    // 7. BLACKSPOTTED PUFFER
    {
        id: 'blackspottedPuffer',
        name: 'Blackspotted Puffer',
        size: 'medium',
        sizeValue: 1.4,
        speed: 100,  // Reduced from 150
        agility: 2,
        endurance: 5,
        width: 55,
        height: 50,
        radius: 28,
        color: '#f8c471',
        tailColor: '#d4ac0d',
        diet: ['mollusks', 'shrimp', 'algae'],
        timeOfDay: 'diurnal',
        abilities: ['inflate'],
        pointsToNext: 300,
        canHideInCoral: true,
        canHideInCaves: true,
        canHideInGrass: false,
        description: 'Can inflate body when threatened. Feeds on hard-shelled invertebrates.'
    },

    // 8. SHORT-TAIL ELECTRIC RAY
    {
        id: 'electricRay',
        name: 'Short-tail Electric Ray',
        size: 'large',
        sizeValue: 1.8,
        speed: 95,  // Reduced from 140
        agility: 2,
        endurance: 5,
        width: 80,
        height: 60,
        radius: 40,
        color: '#8e44ad',
        tailColor: '#6c3483',
        diet: ['smallFish', 'mollusks', 'shrimp'],
        timeOfDay: 'diurnal',
        abilities: ['electricShock'],
        pointsToNext: 350,
        canHideInCoral: false,
        canHideInCaves: false,
        canHideInGrass: false,
        description: 'Bottom-dwelling ray that stuns prey with electric discharges.'
    },

    // 9. BLACKTIP SHARK
    {
        id: 'blacktipShark',
        name: 'Blacktip Shark',
        size: 'large',
        sizeValue: 2.5,
        speed: 180,  // Reduced from 280
        agility: 4,
        endurance: 5,
        width: 100,
        height: 50,
        radius: 50,
        color: '#34495e',
        tailColor: '#1c2833',
        diet: ['smallFish', 'mediumFish', 'rays', 'squid'],
        timeOfDay: 'crepuscular',  // active dawn/dusk
        pointsToNext: 400,
        canHideInCoral: false,
        canHideInCaves: false,
        canHideInGrass: false,
        description: 'Fast-swimming predator most active at sunrise and sunset.'
    },

    // 10. GREAT WHITE SHARK - Final species
    {
        id: 'greatWhite',
        name: 'Great White Shark',
        size: 'apex',
        sizeValue: 3.5,
        speed: 200,  // Reduced from 300
        agility: 3,
        endurance: 5,
        width: 140,
        height: 60,
        radius: 70,
        color: '#95a5a6',
        tailColor: '#7f8c8d',
        diet: ['mediumFish', 'largeFish', 'sharks', 'rays', 'sponges'],
        timeOfDay: 'diurnal',
        immuneToPoison: true,
        pointsToNext: 0,  // final species
        canHideInCoral: false,
        canHideInCaves: false,
        canHideInGrass: false,
        description: 'Apex predator of the reef. Immune to poison. Win by surviving!'
    }
];

/**
 * Food type definitions
 */
const FOOD_TYPES = {
    // Base food sources
    plankton: {
        category: 'microorganism',
        energyValue: 5,
        healthImpact: 0,
        respawns: true,
        drifts: true
    },
    detritus: {
        category: 'organic-matter',
        energyValue: 3,
        healthImpact: 0,
        respawns: true,
        settles: true
    },
    algae: {
        category: 'plant',
        energyValue: 4,
        healthImpact: 0,
        respawns: true,
        fixedLocation: true
    },

    // Animal prey (handled by species system)
    smallFish: {
        category: 'prey',
        energyValue: 15,
        healthImpact: 0
    },
    mediumFish: {
        category: 'prey',
        energyValue: 25,
        healthImpact: 0
    },
    largeFish: {
        category: 'prey',
        energyValue: 40,
        healthImpact: 0
    },
    shrimp: {
        category: 'crustacean',
        energyValue: 10,
        healthImpact: 0
    },
    mollusks: {
        category: 'invertebrate',
        energyValue: 8,
        healthImpact: 0
    },
    squid: {
        category: 'cephalopod',
        energyValue: 20,
        healthImpact: 0
    },
    rays: {
        category: 'prey',
        energyValue: 35,
        healthImpact: 0
    },
    sharks: {
        category: 'prey',
        energyValue: 50,
        healthImpact: 0
    },

    // Hazardous food
    seaSlug: {
        category: 'hazard',
        energyValue: 5,
        healthImpact: -30,
        poisonous: true
    },
    sponge: {
        category: 'hazard',
        energyValue: 10,
        healthImpact: -40,
        poisonous: true,
        immuneSpecies: ['greatWhite']
    }
};

/**
 * Cleaner species that restore health
 */
const CLEANER_SPECIES = {
    bluestreakCleanerWrasse: {
        name: 'Bluestreak Cleaner Wrasse',
        healthRestored: 20,
        timeOfDay: 'diurnal',
        zones: ['0,0', '1,0', '2,0', '0,1', '1,1', '2,1'],
        notFood: true
    },
    bandedCoralShrimp: {
        name: 'Banded Coral Shrimp',
        healthRestored: 15,
        timeOfDay: 'nocturnal',
        zones: ['0,2', '1,2', '2,2'],
        notFood: true
    }
};

/**
 * Helper function: Get species by ID
 */
function getSpeciesById(id) {
    return SPECIES_DATA.find(s => s.id === id);
}

/**
 * Helper function: Get species by index
 */
function getSpeciesByIndex(index) {
    return SPECIES_DATA[index];
}

/**
 * Helper function: Check if species can eat food type
 */
function canEat(speciesId, foodType) {
    const species = getSpeciesById(speciesId);
    if (!species) return false;

    // Check diet
    if (!species.diet.includes(foodType)) return false;

    // Check poison immunity
    const food = FOOD_TYPES[foodType];
    if (food && food.poisonous && !species.immuneToPoison) {
        // Can eat but will take health damage
        return true;
    }

    return true;
}

/**
 * Helper function: Get next species in progression
 */
function getNextSpecies(currentSpeciesId) {
    const currentIndex = SPECIES_DATA.findIndex(s => s.id === currentSpeciesId);
    if (currentIndex === -1 || currentIndex === SPECIES_DATA.length - 1) {
        return null;  // No next species (final form or not found)
    }
    return SPECIES_DATA[currentIndex + 1];
}
