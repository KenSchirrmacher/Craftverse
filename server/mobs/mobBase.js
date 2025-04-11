// Base mob class for all mobs in the game
const { v4: uuidv4 } = require('uuid');

class MobBase {
  constructor(type, position, health, speed) {
    this.id = uuidv4();
    this.type = type;
    this.position = position || { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.health = health || 10;
    this.maxHealth = health || 10;
    this.speed = speed || 1;
    this.dead = false;
    this.despawnable = true;
    this.lastUpdate = Date.now();
    this.targetEntity = null;
    this.path = null;
    this.state = 'idle'; // idle, wander, follow, attack, flee
    this.spawnTime = Date.now();
    this.despawnTime = null; // When to despawn
    this.despawnDistance = 128; // Distance in blocks when mob should despawn
    this.tickCounter = 0;
    this.lastPathfindingTime = 0;
    this.wanderTarget = null;
    this.wanderTimeout = null;
    this.attacking = false;
    this.attackCooldown = 0;
    this.attackRange = 1.5;
    this.attackDamage = 1;
    this.aggroRange = 16;
    this.fleeHealth = 0; // Health threshold for fleeing (0 = never flee)
    this.persistent = false; // If true, will not despawn naturally
  }

  // Update the mob's state and actions
  update(world, players, mobs, deltaTime) {
    this.tickCounter++;
    
    // Don't process if dead
    if (this.dead) return;

    // Update cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    // Different AI behaviors based on mob type
    switch (this.state) {
      case 'idle':
        this.updateIdle(deltaTime);
        break;
      case 'wander':
        this.updateWander(world, deltaTime);
        break;
      case 'follow':
        this.updateFollow(world, deltaTime);
        break;
      case 'attack':
        this.updateAttack(world, players, mobs, deltaTime);
        break;
      case 'flee':
        this.updateFlee(world, deltaTime);
        break;
    }

    // Check for despawning conditions
    this.checkDespawn(players);
  }

  updateIdle(deltaTime) {
    // Random chance to start wandering
    if (Math.random() < 0.01) {
      this.state = 'wander';
      this.setRandomWanderTarget();
    }
  }

  updateWander(world, deltaTime) {
    // If we don't have a target, set one
    if (!this.wanderTarget) {
      this.setRandomWanderTarget();
      return;
    }

    // Move towards the wander target
    this.moveTowards(this.wanderTarget, deltaTime);

    // If we reached the target or it's taking too long, go back to idle
    const distanceToTarget = this.distanceTo(this.wanderTarget);
    if (distanceToTarget < 0.5 || (this.wanderTimeout && Date.now() > this.wanderTimeout)) {
      this.state = 'idle';
      this.wanderTarget = null;
      this.wanderTimeout = null;
    }
  }

  updateFollow(world, deltaTime) {
    // If no target, go back to idle
    if (!this.targetEntity) {
      this.state = 'idle';
      return;
    }

    // Move towards the target
    this.moveTowards(this.targetEntity.position, deltaTime);

    // If we're close enough, potentially attack
    const distanceToTarget = this.distanceTo(this.targetEntity.position);
    if (distanceToTarget <= this.attackRange && this.isHostile()) {
      this.state = 'attack';
    } else if (distanceToTarget > this.aggroRange) {
      // If target moved too far, stop following
      this.state = 'idle';
      this.targetEntity = null;
    }
  }

  updateAttack(world, players, mobs, deltaTime) {
    // If no target, go back to idle
    if (!this.targetEntity) {
      this.state = 'idle';
      return;
    }

    // Check if target still exists
    const targetExists = players[this.targetEntity.id] || mobs[this.targetEntity.id];
    if (!targetExists) {
      this.state = 'idle';
      this.targetEntity = null;
      return;
    }

    // Get distance to target
    const distanceToTarget = this.distanceTo(this.targetEntity.position);

    // If we're close enough, attack
    if (distanceToTarget <= this.attackRange) {
      if (this.attackCooldown <= 0) {
        this.attack(this.targetEntity);
        this.attackCooldown = 20; // 20 ticks (1 second) between attacks
      }
    } else if (distanceToTarget <= this.aggroRange) {
      // If target is within aggro range but not attack range, follow
      this.state = 'follow';
    } else {
      // If target moved too far, stop attacking
      this.state = 'idle';
      this.targetEntity = null;
    }

    // Check if we should flee based on health
    if (this.fleeHealth > 0 && this.health <= this.fleeHealth) {
      this.state = 'flee';
    }
  }

  updateFlee(world, deltaTime) {
    // If no threat, go back to idle
    if (!this.targetEntity) {
      this.state = 'idle';
      return;
    }

    // Move away from the threat
    this.fleeFrom(this.targetEntity.position, deltaTime);

    // If we've fled far enough, go back to idle
    const distanceToThreat = this.distanceTo(this.targetEntity.position);
    if (distanceToThreat > this.aggroRange * 1.5) {
      this.state = 'idle';
      this.targetEntity = null;
    }
  }

  // Basic pathfinding - move towards a target
  moveTowards(targetPos, deltaTime) {
    // Calculate direction vector
    const dirX = targetPos.x - this.position.x;
    const dirY = targetPos.y - this.position.y;
    const dirZ = targetPos.z - this.position.z;
    
    // Normalize the direction vector
    const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
    if (length === 0) return;
    
    const normX = dirX / length;
    const normY = dirY / length;
    const normZ = dirZ / length;
    
    // Move in the direction
    const moveSpeed = this.speed * deltaTime / 20; // Adjust speed for deltaTime
    this.position.x += normX * moveSpeed;
    this.position.y += normY * moveSpeed;
    this.position.z += normZ * moveSpeed;
    
    // Update rotation to face the direction of movement
    this.rotation.y = Math.atan2(dirX, dirZ);
  }

  // Flee in the opposite direction of a threat
  fleeFrom(threatPos, deltaTime) {
    // Calculate direction vector (away from threat)
    const dirX = this.position.x - threatPos.x;
    const dirY = this.position.y - threatPos.y;
    const dirZ = this.position.z - threatPos.z;
    
    // Normalize the direction vector
    const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
    if (length === 0) return;
    
    const normX = dirX / length;
    const normY = dirY / length;
    const normZ = dirZ / length;
    
    // Move in the direction (away from threat)
    const moveSpeed = this.speed * 1.5 * deltaTime / 20; // Faster when fleeing
    this.position.x += normX * moveSpeed;
    this.position.y += normY * moveSpeed;
    this.position.z += normZ * moveSpeed;
    
    // Update rotation to face away from the threat
    this.rotation.y = Math.atan2(-dirX, -dirZ);
  }

  // Set a random wander target
  setRandomWanderTarget() {
    const wanderRadius = 10;
    this.wanderTarget = {
      x: this.position.x + (Math.random() * 2 - 1) * wanderRadius,
      y: this.position.y,
      z: this.position.z + (Math.random() * 2 - 1) * wanderRadius
    };
    this.wanderTimeout = Date.now() + 10000; // Time out after 10 seconds
  }

  // Attack a target
  attack(target) {
    if (!target) return;
    
    // Deal damage
    target.health -= this.attackDamage;
    
    // Check for death
    if (target.health <= 0) {
      target.health = 0;
      target.dead = true;
      this.state = 'idle';
      this.targetEntity = null;
    }
    
    return {
      attackerId: this.id,
      targetId: target.id,
      damage: this.attackDamage
    };
  }

  // Take damage
  takeDamage(amount, attacker) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
      return true; // Died
    }
    
    // Respond to damage
    if (this.isNeutral() || this.isHostile()) {
      // Target the attacker
      this.targetEntity = attacker;
      this.state = 'attack';
    } else if (this.isPassive()) {
      // Flee from the attacker
      this.targetEntity = attacker;
      this.state = 'flee';
    }
    
    return false; // Survived
  }

  // Calculate distance to another position
  distanceTo(pos) {
    const dx = this.position.x - pos.x;
    const dy = this.position.y - pos.y;
    const dz = this.position.z - pos.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // Check if should despawn
  checkDespawn(players) {
    if (!this.despawnable || this.persistent) return false;
    
    // Check if any player is within despawn distance
    let shouldDespawn = true;
    for (const playerId in players) {
      const player = players[playerId];
      const distance = this.distanceTo(player.position);
      if (distance < this.despawnDistance) {
        shouldDespawn = false;
        break;
      }
    }
    
    if (shouldDespawn) {
      this.despawnTime = Date.now();
      return true;
    }
    
    return false;
  }

  // Mob classification methods
  isPassive() {
    return false; // Override in subclasses
  }

  isNeutral() {
    return false; // Override in subclasses
  }

  isHostile() {
    return false; // Override in subclasses
  }

  // Prepare mob data for sending to clients
  serialize() {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      rotation: this.rotation,
      health: this.health,
      maxHealth: this.maxHealth,
      state: this.state,
      dead: this.dead
    };
  }
}

module.exports = MobBase; 