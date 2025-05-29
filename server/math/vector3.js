/**
 * Vector3 - 3D vector math operations
 */
class Vector3 {
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
   * Get a copy of this vector
   * @returns {Vector3} New vector with same values
   */
  clone() {
    return new Vector3(this.x, this.y, this.z);
  }

  /**
   * Add another vector to this one
   * @param {Vector3} v - Vector to add
   * @returns {Vector3} This vector for chaining
   */
  add(v) {
    return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  /**
   * Subtract another vector from this one
   * @param {Vector3} v - Vector to subtract
   * @returns {Vector3} This vector for chaining
   */
  subtract(v) {
    return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  /**
   * Multiply this vector by a scalar
   * @param {number} scalar - Scalar value
   * @returns {Vector3} This vector for chaining
   */
  multiply(scalar) {
    return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  /**
   * Divide this vector by a scalar
   * @param {number} scalar - Scalar value
   * @returns {Vector3} This vector for chaining
   */
  divide(scalar) {
    if (scalar === 0) throw new Error('Division by zero');
    return new Vector3(this.x / scalar, this.y / scalar, this.z / scalar);
  }

  /**
   * Calculate the length/magnitude of this vector
   * @returns {number} Vector length
   */
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  /**
   * Normalize this vector (make it unit length)
   * @returns {Vector3} This vector for chaining
   */
  normalize() {
    const mag = this.magnitude();
    if (mag === 0) return new Vector3();
    return this.divide(mag);
  }

  /**
   * Calculate the dot product with another vector
   * @param {Vector3} v - Other vector
   * @returns {number} Dot product
   */
  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  /**
   * Calculate the cross product with another vector
   * @param {Vector3} v - Other vector
   * @returns {Vector3} New vector representing cross product
   */
  cross(v) {
    return new Vector3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  /**
   * Calculate distance to another vector
   * @param {Vector3} v - Other vector
   * @returns {number} Distance
   */
  distanceTo(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculate squared distance to another vector (faster than distanceTo)
   * @param {Vector3} v - Other vector
   * @returns {number} Squared distance
   */
  distanceToSquared(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return dx * dx + dy * dy + dz * dz;
  }

  /**
   * Floor all components of this vector
   * @returns {Vector3} This vector for chaining
   */
  floor() {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
    this.z = Math.floor(this.z);
    return this;
  }

  /**
   * Ceiling all components of this vector
   * @returns {Vector3} This vector for chaining
   */
  ceil() {
    this.x = Math.ceil(this.x);
    this.y = Math.ceil(this.y);
    this.z = Math.ceil(this.z);
    return this;
  }

  /**
   * Round all components of this vector
   * @returns {Vector3} This vector for chaining
   */
  round() {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    this.z = Math.round(this.z);
    return this;
  }

  /**
   * Set components of this vector
   * @param {number} x - X component
   * @param {number} y - Y component
   * @param {number} z - Z component
   * @returns {Vector3} This vector for chaining
   */
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  /**
   * Create a Vector3 from an object with x, y, z properties
   * @param {Object} obj - Object with x, y, z properties
   * @returns {Vector3} New vector
   */
  static fromObject(obj) {
    return new Vector3(obj.x || 0, obj.y || 0, obj.z || 0);
  }

  /**
   * Check if this vector is equal to another vector
   * @param {Vector3} v - Other vector
   * @returns {boolean} True if vectors are equal, false otherwise
   */
  equals(v) {
    return this.x === v.x && this.y === v.y && this.z === v.z;
  }

  /**
   * Convert this vector to a string representation
   * @returns {string} String representation of the vector
   */
  toString() {
    return `Vector3(${this.x}, ${this.y}, ${this.z})`;
  }
}

module.exports = { Vector3 }; 