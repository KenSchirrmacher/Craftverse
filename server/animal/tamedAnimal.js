/**
 * Base class for all tameable animals with enhanced functionality
 * Part of the Minecraft 1.23 Update - Tamed Animal Improvements
 */
class TamedAnimal {
  /**
   * Apply tamed animal enhancements to a mob
   * @param {Object} mob - The mob to enhance
   * @returns {Object} - The enhanced mob
   */
  static enhance(mob) {
    if (!mob) return null;
    
    // Skip if already enhanced
    if (mob._tamedEnhanced) return mob;
    
    // Store original methods for chaining
    const originalUpdate = mob.update;
    const originalSerialize = mob.serialize;
    const originalTakeDamage = mob.takeDamage;
    
    // Mark as enhanced
    mob._tamedEnhanced = true;
    
    // Add enhanced properties
    mob.stayPosition = null;
    mob.guardPosition = null;
    mob.guardRadius = 0;
    mob.patrolPoints = [];
    mob.currentPatrolPoint = 0;
    mob.trackTarget = null;
    mob.fetchTarget = null;
    mob.trainingSessions = 0;
    mob.customBehaviors = [];
    mob.alertOwner = false;
    mob.lastAlertTime = 0;
    
    // Enhanced state flags
    mob.staying = false;
    mob.guarding = false;
    mob.patrolling = false;
    mob.tracking = false;
    mob.fetching = false;
    
    // Enhanced mode objects for behavior handling
    mob.stayMode = { active: false };
    mob.guardMode = { active: false };
    mob.patrolMode = { active: false };
    mob.trackMode = { active: false };
    mob.fetchMode = { active: false };
    
    // Enhance update method with new behaviors
    mob.update = function(world, players, mobs, deltaTime) {
      // Process advanced tamed animal behaviors
      if (this.tamed && !this.sitting) {
        if (this.processEnhancedBehaviors(world, players, mobs, deltaTime)) {
          return; // Skip normal update if enhanced behavior handled it
        }
      }
      
      // Call original update method
      return originalUpdate.call(this, world, players, mobs, deltaTime);
    };
    
    // Add method to process enhanced behaviors
    mob.processEnhancedBehaviors = function(world, players, mobs, deltaTime) {
      // Skip if untamed or sitting
      if (!this.tamed || this.sitting) return false;
      
      // Handle stay behavior
      if (this.stayMode && this.stayMode.active) {
        return this.processStayBehavior(world, players, mobs, deltaTime);
      }
      
      // Handle guard behavior
      if (this.guardMode && this.guardMode.active) {
        return this.processGuardBehavior(world, players, mobs, deltaTime);
      }
      
      // Handle patrol behavior
      if (this.patrolMode && this.patrolMode.active) {
        return this.processPatrolBehavior(world, players, mobs, deltaTime);
      }
      
      // Handle track behavior
      if (this.trackMode && this.trackMode.active) {
        return this.processTrackBehavior(world, players, mobs, deltaTime);
      }
      
      // Handle fetch behavior
      if (this.fetchMode && this.fetchMode.active) {
        return this.processFetchBehavior(world, players, mobs, deltaTime);
      }
      
      return false; // No enhanced behavior processed
    };
    
    // Stay behavior implementation
    mob.processStayBehavior = function(world, players, mobs, deltaTime) {
      // Check if owner is nearby
      const ownerId = this.owner;
      const owner = players[ownerId];
      
      if (!owner) return true; // Stay put if owner not found
      
      // Get distance from stay position
      const currentPos = this.position;
      const stayPos = this.stayMode.position;
      
      const dx = currentPos.x - stayPos.x;
      const dy = currentPos.y - stayPos.y;
      const dz = currentPos.z - stayPos.z;
      const distanceFromStay = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // If too far from stay position, return to it
      if (distanceFromStay > this.stayMode.radius) {
        this.state = 'follow';
        this.targetPosition = { ...stayPos };
        
        // Move towards stay position
        const dirX = stayPos.x - currentPos.x;
        const dirY = stayPos.y - currentPos.y;
        const dirZ = stayPos.z - currentPos.z;
        
        // Normalize and scale by speed
        const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
        if (len > 0) {
          const moveSpeed = this.speed * deltaTime / 20;
          this.position.x += (dirX / len) * moveSpeed;
          this.position.y += (dirY / len) * moveSpeed;
          this.position.z += (dirZ / len) * moveSpeed;
        }
        
        return true;
      }
      
      // Stay in idle state
      this.state = 'idle';
      return true;
    };
    
    // Guard behavior implementation
    mob.processGuardBehavior = function(world, players, mobs, deltaTime) {
      const guardPos = this.guardMode.position;
      const guardRadius = this.guardMode.radius;
      const targetType = this.guardMode.target;
      
      // Check if there are potential threats within guard radius
      let potentialTarget = null;
      let closestDistance = guardRadius;
      
      // Check mobs for threats
      for (const mobId in mobs) {
        const otherMob = mobs[mobId];
        
        // Skip self and non-threatening mobs
        if (otherMob.id === this.id || otherMob.dead) continue;
        
        // Only target hostile mobs or specified types
        if (targetType === 'hostile' && !otherMob.isHostile()) continue;
        if (targetType !== 'all' && targetType !== 'hostile' && otherMob.type !== targetType) continue;
        
        // Calculate distance from guard position to mob
        const dx = guardPos.x - otherMob.position.x;
        const dy = guardPos.y - otherMob.position.y;
        const dz = guardPos.z - otherMob.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // If within guard radius and closer than current target
        if (distance < closestDistance) {
          closestDistance = distance;
          potentialTarget = otherMob;
        }
      }
      
      // If found a threat, attack it
      if (potentialTarget) {
        this.state = 'attack';
        this.targetEntity = potentialTarget;
        
        // Alert owner if not recently alerted
        const currentTime = Date.now();
        if (this.alertOwner && currentTime - this.lastAlertTime > 10000) {
          const owner = players[this.owner];
          if (owner) {
            // Send alert message to owner
            if (global.messageManager) {
              global.messageManager.sendToPlayer(this.owner, {
                type: 'pet_alert',
                petId: this.id,
                petType: this.type,
                alertType: 'guard',
                targetType: potentialTarget.type,
                position: this.position
              });
            }
            this.lastAlertTime = currentTime;
          }
        }
        
        return true;
      }
      
      // If no threat and not at guard position, return to it
      const dx = this.position.x - guardPos.x;
      const dy = this.position.y - guardPos.y;
      const dz = this.position.z - guardPos.z;
      const distanceFromGuard = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (distanceFromGuard > 3) {
        this.state = 'follow';
        this.targetPosition = { ...guardPos };
        
        // Move towards guard position
        const moveSpeed = this.speed * deltaTime / 20;
        this.position.x -= (dx / distanceFromGuard) * moveSpeed;
        this.position.y -= (dy / distanceFromGuard) * moveSpeed;
        this.position.z -= (dz / distanceFromGuard) * moveSpeed;
        
        return true;
      }
      
      // No threat and at guard position, stay idle
      this.state = 'idle';
      return true;
    };
    
    // Patrol behavior implementation
    mob.processPatrolBehavior = function(world, players, mobs, deltaTime) {
      // Skip if no patrol points
      if (!this.patrolMode.points || this.patrolMode.points.length === 0) {
        this.patrolMode.active = false;
        return false;
      }
      
      // Get current patrol point
      const currentPointIndex = this.patrolMode.currentPoint;
      const currentPoint = this.patrolMode.points[currentPointIndex];
      
      // Calculate distance to current patrol point
      const dx = this.position.x - currentPoint.x;
      const dy = this.position.y - currentPoint.y;
      const dz = this.position.z - currentPoint.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // Check if reached current point
      if (distance < 1.5) {
        // If pausing at points
        if (this.patrolMode.pauseAtPoints && !this.patrolMode.pausing) {
          this.patrolMode.pausing = true;
          this.patrolMode.pauseUntil = Date.now() + this.patrolMode.pauseDuration;
          this.state = 'idle';
          return true;
        }
        
        // If still pausing, wait
        if (this.patrolMode.pausing) {
          if (Date.now() < this.patrolMode.pauseUntil) {
            this.state = 'idle';
            return true;
          } else {
            this.patrolMode.pausing = false;
          }
        }
        
        // Move to next point
        if (this.patrolMode.direction === 1) {
          this.patrolMode.currentPoint++;
          if (this.patrolMode.currentPoint >= this.patrolMode.points.length) {
            // Reached end, reverse direction or loop
            if (this.patrolMode.points.length <= 1) {
              this.patrolMode.currentPoint = 0; // Single point, keep revisiting
            } else {
              this.patrolMode.currentPoint = this.patrolMode.points.length - 2;
              this.patrolMode.direction = -1;
            }
          }
        } else {
          this.patrolMode.currentPoint--;
          if (this.patrolMode.currentPoint < 0) {
            // Reached beginning, reverse direction
            this.patrolMode.currentPoint = 1;
            this.patrolMode.direction = 1;
          }
        }
      }
      
      // Move towards current patrol point
      const targetPoint = this.patrolMode.points[this.patrolMode.currentPoint];
      this.state = 'follow';
      this.targetPosition = { ...targetPoint };
      
      // Move towards target point
      const dirX = targetPoint.x - this.position.x;
      const dirY = targetPoint.y - this.position.y;
      const dirZ = targetPoint.z - this.position.z;
      
      // Normalize and scale by speed
      const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
      if (len > 0) {
        const moveSpeed = this.speed * deltaTime / 20;
        this.position.x += (dirX / len) * moveSpeed;
        this.position.y += (dirY / len) * moveSpeed;
        this.position.z += (dirZ / len) * moveSpeed;
      }
      
      return true;
    };
    
    // Track behavior implementation
    mob.processTrackBehavior = function(world, players, mobs, deltaTime) {
      // Skip if recently tracked (cooldown)
      if (this.trackMode.trackCooldown > 0) {
        this.trackMode.trackCooldown -= deltaTime;
        return false;
      }
      
      const targetType = this.trackMode.target;
      const searchRadius = this.trackMode.searchRadius;
      
      // Find the nearest matching mob
      let nearestTarget = null;
      let nearestDistance = searchRadius;
      
      for (const mobId in mobs) {
        const otherMob = mobs[mobId];
        
        // Skip self and dead mobs
        if (otherMob.id === this.id || otherMob.dead) continue;
        
        // Check if mob matches target type
        let isMatch = false;
        if (targetType === 'hostile' && otherMob.isHostile()) {
          isMatch = true;
        } else if (targetType === 'passive' && otherMob.isPassive()) {
          isMatch = true;
        } else if (otherMob.type === targetType) {
          isMatch = true;
        }
        
        if (!isMatch) continue;
        
        // Calculate distance
        const dx = this.position.x - otherMob.position.x;
        const dy = this.position.y - otherMob.position.y;
        const dz = this.position.z - otherMob.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestTarget = otherMob;
        }
      }
      
      // If found a target, track it
      if (nearestTarget) {
        // Set state to follow
        this.state = 'follow';
        this.targetEntity = nearestTarget;
        
        // Alert owner if configured
        if (this.trackMode.alert) {
          const owner = players[this.owner];
          if (owner) {
            // Send alert message to owner
            if (global.messageManager) {
              global.messageManager.sendToPlayer(this.owner, {
                type: 'pet_alert',
                petId: this.id,
                petType: this.type,
                alertType: 'track',
                targetType: nearestTarget.type,
                position: nearestTarget.position
              });
            }
          }
        }
        
        // Set cooldown
        this.trackMode.trackCooldown = 100;
        return true;
      }
      
      // No target found, continue wandering
      if (this.state !== 'wander') {
        this.state = 'wander';
        this.setRandomWanderTarget();
      }
      
      return false;
    };
    
    // Fetch behavior implementation
    mob.processFetchBehavior = function(world, players, mobs, deltaTime) {
      // Check if we're holding an item
      if (this.fetchMode.heldItem) {
        // Return to owner
        const ownerId = this.owner;
        const owner = players[ownerId];
        
        if (!owner) {
          // Owner not found, drop item
          this.fetchMode.heldItem = null;
          this.fetchMode.active = false;
          return false;
        }
        
        // Calculate distance to owner
        const dx = this.position.x - owner.position.x;
        const dy = this.position.y - owner.position.y;
        const dz = this.position.z - owner.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // If close to owner, give item
        if (distance < 2) {
          // Add item to owner's inventory
          if (owner.inventory && owner.inventory.addItem) {
            owner.inventory.addItem(this.fetchMode.heldItem);
          }
          
          // Clear fetch state
          this.fetchMode.heldItem = null;
          this.state = 'idle';
          
          // Alert owner
          if (global.messageManager) {
            global.messageManager.sendToPlayer(ownerId, {
              type: 'pet_alert',
              petId: this.id,
              petType: this.type,
              alertType: 'fetch_complete',
              itemType: this.fetchMode.heldItem.type
            });
          }
          
          return true;
        }
        
        // Move towards owner
        this.state = 'follow';
        this.targetEntity = owner;
        return true;
      }
      
      // Look for items to fetch
      // This would normally check the world's dropped items
      // For this implementation, we'll simulate finding an item
      if (!this.fetchMode.searchingTime) {
        this.fetchMode.searchingTime = Date.now() + 5000; // Search for 5 seconds
      }
      
      // If we've been searching too long, give up
      if (Date.now() > this.fetchMode.searchingTime) {
        this.fetchMode.active = false;
        this.state = 'idle';
        return false;
      }
      
      // Simulate wandering to find items
      if (this.state !== 'wander') {
        this.state = 'wander';
        this.setRandomWanderTarget();
      }
      
      return true;
    };
    
    // Enhance the mob's serialize method to include new properties
    mob.serialize = function() {
      const baseData = originalSerialize.call(this);
      
      // Add enhanced properties for persistence
      return {
        ...baseData,
        _tamedEnhanced: true,
        staying: this.staying,
        guarding: this.guarding,
        patrolling: this.patrolling,
        tracking: this.tracking,
        fetching: this.fetching,
        stayPosition: this.stayPosition,
        guardPosition: this.guardPosition,
        guardRadius: this.guardRadius,
        patrolPoints: this.patrolPoints,
        trackTarget: this.trackTarget,
        trainingSessions: this.trainingSessions,
        customBehaviors: this.customBehaviors,
        stayMode: this.stayMode,
        guardMode: this.guardMode,
        patrolMode: this.patrolMode,
        trackMode: this.trackMode,
        fetchMode: this.fetchMode
      };
    };
    
    // Enhance the mob's takeDamage method to respond to damage differently
    mob.takeDamage = function(amount, attacker) {
      // If guarding, respond more aggressively to attacks
      if (this.guarding && this.guardMode && this.guardMode.active) {
        this.state = 'attack';
        this.targetEntity = attacker;
        
        // Alert owner
        if (this.alertOwner) {
          const owner = global.playerManager ? global.playerManager.getPlayer(this.owner) : null;
          if (owner && global.messageManager) {
            global.messageManager.sendToPlayer(this.owner, {
              type: 'pet_alert',
              petId: this.id,
              petType: this.type,
              alertType: 'attacked',
              attackerType: attacker ? attacker.type : 'unknown',
              position: this.position
            });
          }
        }
        
        // Call original takeDamage with reduced damage for guarding pets
        return originalTakeDamage.call(this, Math.max(1, amount * 0.8), attacker);
      }
      
      // Default damage handling
      return originalTakeDamage.call(this, amount, attacker);
    };
    
    // Add helper methods to manage behavior modes
    
    // Cancel all enhanced behaviors
    mob.cancelAllBehaviors = function() {
      this.staying = false;
      this.guarding = false;
      this.patrolling = false;
      this.tracking = false;
      this.fetching = false;
      
      this.stayMode.active = false;
      this.guardMode.active = false;
      this.patrolMode.active = false;
      this.trackMode.active = false;
      this.fetchMode.active = false;
      
      this.state = 'idle';
    };
    
    // Return enhanced mob
    return mob;
  }
  
  /**
   * Apply tamed animal improvements to a specific animal type
   * @param {Constructor} MobClass - The mob class to enhance
   * @returns {Constructor} - Enhanced mob class
   */
  static enhanceMobClass(MobClass) {
    const originalCreate = MobClass.create || ((position) => new MobClass(position));
    
    // Override the create method
    MobClass.create = function(position, options = {}) {
      // Create the base mob
      const mob = originalCreate(position, options);
      
      // Apply tamed enhancements
      return TamedAnimal.enhance(mob);
    };
    
    return MobClass;
  }
}

module.exports = TamedAnimal; 