const Entity = require('./entity');
const { Vector3 } = require('../math/vector3');

class WindChargeEntity extends Entity {
  constructor(world, position) {
    super(world, position);
    this.hasExploded = false;
    this.chainReactionRadius = 3; // Maximum distance for chain reactions
    this.position = new Vector3(position.x, position.y, position.z);
  }

  explode() {
    if (this.hasExploded) return;
    
    this.hasExploded = true;
    this.createVisualEffect();
    this.createAudioEffect();
    
    // Find nearby wind charges for chain reaction
    const nearbyEntities = this.world.getEntitiesInRadius(
      this.position,
      this.chainReactionRadius
    );

    // Filter for wind charges and check line of sight
    const nearbyWindCharges = nearbyEntities.filter(entity => {
      if (!(entity instanceof WindChargeEntity)) return false;
      if (entity.hasExploded) return false;
      
      // Check if there's a clear line of sight
      return this.hasLineOfSight(entity);
    });

    // Trigger chain reaction
    nearbyWindCharges.forEach(charge => {
      charge.explode();
    });
  }

  hasLineOfSight(target) {
    const direction = new Vector3(
      target.position.x - this.position.x,
      target.position.y - this.position.y,
      target.position.z - this.position.z
    ).normalize();

    const distance = this.position.distanceTo(target.position);
    const stepSize = 0.5; // Check every half block
    const steps = Math.ceil(distance / stepSize);

    for (let i = 0; i < steps; i++) {
      const checkPos = new Vector3(
        this.position.x + direction.x * i * stepSize,
        this.position.y + direction.y * i * stepSize,
        this.position.z + direction.z * i * stepSize
      );

      const block = this.world.getBlock(
        Math.floor(checkPos.x),
        Math.floor(checkPos.y),
        Math.floor(checkPos.z)
      );

      if (block && block.solid) {
        return false;
      }
    }

    return true;
  }

  createVisualEffect() {
    // Create particle effects for the explosion
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 1;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      this.world.addParticleEffect({
        type: 'wind_charge',
        position: {
          x: this.position.x + x,
          y: this.position.y,
          z: this.position.z + z
        },
        velocity: {
          x: x * 0.2,
          y: 0.1,
          z: z * 0.2
        },
        lifetime: 20
      });
    }
  }

  createAudioEffect() {
    // Play explosion sound
    this.world.playSound({
      type: 'wind_charge_explosion',
      position: this.position,
      volume: 1.0,
      pitch: 1.0
    });
  }
}

module.exports = { WindChargeEntity }; 