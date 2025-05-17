// Breeze mob implementation for Minecraft 1.21 (Tricky Trials)
const MobBase = require('./mobBase');

class Breeze extends MobBase {
  constructor(position) {
    // Setting base properties - the Breeze is a flying hostile mob with average health
    super('breeze', position, 20, 0.9); // type, position, health, speed
    
    // Breeze-specific properties
    this.attackDamage = 3;
    this.attackRange = 10; // Longer attack range
    this.aggroRange = 16;
    this.flyingMob = true;
    this.preferredHeight = 3; // Tends to float 3 blocks above ground
    this.maxChargeTime = 40; // 2 seconds to charge a wind attack
    this.currentChargeTime = 0;
    this.isCharging = false;
    this.attackCooldown = 60; // 3 seconds between attacks
    this.windChargeCooldown = 0;
    this.hasWindCharge = true;
    this.lastWindAttackTime = 0;
    this.movementPattern = 'circle'; // Can be 'circle', 'approach', 'retreat'
    this.patternTimer = 0;
    this.verticalVelocity = 0;
    this.airState = 'hover'; // Can be 'hover', 'rise', 'descend'
    this.airStateTimer = 0;
    this.maxAirStateTime = 60; // 3 seconds for each air state
    this.floatingOffsetY = 0;
    this.maxFloatingOffset = 0.5; // Maximum floating bobbing motion
    this.floatingDirection = 1; // 1 for up, -1 for down
    this.floatingSpeed = 0.02; // Speed of bobbing motion
  }

  // Override the update method to add Breeze-specific behavior
  update(world, players, mobs, deltaTime) {
    // Call parent update for basic behaviors
    super.update(world, players, mobs, deltaTime);
    
    // Update cooldowns
    if (this.windChargeCooldown > 0) {
      this.windChargeCooldown -= deltaTime;
    }
    
    // Update charging state
    if (this.isCharging) {
      this.currentChargeTime += deltaTime;
      
      // If fully charged, fire wind charge
      if (this.currentChargeTime >= this.maxChargeTime) {
        this.fireWindCharge();
        this.currentChargeTime = 0;
        this.isCharging = false;
      }
    }
    
    // Update floating bobbing motion
    this.updateFloatingMotion(deltaTime);
    
    // Update air state (hover, rise, descend)
    this.updateAirState(deltaTime);
    
    // Update movement pattern (circle, approach, retreat)
    this.updateMovementPattern(deltaTime);
    
    // Check for nearby players to target if idle
    if (this.state === 'idle' && Math.random() < 0.1) {
      let closestPlayer = null;
      let shortestDistance = this.aggroRange;
      
      for (const playerId in players) {
        const player = players[playerId];
        const distance = this.distanceTo(player.position);
        
        if (distance < shortestDistance) {
          shortestDistance = distance;
          closestPlayer = player;
        }
      }
      
      if (closestPlayer) {
        this.targetEntity = closestPlayer;
        this.state = 'follow';
      }
    }
  }
  
  // Update the floating bobbing motion
  updateFloatingMotion(deltaTime) {
    // Update the floating offset
    this.floatingOffsetY += this.floatingDirection * this.floatingSpeed * deltaTime;
    
    // Change direction if reached max offset
    if (Math.abs(this.floatingOffsetY) >= this.maxFloatingOffset) {
      this.floatingDirection *= -1;
    }
    
    // Apply the floating offset to the position
    // This is just visual and doesn't affect actual position for distance calculations
  }
  
  // Update the air state (hover, rise, descend)
  updateAirState(deltaTime) {
    this.airStateTimer += deltaTime;
    
    // Change air state after timer expires
    if (this.airStateTimer >= this.maxAirStateTime) {
      this.airStateTimer = 0;
      
      // Randomly select a new air state
      const airStates = ['hover', 'rise', 'descend'];
      this.airState = airStates[Math.floor(Math.random() * airStates.length)];
    }
    
    // Apply vertical movement based on air state
    switch (this.airState) {
      case 'hover':
        this.verticalVelocity = 0;
        break;
      case 'rise':
        this.verticalVelocity = 0.05;
        break;
      case 'descend':
        this.verticalVelocity = -0.05;
        break;
    }
    
    // Apply vertical velocity
    this.position.y += this.verticalVelocity * deltaTime;
    
    // Make sure the breeze doesn't go below ground or too high
    // In a real implementation, we would check for block collisions here
    if (this.position.y < 1) {
      this.position.y = 1;
      this.airState = 'rise';
    } else if (this.position.y > 20) {
      this.position.y = 20;
      this.airState = 'descend';
    }
  }
  
  // Update the movement pattern (circle, approach, retreat)
  updateMovementPattern(deltaTime) {
    this.patternTimer += deltaTime;
    
    // Change movement pattern after a while
    if (this.patternTimer >= 100) { // 5 seconds
      this.patternTimer = 0;
      
      // Select a new movement pattern based on current conditions
      if (this.targetEntity) {
        const distanceToTarget = this.distanceTo(this.targetEntity.position);
        
        if (distanceToTarget < 5) {
          // Too close, prefer to retreat or circle
          this.movementPattern = Math.random() < 0.7 ? 'retreat' : 'circle';
        } else if (distanceToTarget > 12) {
          // Too far, prefer to approach
          this.movementPattern = 'approach';
        } else {
          // Good range, prefer circling
          this.movementPattern = Math.random() < 0.7 ? 'circle' : (Math.random() < 0.5 ? 'retreat' : 'approach');
        }
      } else {
        // No target, just circle around
        this.movementPattern = 'circle';
      }
    }
  }
  
  // Override the default follow behavior for a flying mob
  updateFollow(world, deltaTime) {
    // If no target, go back to idle
    if (!this.targetEntity) {
      this.state = 'idle';
      return;
    }
    
    // Get distance to target
    const distanceToTarget = this.distanceTo(this.targetEntity.position);
    
    // Apply movement based on pattern
    switch (this.movementPattern) {
      case 'approach':
        this.moveTowards(this.targetEntity.position, deltaTime);
        break;
      case 'retreat':
        this.fleeFrom(this.targetEntity.position, deltaTime);
        break;
      case 'circle':
        this.circleTarget(deltaTime);
        break;
    }
    
    // If we're in a good attack range, potentially start an attack
    if (distanceToTarget <= this.attackRange && distanceToTarget > 3) {
      // Good distance for ranged attack
      if (!this.isCharging && this.windChargeCooldown <= 0 && Math.random() < 0.3) {
        this.startCharging();
      }
    } else if (distanceToTarget <= 3) {
      // Too close, favor retreat
      this.movementPattern = 'retreat';
    } else if (distanceToTarget > this.aggroRange) {
      // If target moved too far, stop following
      this.state = 'idle';
      this.targetEntity = null;
    }
  }
  
  // Circle around the target
  circleTarget(deltaTime) {
    if (!this.targetEntity) return;
    
    // Calculate current angle to target
    const dx = this.position.x - this.targetEntity.position.x;
    const dz = this.position.z - this.targetEntity.position.z;
    const currentAngle = Math.atan2(dz, dx);
    
    // Calculate new angle (rotate around target)
    const circleSpeed = 0.02 * deltaTime;
    const newAngle = currentAngle + circleSpeed;
    
    // Calculate ideal distance (between 5 and 8 blocks)
    const idealDistance = 6;
    const currentDistance = Math.sqrt(dx * dx + dz * dz);
    
    // Calculate new position
    const distanceFactor = idealDistance / Math.max(0.1, currentDistance);
    const newDx = Math.cos(newAngle) * idealDistance;
    const newDz = Math.sin(newAngle) * idealDistance;
    
    // Set new position
    const targetPos = {
      x: this.targetEntity.position.x + newDx,
      y: this.targetEntity.position.y + this.preferredHeight, // Stay above target
      z: this.targetEntity.position.z + newDz
    };
    
    // Move towards calculated position
    this.moveTowards(targetPos, deltaTime);
    
    // Update rotation to face the target
    this.rotation.y = Math.atan2(
      this.targetEntity.position.x - this.position.x,
      this.targetEntity.position.z - this.position.z
    );
  }
  
  // Start charging a wind attack
  startCharging() {
    this.isCharging = true;
    this.currentChargeTime = 0;
    
    // In a real game, you would broadcast this state change to clients
    // for visual cues (particle effects, animation, etc.)
    return {
      type: 'breeze_charging'
    };
  }
  
  // Fire a wind charge attack
  fireWindCharge() {
    if (!this.targetEntity) return null;
    
    // Calculate direction to target
    const dirX = this.targetEntity.position.x - this.position.x;
    const dirY = this.targetEntity.position.y - this.position.y;
    const dirZ = this.targetEntity.position.z - this.position.z;
    
    // Normalize direction
    const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
    const normalizedDir = {
      x: dirX / length,
      y: dirY / length,
      z: dirZ / length
    };
    
    // Create a wind charge projectile
    this.lastWindAttackTime = Date.now();
    this.windChargeCooldown = 60; // 3 seconds before next attack
    
    // Return data for creating a wind charge projectile
    return {
      type: 'wind_charge',
      position: { ...this.position },
      direction: normalizedDir,
      shooter: this.id,
      damage: 5,
      velocity: 1.5,
      gravity: 0.03,
      radius: 1.5  // Blast radius
    };
  }
  
  // Handle when this mob is hit
  takeDamage(amount, attacker) {
    // Call parent method
    super.takeDamage(amount, attacker);
    
    // Set attacker as target
    if (attacker && this.health > 0) {
      this.targetEntity = attacker;
      this.state = 'follow';
      
      // When hit, prefer to retreat first
      this.movementPattern = 'retreat';
      this.patternTimer = 0;
    }
  }
  
  // Get drops when killed
  getDrops() {
    const drops = [];
    
    // Breeze rod - primary drop
    const rodCount = 1 + Math.floor(Math.random() * 2); // 1-2 breeze rods
    drops.push({
      type: 'breeze_rod',
      count: rodCount
    });
    
    // Small chance to drop a wind charge
    if (Math.random() < 0.2) { // 20% chance
      drops.push({
        type: 'wind_charge',
        count: 1
      });
    }
    
    return drops;
  }
  
  // This is a hostile mob
  isHostile() {
    return true;
  }
  
  // Serialize the Breeze's data for saving
  serialize() {
    return {
      ...super.serialize(),
      flyingMob: this.flyingMob,
      isCharging: this.isCharging,
      currentChargeTime: this.currentChargeTime,
      windChargeCooldown: this.windChargeCooldown,
      lastWindAttackTime: this.lastWindAttackTime,
      movementPattern: this.movementPattern,
      airState: this.airState
    };
  }
  
  // Deserialize data when loading a saved Breeze
  static deserialize(data) {
    const breeze = new Breeze(data.position);
    
    // Copy base properties from data
    breeze.id = data.id;
    breeze.health = data.health;
    breeze.maxHealth = data.maxHealth;
    breeze.rotation = data.rotation;
    breeze.dead = data.dead;
    breeze.state = data.state;
    
    // Copy Breeze-specific properties
    breeze.isCharging = data.isCharging || false;
    breeze.currentChargeTime = data.currentChargeTime || 0;
    breeze.windChargeCooldown = data.windChargeCooldown || 0;
    breeze.lastWindAttackTime = data.lastWindAttackTime || 0;
    breeze.movementPattern = data.movementPattern || 'circle';
    breeze.airState = data.airState || 'hover';
    
    return breeze;
  }
}

module.exports = Breeze; 