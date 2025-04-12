/**
 * ThrownPotion - Client-side entity for thrown potion projectiles
 */
import * as THREE from 'three';
import { Entity } from './entity.js';

class ThrownPotion extends Entity {
  /**
   * Create a thrown potion entity
   * @param {Object} data - Entity data from server
   * @param {Object} game - Game instance
   */
  constructor(data, game) {
    super(data, game);
    
    // Store potion specific data
    this.potionType = data.potionType || 'WATER';
    this.color = data.color || '#0000FF';
    this.isSplash = data.isSplash || false;
    this.isLingering = data.isLingering || false;
    
    // Create 3D model
    this.createModel();
    
    // Create particle system for trail
    this.createParticleTrail();
    
    // Track if potion has broken
    this.hasBroken = false;
    
    // Bind methods
    this.onBreak = this.onBreak.bind(this);
  }
  
  /**
   * Create the 3D model for the potion
   */
  createModel() {
    // Create bottle geometry
    const bottleGeometry = new THREE.Group();
    
    // Base of the bottle
    const baseGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.1, 8);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xDDDDDD,
      transparent: true,
      opacity: 0.7,
      roughness: 0.2,
      metalness: 0.3
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.15;
    bottleGeometry.add(base);
    
    // Middle part of the bottle
    const middleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8);
    const middleMaterial = new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(this.color),
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.1
    });
    const middle = new THREE.Mesh(middleGeometry, middleMaterial);
    bottleGeometry.add(middle);
    
    // Neck of the bottle
    const neckGeometry = new THREE.CylinderGeometry(0.03, 0.1, 0.1, 8);
    const neckMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xDDDDDD,
      transparent: true,
      opacity: 0.8,
      roughness: 0.2,
      metalness: 0.2
    });
    const neck = new THREE.Mesh(neckGeometry, neckMaterial);
    neck.position.y = 0.15;
    bottleGeometry.add(neck);
    
    // Cork
    const corkGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.03, 8);
    const corkMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513, 
      roughness: 0.8 
    });
    const cork = new THREE.Mesh(corkGeometry, corkMaterial);
    cork.position.y = 0.215;
    bottleGeometry.add(cork);
    
    // Set the bottle rotation to be horizontal
    bottleGeometry.rotation.x = Math.PI * 0.5;
    
    // Create the model and add it to the scene
    this.model = bottleGeometry;
    this.model.castShadow = true;
    
    // Update scale
    this.model.scale.set(0.7, 0.7, 0.7);
    
    // Add to game
    if (this.game && this.game.scene) {
      this.game.scene.add(this.model);
    }
  }
  
  /**
   * Create particle trail for the potion
   */
  createParticleTrail() {
    // Create particle group
    this.particles = new THREE.Group();
    
    // Particle materials
    this.particleMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.color),
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    
    // Add particles group to scene
    if (this.game && this.game.scene) {
      this.game.scene.add(this.particles);
    }
    
    // Set up last particle time
    this.lastParticleTime = 0;
  }
  
  /**
   * Handle entity updates from server
   * @param {Object} data - Update data
   */
  update(data) {
    super.update(data);
    
    // Update potion specific properties if provided
    if (data.potionType) this.potionType = data.potionType;
    if (data.color) {
      this.color = data.color;
      this.updateColor();
    }
    
    // Check if potion has broken
    if (data.hasBroken && !this.hasBroken) {
      this.onBreak();
    }
  }
  
  /**
   * Update color of potion liquid
   */
  updateColor() {
    if (!this.model) return;
    
    // Find the middle part (potion liquid)
    const middle = this.model.children[1];
    if (middle && middle.material) {
      middle.material.color = new THREE.Color(this.color);
      middle.material.needsUpdate = true;
    }
    
    // Update particle color
    if (this.particleMaterial) {
      this.particleMaterial.color = new THREE.Color(this.color);
      this.particleMaterial.needsUpdate = true;
    }
  }
  
  /**
   * Spawn a particle in the trail
   */
  spawnParticle() {
    // Limit particle spawn rate
    const now = performance.now();
    if (now - this.lastParticleTime < 100) return;
    this.lastParticleTime = now;
    
    // Create particle geometry
    const particleGeometry = new THREE.PlaneGeometry(0.1, 0.1);
    const particle = new THREE.Mesh(particleGeometry, this.particleMaterial);
    
    // Position at current potion position with slight random offset
    particle.position.set(
      this.position.x + (Math.random() - 0.5) * 0.05,
      this.position.y + (Math.random() - 0.5) * 0.05,
      this.position.z + (Math.random() - 0.5) * 0.05
    );
    
    // Random rotation to face camera from different angles
    particle.rotation.x = Math.random() * Math.PI * 2;
    particle.rotation.y = Math.random() * Math.PI * 2;
    particle.rotation.z = Math.random() * Math.PI * 2;
    
    // Add to particles group
    this.particles.add(particle);
    
    // Set up particle fade out and removal
    particle.life = 0;
    particle.maxLife = 20;
    particle.update = dt => {
      particle.life += dt;
      particle.material.opacity = 0.6 * (1 - (particle.life / particle.maxLife));
      
      if (particle.life >= particle.maxLife) {
        this.particles.remove(particle);
        particle.geometry.dispose();
      }
    };
  }
  
  /**
   * Handle potion breaking
   */
  onBreak() {
    if (this.hasBroken) return;
    this.hasBroken = true;
    
    // Create splash effect
    this.createSplashEffect();
    
    // Play sound
    this.playBreakSound();
    
    // Remove the model
    if (this.model && this.model.parent) {
      this.model.parent.remove(this.model);
    }
    
    // Schedule particle removal
    setTimeout(() => {
      if (this.particles && this.particles.parent) {
        this.particles.parent.remove(this.particles);
        
        // Dispose of child geometries and materials
        for (let i = this.particles.children.length - 1; i >= 0; i--) {
          const particle = this.particles.children[i];
          if (particle.geometry) particle.geometry.dispose();
          if (particle.material) particle.material.dispose();
        }
      }
    }, 2000);
  }
  
  /**
   * Create splash effect when potion breaks
   */
  createSplashEffect() {
    // Number of particles depends on type
    const particleCount = this.isLingering ? 40 : this.isSplash ? 30 : 20;
    
    // Effect radius
    const radius = this.isLingering ? 3 : this.isSplash ? 2 : 1;
    
    // Create splash particles
    for (let i = 0; i < particleCount; i++) {
      // Create particle
      const particleGeometry = new THREE.PlaneGeometry(0.15, 0.15);
      const particle = new THREE.Mesh(particleGeometry, this.particleMaterial.clone());
      
      // Random position within radius
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      particle.position.set(
        this.position.x + Math.cos(angle) * distance,
        this.position.y + Math.random() * 0.5,
        this.position.z + Math.sin(angle) * distance
      );
      
      // Random rotation
      particle.rotation.x = Math.random() * Math.PI * 2;
      particle.rotation.y = Math.random() * Math.PI * 2;
      
      // Set velocity
      particle.velocity = {
        x: (Math.random() - 0.5) * 0.05,
        y: Math.random() * 0.1,
        z: (Math.random() - 0.5) * 0.05
      };
      
      // Add to scene
      this.particles.add(particle);
      
      // Set up particle life and update
      particle.life = 0;
      particle.maxLife = 20 + Math.random() * 20;
      particle.update = dt => {
        // Update position
        particle.position.x += particle.velocity.x * dt;
        particle.position.y += particle.velocity.y * dt;
        particle.position.z += particle.velocity.z * dt;
        
        // Apply gravity
        particle.velocity.y -= 0.0005 * dt;
        
        // Update life and opacity
        particle.life += dt;
        particle.material.opacity = 0.6 * (1 - (particle.life / particle.maxLife));
        
        if (particle.life >= particle.maxLife) {
          this.particles.remove(particle);
          particle.geometry.dispose();
          particle.material.dispose();
        }
      };
    }
    
    // Special effect for lingering potions
    if (this.isLingering) {
      this.createLingeringEffect();
    }
  }
  
  /**
   * Create lingering effect cloud
   */
  createLingeringEffect() {
    // Create cloud effect at ground level
    const cloudGeometry = new THREE.CircleGeometry(3, 16);
    const cloudMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.color),
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloud.rotation.x = -Math.PI / 2; // Flat on ground
    cloud.position.set(this.position.x, 0.05, this.position.z); // Slightly above ground
    
    this.particles.add(cloud);
    
    // Set up cloud effect
    cloud.life = 0;
    cloud.maxLife = 200; // Lingering effect is longer
    cloud.update = dt => {
      cloud.life += dt;
      
      // Pulse opacity
      const phase = (cloud.life % 40) / 40;
      cloud.material.opacity = 0.3 * (1 - (cloud.life / cloud.maxLife)) * 
        (0.7 + 0.3 * Math.sin(phase * Math.PI * 2));
      
      if (cloud.life >= cloud.maxLife) {
        this.particles.remove(cloud);
        cloud.geometry.dispose();
        cloud.material.dispose();
      }
    };
  }
  
  /**
   * Play sound effect when potion breaks
   */
  playBreakSound() {
    if (!this.game || !this.game.audio) return;
    
    let soundName = 'entity.splash_potion.break';
    
    if (this.isLingering) {
      soundName = 'entity.lingering_potion.break';
    } else if (!this.isSplash) {
      soundName = 'entity.potion.break';
    }
    
    this.game.audio.play(soundName, {
      position: this.position,
      volume: 0.8,
      pitch: 0.9 + Math.random() * 0.2
    });
  }
  
  /**
   * Main render/animation frame update
   * @param {number} dt - Delta time in ms
   */
  render(dt) {
    if (!this.model || !this.position) return;
    
    // Update model position
    this.model.position.set(this.position.x, this.position.y, this.position.z);
    
    // Rotate the potion as it flies
    if (!this.hasBroken) {
      this.model.rotation.z += 0.1 * dt;
      
      // Spawn trail particles
      this.spawnParticle();
    }
    
    // Update all particles
    if (this.particles) {
      for (let i = this.particles.children.length - 1; i >= 0; i--) {
        const particle = this.particles.children[i];
        if (particle.update) {
          particle.update(dt);
        }
      }
    }
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Remove model
    if (this.model && this.model.parent) {
      this.model.parent.remove(this.model);
    }
    
    // Remove particles
    if (this.particles && this.particles.parent) {
      this.particles.parent.remove(this.particles);
    }
    
    // Dispose geometries and materials
    if (this.model) {
      this.model.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
    
    if (this.particles) {
      this.particles.children.forEach(particle => {
        if (particle.geometry) particle.geometry.dispose();
        if (particle.material) particle.material.dispose();
      });
    }
  }
}

export default ThrownPotion; 