// Simplified physics.js for testing purposes

/**
 * Vector utility functions
 */
const Vector = {
  normalize: function(vector) {
    const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (magnitude === 0) return { x: 0, y: 0 };
    return {
      x: vector.x / magnitude,
      y: vector.y / magnitude
    };
  },
  
  add: function(a, b) {
    return {
      x: a.x + b.x,
      y: a.y + b.y
    };
  },
  
  subtract: function(a, b) {
    return {
      x: a.x - b.x,
      y: a.y - b.y
    };
  },
  
  multiply: function(vector, scalar) {
    return {
      x: vector.x * scalar,
      y: vector.y * scalar
    };
  },
  
  distance: function(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
};

/**
 * PhysicsWorld interface
 */
class PhysicsWorld {
  constructor(width, height) {
    this.entities = new Map();
    this.gravity = { x: 0, y: 0 };
    this.airFriction = 0.01;
    this.timeAccumulator = 0;
    this.fixedTimeStep = 1/60;
    this.bounds = { width: width || 800, height: height || 600 };
  }
}

/**
 * Create a physics world
 */
function createPhysicsWorld(width, height) {
  return new PhysicsWorld(width, height);
}

module.exports = {
  Vector,
  PhysicsWorld,
  createPhysicsWorld
};