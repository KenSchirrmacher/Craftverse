/**
 * Vector utility for 3D vectors and vector operations
 * Used throughout the game for positions, directions, velocities
 */

class Vector {
  /**
   * Create a new 3D vector
   * @param {number} x - X component
   * @param {number} y - Y component
   * @param {number} z - Z component
   */
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * Create a copy of this vector
   * @returns {Vector} A new vector with the same components
   */
  clone() {
    return new Vector(this.x, this.y, this.z);
  }

  /**
   * Set vector components to the values of another vector
   * @param {Vector} v - Vector to copy values from
   * @returns {Vector} This vector for chaining
   */
  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  /**
   * Add another vector to this vector
   * @param {Vector} v - Vector to add
   * @returns {Vector} This vector for chaining
   */
  add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  /**
   * Subtract another vector from this vector
   * @param {Vector} v - Vector to subtract
   * @returns {Vector} This vector for chaining
   */
  subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  /**
   * Multiply this vector by a scalar value
   * @param {number} scalar - Scalar value
   * @returns {Vector} This vector for chaining
   */
  multiply(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }

  /**
   * Divide this vector by a scalar value
   * @param {number} scalar - Scalar value
   * @returns {Vector} This vector for chaining
   */
  divide(scalar) {
    if (scalar !== 0) {
      this.x /= scalar;
      this.y /= scalar;
      this.z /= scalar;
    }
    return this;
  }

  /**
   * Calculate the length (magnitude) of this vector
   * @returns {number} Vector length
   */
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  /**
   * Calculate the squared length of this vector
   * More efficient than length() when only comparing distances
   * @returns {number} Squared vector length
   */
  lengthSquared() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  /**
   * Normalize this vector (make it unit length)
   * @returns {Vector} This vector for chaining
   */
  normalize() {
    const length = this.length();
    return length > 0 ? this.divide(length) : this;
  }

  /**
   * Calculate the dot product with another vector
   * @param {Vector} v - Other vector
   * @returns {number} Dot product
   */
  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  /**
   * Calculate the cross product with another vector
   * @param {Vector} v - Other vector
   * @returns {Vector} New vector containing the cross product
   */
  cross(v) {
    const x = this.y * v.z - this.z * v.y;
    const y = this.z * v.x - this.x * v.z;
    const z = this.x * v.y - this.y * v.x;
    return new Vector(x, y, z);
  }

  /**
   * Calculate the distance to another vector
   * @param {Vector} v - Other vector
   * @returns {number} Distance between vectors
   */
  distanceTo(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculate the squared distance to another vector
   * More efficient than distanceTo() when only comparing distances
   * @param {Vector} v - Other vector
   * @returns {number} Squared distance between vectors
   */
  distanceToSquared(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return dx * dx + dy * dy + dz * dz;
  }

  /**
   * Convert vector to a string representation
   * @returns {string} String representation
   */
  toString() {
    return `Vector(${this.x}, ${this.y}, ${this.z})`;
  }

  /**
   * Convert to a plain object for serialization
   * @returns {Object} Plain object with x, y, z properties
   */
  toJSON() {
    return {
      x: this.x,
      y: this.y,
      z: this.z
    };
  }

  /**
   * Create a vector from a plain object
   * @param {Object} obj - Object with x, y, z properties
   * @returns {Vector} New vector
   */
  static fromObject(obj) {
    return new Vector(obj.x || 0, obj.y || 0, obj.z || 0);
  }

  /**
   * Create a vector with all components set to zero
   * @returns {Vector} Zero vector
   */
  static zero() {
    return new Vector(0, 0, 0);
  }

  /**
   * Create a vector with all components set to one
   * @returns {Vector} Unit vector
   */
  static one() {
    return new Vector(1, 1, 1);
  }

  /**
   * Create a unit vector pointing up (positive Y)
   * @returns {Vector} Up vector
   */
  static up() {
    return new Vector(0, 1, 0);
  }

  /**
   * Create a unit vector pointing down (negative Y)
   * @returns {Vector} Down vector
   */
  static down() {
    return new Vector(0, -1, 0);
  }

  /**
   * Create a unit vector pointing right (positive X)
   * @returns {Vector} Right vector
   */
  static right() {
    return new Vector(1, 0, 0);
  }

  /**
   * Create a unit vector pointing left (negative X)
   * @returns {Vector} Left vector
   */
  static left() {
    return new Vector(-1, 0, 0);
  }

  /**
   * Create a unit vector pointing forward (positive Z)
   * @returns {Vector} Forward vector
   */
  static forward() {
    return new Vector(0, 0, 1);
  }

  /**
   * Create a unit vector pointing backward (negative Z)
   * @returns {Vector} Backward vector
   */
  static backward() {
    return new Vector(0, 0, -1);
  }
}

module.exports = Vector; 