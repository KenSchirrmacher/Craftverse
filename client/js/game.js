import PotionEffectsUI from './ui/potionEffects';
import BrewingStandUI from './ui/brewingStandUI';

class Game {
  constructor() {
    // Initialize potion effects UI
    this.potionEffectsUI = new PotionEffectsUI(this);
    
    // Initialize brewing stand UI
    this.brewingStandUI = new BrewingStandUI(this);
  }
  
  /**
   * Set up event handlers
   */
  setupEvents() {
    // Add potion and brewing related events
    this.socket.on('player_effects_update', (data) => {
      // Update player effects
      if (this.player && data.entityId === this.player.id) {
        this.player.statusEffects = data.effects || [];
        this.potionEffectsUI.updateEffects(this.player.statusEffects);
      }
    });
    
    this.socket.on('brewing_stand_placed', (data) => {
      // Handle new brewing stand placed in the world
      // Could add visual indicator or sound effect
      console.log('Brewing stand placed at', data.position);
    });
    
    this.socket.on('brewing_stand_interact', (data) => {
      // Open brewing stand UI
      if (this.brewingStandUI) {
        this.brewingStandUI.open(data.id, data.data);
      }
    });
    
    this.socket.on('potion_splash', (data) => {
      // Create splash effect particle system
      this.createPotionSplashEffect(data.position, data.color, data.range);
    });
  }
  
  /**
   * Create particle effect for potion splash
   * @param {Object} position - Splash position
   * @param {string} color - Potion color
   * @param {number} range - Effect range
   */
  createPotionSplashEffect(position, color, range) {
    if (!this.scene) return;
    
    // Create a particle system for the potion splash
    const particleCount = 30;
    const particles = new THREE.Group();
    
    // Create particle geometry
    const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color || '#0000FF'),
      transparent: true,
      opacity: 0.7
    });
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
      // Random position within range
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * range;
      particle.position.set(
        position.x + Math.cos(angle) * radius,
        position.y + Math.random() * 0.5,
        position.z + Math.sin(angle) * radius
      );
      
      // Add velocity for animation
      particle.userData.velocity = {
        x: (Math.random() - 0.5) * 0.05,
        y: Math.random() * 0.1,
        z: (Math.random() - 0.5) * 0.05
      };
      
      // Add to group
      particles.add(particle);
    }
    
    // Add to scene
    this.scene.add(particles);
    
    // Create animation
    const animate = () => {
      // Update each particle
      for (let i = 0; i < particles.children.length; i++) {
        const particle = particles.children[i];
        
        // Move particle
        particle.position.x += particle.userData.velocity.x;
        particle.position.y += particle.userData.velocity.y;
        particle.position.z += particle.userData.velocity.z;
        
        // Apply gravity
        particle.userData.velocity.y -= 0.002;
        
        // Fade out
        if (particle.material.opacity > 0) {
          particle.material.opacity -= 0.01;
        }
      }
      
      // Continue animation if particles still visible
      if (particles.children.length > 0 && particles.children[0].material.opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        // Remove from scene when done
        this.scene.remove(particles);
        
        // Dispose of geometries and materials
        particles.children.forEach(particle => {
          particle.geometry.dispose();
          particle.material.dispose();
        });
      }
    };
    
    // Start animation
    requestAnimationFrame(animate);
  }
  
  /**
   * Handle item usage
   * @param {Object} item - Item to use
   * @returns {boolean} Whether item was used
   */
  useItem(item) {
    // Handle using potion items
    if (item.id.startsWith('potion_')) {
      // Emit event to server
      this.socket.emit('use_item', {
        itemId: item.id,
        useContext: {
          type: 'RIGHT_CLICK',
          position: this.player.position
        }
      });
      
      return true;
    }
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    // Clean up UI components
    if (this.potionEffectsUI) {
      this.potionEffectsUI.cleanup();
    }
    
    if (this.brewingStandUI) {
      this.brewingStandUI.cleanup();
    }
  }
} 