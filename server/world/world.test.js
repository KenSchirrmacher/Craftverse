const World = require('./world');

describe('World', () => {
  let world;

  beforeEach(() => {
    world = new World();
  });

  describe('particle system', () => {
    it('should initialize with empty particle system', () => {
      expect(world.getParticles()).toEqual([]);
    });

    it('should add particles when addParticleEffect is called', () => {
      const effect = {
        type: 'spore',
        position: { x: 0, y: 0, z: 0 },
        count: 5
      };
      world.addParticleEffect(effect);
      const particles = world.getParticles();
      expect(particles.length).toBe(5);
      expect(particles[0].type).toBe('spore');
      expect(particles[0].position).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should update particles when update is called', () => {
      const effect = {
        type: 'spore',
        position: { x: 0, y: 0, z: 0 },
        count: 1
      };
      world.addParticleEffect(effect);
      const initialParticles = world.getParticles();
      expect(initialParticles.length).toBe(1);

      // Update with 1 second delta time
      world.update(1000);
      const updatedParticles = world.getParticles();
      expect(updatedParticles.length).toBe(1);
      expect(updatedParticles[0].position).not.toEqual(initialParticles[0].position);
    });

    it('should clear particles when clearParticles is called', () => {
      const effect = {
        type: 'spore',
        position: { x: 0, y: 0, z: 0 },
        count: 5
      };
      world.addParticleEffect(effect);
      expect(world.getParticles().length).toBe(5);
      world.clearParticles();
      expect(world.getParticles()).toEqual([]);
    });
  });
}); 