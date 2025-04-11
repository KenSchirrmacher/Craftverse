// Passive mobs implementation
const MobBase = require('./mobBase');

// Sheep - a basic passive mob that drops wool when killed
class Sheep extends MobBase {
  constructor(position) {
    super('sheep', position, 8, 0.7); // type, position, health, speed
    this.woolColor = this.getRandomColor();
    this.hasWool = true;
    this.woolRegrowTimer = 0;
    this.eatingGrassTimer = 0;
    this.isEating = false;
    this.fleeHealth = 4; // Flee at half health
  }

  update(world, players, mobs, deltaTime) {
    super.update(world, players, mobs, deltaTime);

    // Regrow wool over time
    if (!this.hasWool) {
      this.woolRegrowTimer += deltaTime;
      if (this.woolRegrowTimer >= 6000) { // 5 minutes (6000 ticks)
        this.hasWool = true;
        this.woolRegrowTimer = 0;
      }
    }

    // Randomly eat grass
    if (this.state === 'idle' && Math.random() < 0.001 && !this.isEating) {
      this.isEating = true;
      this.eatingGrassTimer = 40; // 2 seconds (40 ticks)
    }

    // Update eating animation
    if (this.isEating) {
      this.eatingGrassTimer -= deltaTime;
      if (this.eatingGrassTimer <= 0) {
        this.isEating = false;
        this.hasWool = true; // Eating grass regrows wool
      }
    }
  }

  getRandomColor() {
    const colors = [
      'white', 'orange', 'magenta', 'light_blue', 
      'yellow', 'lime', 'pink', 'gray', 
      'light_gray', 'cyan', 'purple', 'blue', 
      'brown', 'green', 'red', 'black'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getDrops() {
    const drops = [];
    
    // Drop wool if has wool
    if (this.hasWool) {
      drops.push({
        type: 'wool',
        color: this.woolColor,
        count: 1
      });
    }
    
    // Always drop raw mutton
    drops.push({
      type: 'raw_mutton',
      count: Math.floor(Math.random() * 2) + 1 // 1-2 raw mutton
    });
    
    return drops;
  }

  shear() {
    if (!this.hasWool) return null;
    
    this.hasWool = false;
    return {
      type: 'wool',
      color: this.woolColor,
      count: 1
    };
  }

  isPassive() {
    return true;
  }

  serialize() {
    return {
      ...super.serialize(),
      woolColor: this.woolColor,
      hasWool: this.hasWool,
      isEating: this.isEating
    };
  }
}

// Cow - drops leather and beef
class Cow extends MobBase {
  constructor(position) {
    super('cow', position, 10, 0.7); // type, position, health, speed
    this.fleeHealth = 5; // Flee at half health
  }

  getDrops() {
    return [
      {
        type: 'leather',
        count: Math.floor(Math.random() * 2) + 1 // 1-2 leather
      },
      {
        type: 'raw_beef',
        count: Math.floor(Math.random() * 3) + 1 // 1-3 raw beef
      }
    ];
  }

  isPassive() {
    return true;
  }
}

// Chicken - drops feathers and chicken
class Chicken extends MobBase {
  constructor(position) {
    super('chicken', position, 4, 0.5); // type, position, health, speed
    this.eggLayTimer = Math.floor(Math.random() * 6000) + 6000; // 5-10 minutes
    this.fleeHealth = 2; // Flee at half health
  }

  update(world, players, mobs, deltaTime) {
    super.update(world, players, mobs, deltaTime);

    // Egg laying logic
    if (this.eggLayTimer > 0) {
      this.eggLayTimer -= deltaTime;
      if (this.eggLayTimer <= 0) {
        // Lay egg (would be implemented with item dropping)
        this.eggLayTimer = Math.floor(Math.random() * 6000) + 6000; // Reset timer
        return { type: 'layEgg', position: { ...this.position } };
      }
    }
  }

  getDrops() {
    return [
      {
        type: 'feather',
        count: Math.floor(Math.random() * 2) + 1 // 1-2 feathers
      },
      {
        type: 'raw_chicken',
        count: 1
      }
    ];
  }

  isPassive() {
    return true;
  }

  serialize() {
    return {
      ...super.serialize(),
      layingEgg: this.eggLayTimer < 20 // Is about to lay an egg
    };
  }
}

// Pig - drops porkchop
class Pig extends MobBase {
  constructor(position) {
    super('pig', position, 10, 0.6); // type, position, health, speed
    this.saddled = false;
    this.fleeHealth = 5; // Flee at half health
  }

  getDrops() {
    const drops = [
      {
        type: 'raw_porkchop',
        count: Math.floor(Math.random() * 3) + 1 // 1-3 raw porkchop
      }
    ];
    
    // Drop saddle if saddled
    if (this.saddled) {
      drops.push({
        type: 'saddle',
        count: 1
      });
    }
    
    return drops;
  }

  applySaddle() {
    if (!this.saddled) {
      this.saddled = true;
      return true;
    }
    return false;
  }

  isPassive() {
    return true;
  }

  serialize() {
    return {
      ...super.serialize(),
      saddled: this.saddled
    };
  }
}

module.exports = {
  Sheep,
  Cow,
  Chicken,
  Pig
}; 