/**
 * Render Manager
 * Handles block rendering and visual effects
 */

class RenderManager {
  constructor() {
    this.blockModels = new Map();
    this.textures = new Map();
    this.shaders = new Map();
  }

  /**
   * Register a block model
   * @param {string} id - Block model identifier
   * @param {Object} model - Block model data
   */
  registerBlockModel(id, model) {
    if (this.blockModels.has(id)) {
      console.warn(`Block model '${id}' already registered, overwriting`);
    }
    this.blockModels.set(id, model);
  }

  /**
   * Register a texture
   * @param {string} id - Texture identifier
   * @param {Object} texture - Texture data
   */
  registerTexture(id, texture) {
    if (this.textures.has(id)) {
      console.warn(`Texture '${id}' already registered, overwriting`);
    }
    this.textures.set(id, texture);
  }

  /**
   * Register a shader
   * @param {string} id - Shader identifier
   * @param {Object} shader - Shader data
   */
  registerShader(id, shader) {
    if (this.shaders.has(id)) {
      console.warn(`Shader '${id}' already registered, overwriting`);
    }
    this.shaders.set(id, shader);
  }

  /**
   * Get a block model by ID
   * @param {string} id - Block model identifier
   * @returns {Object|null} - Block model data or null if not found
   */
  getBlockModel(id) {
    return this.blockModels.get(id) || null;
  }

  /**
   * Get a texture by ID
   * @param {string} id - Texture identifier
   * @returns {Object|null} - Texture data or null if not found
   */
  getTexture(id) {
    return this.textures.get(id) || null;
  }

  /**
   * Get a shader by ID
   * @param {string} id - Shader identifier
   * @returns {Object|null} - Shader data or null if not found
   */
  getShader(id) {
    return this.shaders.get(id) || null;
  }

  /**
   * Render a block
   * @param {Object} block - Block to render
   * @param {Object} position - Block position
   * @returns {Object} - Render data
   */
  renderBlock(block, position) {
    const model = this.getBlockModel(block.type);
    if (!model) return null;

    return {
      type: block.type,
      position,
      model,
      textures: model.textures.map(id => this.getTexture(id)),
      shader: model.shader ? this.getShader(model.shader) : null
    };
  }

  /**
   * Clear all registered data
   */
  clear() {
    this.blockModels.clear();
    this.textures.clear();
    this.shaders.clear();
  }
}

// Create singleton instance
const renderManager = new RenderManager();

module.exports = renderManager; 