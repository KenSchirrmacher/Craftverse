/**
 * AABB - Axis-Aligned Bounding Box for collision detection
 */
const Vector3 = require('../math/vector3');

class AABB {
  /**
   * Create a new AABB
   * @param {Vector3} min - Minimum corner of the box
   * @param {Vector3} max - Maximum corner of the box
   */
  constructor(min, max) {
    this.min = min instanceof Vector3 ? min : new Vector3(min.x, min.y, min.z);
    this.max = max instanceof Vector3 ? max : new Vector3(max.x, max.y, max.z);
  }

  /**
   * Get the center point of this AABB
   * @returns {Vector3} Center point
   */
  getCenter() {
    return new Vector3(
      (this.min.x + this.max.x) / 2,
      (this.min.y + this.max.y) / 2,
      (this.min.z + this.max.z) / 2
    );
  }

  /**
   * Get the size/dimensions of this AABB
   * @returns {Vector3} Size vector
   */
  getSize() {
    return new Vector3(
      this.max.x - this.min.x,
      this.max.y - this.min.y,
      this.max.z - this.min.z
    );
  }

  /**
   * Get the volume of this AABB
   * @returns {number} Volume
   */
  getVolume() {
    const size = this.getSize();
    return size.x * size.y * size.z;
  }

  /**
   * Clone this AABB
   * @returns {AABB} New AABB with same values
   */
  clone() {
    return new AABB(this.min.clone(), this.max.clone());
  }

  /**
   * Translate this AABB by a vector
   * @param {Vector3} vector - Translation vector
   * @returns {AABB} This AABB for chaining
   */
  translate(vector) {
    this.min.add(vector);
    this.max.add(vector);
    return this;
  }

  /**
   * Expand this AABB by a scalar value in all directions
   * @param {number} scalar - Expansion value
   * @returns {AABB} This AABB for chaining
   */
  expand(scalar) {
    this.min.x -= scalar;
    this.min.y -= scalar;
    this.min.z -= scalar;
    this.max.x += scalar;
    this.max.y += scalar;
    this.max.z += scalar;
    return this;
  }

  /**
   * Check if this AABB contains a point
   * @param {Vector3} point - Point to check
   * @returns {boolean} Whether point is contained
   */
  containsPoint(point) {
    return (
      point.x >= this.min.x && point.x <= this.max.x &&
      point.y >= this.min.y && point.y <= this.max.y &&
      point.z >= this.min.z && point.z <= this.max.z
    );
  }

  /**
   * Check if this AABB intersects another AABB
   * @param {AABB} aabb - Other AABB
   * @returns {boolean} Whether they intersect
   */
  intersects(aabb) {
    return (
      this.min.x <= aabb.max.x && this.max.x >= aabb.min.x &&
      this.min.y <= aabb.max.y && this.max.y >= aabb.min.y &&
      this.min.z <= aabb.max.z && this.max.z >= aabb.min.z
    );
  }

  /**
   * Calculate the intersection of this AABB with another
   * @param {AABB} aabb - Other AABB
   * @returns {AABB|null} Intersection AABB or null if no intersection
   */
  intersection(aabb) {
    if (!this.intersects(aabb)) {
      return null;
    }

    const minX = Math.max(this.min.x, aabb.min.x);
    const minY = Math.max(this.min.y, aabb.min.y);
    const minZ = Math.max(this.min.z, aabb.min.z);
    const maxX = Math.min(this.max.x, aabb.max.x);
    const maxY = Math.min(this.max.y, aabb.max.y);
    const maxZ = Math.min(this.max.z, aabb.max.z);

    return new AABB(
      new Vector3(minX, minY, minZ),
      new Vector3(maxX, maxY, maxZ)
    );
  }

  /**
   * Create an AABB from a center point and size
   * @param {Vector3} center - Center point
   * @param {Vector3} size - Size vector
   * @returns {AABB} New AABB
   */
  static fromCenterAndSize(center, size) {
    const halfSize = new Vector3(size.x / 2, size.y / 2, size.z / 2);
    const min = new Vector3(
      center.x - halfSize.x,
      center.y - halfSize.y,
      center.z - halfSize.z
    );
    const max = new Vector3(
      center.x + halfSize.x,
      center.y + halfSize.y,
      center.z + halfSize.z
    );
    return new AABB(min, max);
  }
}

module.exports = AABB; 