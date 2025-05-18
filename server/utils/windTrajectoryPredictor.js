/**
 * WindTrajectoryPredictor - Utility class for predicting Wind Charge trajectories
 * Used to show the player where their Wind Charge will land when thrown
 * Part of the Minecraft 1.24 Update (Trail Tales)
 */

const Vector3 = require('../math/vector3');

class WindTrajectoryPredictor {
  /**
   * Create a new trajectory predictor
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Default values for trajectory prediction
    this.maxSteps = options.maxSteps || 100; // Maximum simulation steps
    this.stepSize = options.stepSize || 0.25; // Time step size in ticks
    this.gravity = options.gravity || 0.03; // Gravity per tick
    this.drag = options.drag || 0.01; // Air resistance per tick
    this.obstacleDetection = options.obstacleDetection !== false; // Whether to check for obstacles
    
    // Charge level affects prediction detail and accuracy
    this.chargeLevel = options.chargeLevel || 0;
    this.chargeLevels = options.chargeLevels || [
      { name: 'weak', predictionSteps: 30, accuracyFactor: 0.8 },
      { name: 'medium', predictionSteps: 60, accuracyFactor: 0.9 },
      { name: 'strong', predictionSteps: 100, accuracyFactor: 1.0 }
    ];
  }
  
  /**
   * Predict the trajectory of a wind charge
   * @param {Object} startPosition - Starting position
   * @param {Object} direction - Normalized direction vector
   * @param {number} velocity - Initial velocity
   * @param {Object} world - World object for obstacle detection
   * @param {number} chargeLevel - Current charge level (0-2)
   * @returns {Array} Array of position points along the trajectory
   */
  predictTrajectory(startPosition, direction, velocity, world, chargeLevel = 0) {
    // Use provided charge level or instance default
    const currentChargeLevel = chargeLevel !== undefined ? chargeLevel : this.chargeLevel;
    
    // Get charge level properties
    const chargeLevelData = this.chargeLevels[currentChargeLevel];
    
    // Calculate number of steps based on charge level
    const steps = Math.min(
      this.maxSteps,
      chargeLevelData.predictionSteps || this.maxSteps
    );
    
    // Calculate prediction accuracy - affects how strictly physics is followed
    const accuracyFactor = chargeLevelData.accuracyFactor || 1.0;
    
    // Initialize trajectory points array with starting position
    const trajectoryPoints = [{ ...startPosition }];
    
    // Create vectors for simulation
    const position = new Vector3(startPosition.x, startPosition.y, startPosition.z);
    
    // Calculate initial velocity vector
    const initialVelocity = new Vector3(
      direction.x * velocity,
      direction.y * velocity,
      direction.z * velocity
    );
    
    // Current velocity vector (will change during simulation)
    const currentVelocity = initialVelocity.clone();
    
    // Simulate trajectory
    for (let step = 1; step < steps; step++) {
      // Apply gravity (adjusted by accuracy factor)
      currentVelocity.y -= this.gravity * this.stepSize * accuracyFactor;
      
      // Apply drag (air resistance)
      currentVelocity.x *= (1 - this.drag * this.stepSize * accuracyFactor);
      currentVelocity.y *= (1 - this.drag * this.stepSize * accuracyFactor);
      currentVelocity.z *= (1 - this.drag * this.stepSize * accuracyFactor);
      
      // Calculate next position based on velocity
      const nextX = position.x + currentVelocity.x * this.stepSize;
      const nextY = position.y + currentVelocity.y * this.stepSize;
      const nextZ = position.z + currentVelocity.z * this.stepSize;
      
      // Check for obstacles along the path
      let hitObstacle = false;
      
      if (world && this.obstacleDetection) {
        // Check all block positions between current and next position
        // For simplicity, we'll check the current block and the next block
        const currentBlockX = Math.floor(position.x);
        const currentBlockY = Math.floor(position.y);
        const currentBlockZ = Math.floor(position.z);
        
        const nextBlockX = Math.floor(nextX);
        const nextBlockY = Math.floor(nextY);
        const nextBlockZ = Math.floor(nextZ);
        
        // Check if we're crossing block boundaries
        if (currentBlockX !== nextBlockX || 
            currentBlockY !== nextBlockY || 
            currentBlockZ !== nextBlockZ) {
          
          try {
            // Check if the next block is solid
            const block = world.getBlock(nextBlockX, nextBlockY, nextBlockZ);
            if (block && block.isSolid) {
              hitObstacle = true;
              
              // Add a point at the block boundary for more accurate visual representation
              // This is a simplified approach; a proper ray-block intersection would be more accurate
              const t = Math.min(1.0, ((nextBlockX - 0.1) - position.x) / (nextX - position.x));
              const hitX = position.x + t * (nextX - position.x);
              const hitY = position.y + t * (nextY - position.y);
              const hitZ = position.z + t * (nextZ - position.z);
              
              trajectoryPoints.push({
                x: hitX,
                y: hitY,
                z: hitZ
              });
            }
          } catch (error) {
            // Ignore errors from invalid block positions
          }
        }
      }
      
      // If we hit an obstacle, stop the trajectory
      if (hitObstacle) {
        break;
      }
      
      // Update position based on velocity
      position.x = nextX;
      position.y = nextY;
      position.z = nextZ;
      
      // Add point to trajectory
      trajectoryPoints.push({
        x: position.x,
        y: position.y,
        z: position.z
      });
    }
    
    return trajectoryPoints;
  }
  
  /**
   * Predict the landing position of a wind charge
   * @param {Object} startPosition - Starting position
   * @param {Object} direction - Normalized direction vector
   * @param {number} velocity - Initial velocity
   * @param {Object} world - World object for obstacle detection
   * @param {number} chargeLevel - Current charge level (0-2)
   * @returns {Object|null} Landing position or null if no landing point found
   */
  predictLandingPosition(startPosition, direction, velocity, world, chargeLevel = 0) {
    const trajectory = this.predictTrajectory(
      startPosition, direction, velocity, world, chargeLevel
    );
    
    // The last point in the trajectory is our best guess for landing position
    return trajectory.length > 0 ? trajectory[trajectory.length - 1] : null;
  }
  
  /**
   * Get the trajectory data suitable for client rendering
   * @param {Array} trajectoryPoints - Array of trajectory points
   * @param {number} chargeLevel - Current charge level (0-2)
   * @returns {Object} Trajectory rendering data
   */
  getTrajectoryRenderData(trajectoryPoints, chargeLevel = 0) {
    // Calculate particle properties based on charge level
    const particleColors = ['#a0e6ff', '#80d0ff', '#60b8ff']; // Colors for weak, medium, strong
    const particleSizes = [0.2, 0.3, 0.4]; // Sizes for weak, medium, strong
    const particleFrequency = [3, 2, 1]; // Points to skip between particles (less means more particles)
    
    const color = particleColors[Math.min(chargeLevel, particleColors.length - 1)];
    const size = particleSizes[Math.min(chargeLevel, particleSizes.length - 1)];
    const frequency = particleFrequency[Math.min(chargeLevel, particleFrequency.length - 1)];
    
    // Build render data
    const renderPoints = [];
    for (let i = 0; i < trajectoryPoints.length; i += frequency) {
      renderPoints.push({
        position: trajectoryPoints[i],
        size: size * (1 - i / trajectoryPoints.length * 0.5), // Particles get smaller toward the end
        color: color,
        alpha: 1 - (i / trajectoryPoints.length * 0.8) // Particles fade out toward the end
      });
    }
    
    return {
      type: 'wind_charge_trajectory',
      points: renderPoints,
      landingPosition: trajectoryPoints[trajectoryPoints.length - 1],
      chargeLevel: chargeLevel
    };
  }
}

module.exports = WindTrajectoryPredictor; 