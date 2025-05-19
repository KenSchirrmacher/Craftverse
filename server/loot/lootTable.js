class LootTable {
  constructor() {
    this.lootPools = {
      common: [
        { item: 'iron_ingot', weight: 10, min: 1, max: 5 },
        { item: 'gold_ingot', weight: 8, min: 1, max: 3 },
        { item: 'emerald', weight: 5, min: 1, max: 2 },
        { item: 'diamond', weight: 3, min: 1, max: 1 },
        { item: 'enchanted_book', weight: 2, min: 1, max: 1 }
      ],
      uncommon: [
        { item: 'diamond', weight: 10, min: 1, max: 3 },
        { item: 'emerald', weight: 8, min: 1, max: 4 },
        { item: 'enchanted_book', weight: 6, min: 1, max: 2 },
        { item: 'netherite_scrap', weight: 4, min: 1, max: 1 },
        { item: 'ancient_debris', weight: 2, min: 1, max: 1 }
      ],
      rare: [
        { item: 'netherite_ingot', weight: 10, min: 1, max: 1 },
        { item: 'enchanted_golden_apple', weight: 8, min: 1, max: 1 },
        { item: 'enchanted_book', weight: 6, min: 1, max: 3 },
        { item: 'trident', weight: 4, min: 1, max: 1 },
        { item: 'elytra', weight: 2, min: 1, max: 1 }
      ]
    };
  }

  generateLoot(difficulty) {
    const loot = [];
    
    // Determine loot pool based on difficulty
    let pool;
    if (difficulty <= 1) {
      pool = this.lootPools.common;
    } else if (difficulty <= 3) {
      pool = this.lootPools.uncommon;
    } else {
      pool = this.lootPools.rare;
    }

    // Generate 2-4 items
    const itemCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < itemCount; i++) {
      const item = this.selectRandomItem(pool);
      if (item) {
        loot.push({
          item: item.item,
          count: this.getRandomCount(item.min, item.max)
        });
      }
    }

    return loot;
  }

  selectRandomItem(pool) {
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of pool) {
      random -= item.weight;
      if (random <= 0) {
        return item;
      }
    }
    
    return pool[0];
  }

  getRandomCount(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }
}

module.exports = { LootTable }; 