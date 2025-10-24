// Основной движок симуляции
var simulation = (function() {
  var calculationsPerFrame = 500;
  var framesPerSecond = 120;
  var drawTimesPerFrame = 20;
  var drawIndex = Math.ceil(calculationsPerFrame / drawTimesPerFrame);
  const restitution = 1;
  let lastTimestamp = 0;
  let animationFrameId = null;
  let lastLogTime = 0;
  const logInterval = 500;
  let paused = false;
  
  function animate(currentTime) {
    if (paused) {
      animationFrameId = window.requestAnimationFrame(animate);
      return;
    }
    if (!lastTimestamp) {
      lastTimestamp = currentTime;
    }
    lastTimestamp = currentTime;
    var timestep = physics.initialConditions.timeScaleFactor / framesPerSecond / calculationsPerFrame;
    
    for (var i = 0; i < calculationsPerFrame; i++) {
      physics.updatePosition(timestep);
      var boundaries = graphics.getBoundaries();
      for (var j = 0; j < physics.initialConditions.bodies; j++) {
        var idx = j * 4;
        var x = physics.state.u[idx];
        var y = physics.state.u[idx + 1];
        var mass = physics.initialConditions.masses[j];
        var density = (physics.initialConditions.densities && physics.initialConditions.densities[j]) ? physics.initialConditions.densities[j] : physics.constants.averageDensity;
        var radius = physics.calculateRadiusFromMass(mass, density);
        var safetyMargin = radius * 0.1;
        var effectiveRadius = radius + safetyMargin;
        
        if (x - effectiveRadius < boundaries.x_min) {
          physics.state.u[idx] = boundaries.x_min + effectiveRadius;
          physics.state.u[idx + 2] = -physics.state.u[idx + 2] * restitution;
        }
        if (x + effectiveRadius > boundaries.x_max) {
          physics.state.u[idx] = boundaries.x_max - effectiveRadius;
          physics.state.u[idx + 2] = -physics.state.u[idx + 2] * restitution;
        }
        if (y - effectiveRadius < boundaries.y_min) {
          physics.state.u[idx + 1] = boundaries.y_min + effectiveRadius;
          physics.state.u[idx + 3] = -physics.state.u[idx + 3] * restitution;
        }
        if (y + effectiveRadius > boundaries.y_max) {
          physics.state.u[idx + 1] = boundaries.y_max - effectiveRadius;
          physics.state.u[idx + 3] = -physics.state.u[idx + 3] * restitution;
        }
      }
      if (i % drawIndex === 0) {
        graphics.calculateNewPositions(physics.state.u);
        graphics.drawOrbitalLines(physics.initialConditions.paleOrbitalPaths);
      }
    }
    graphics.drawBodies();
    
    if (currentTime - lastLogTime >= logInterval) {
      const logData = {
        timestamp: new Date().toISOString(),
        currentPreset: physics.initialConditions.currentPresetName || 'Неизвестно',
        timeScaleFactor: physics.initialConditions.timeScaleFactor,
        centerOfMass: physics.calculateCenterOfMass(),
        centerOfMassVelocity: physics.calculateCenterOfMassVelocity(),
        bodies: []
      };
      for (let j = 0; j < physics.initialConditions.bodies; j++) {
        const idx = j * 4;
        logData.bodies.push({
          id: j,
          mass: physics.initialConditions.masses[j],
          position: { x: physics.state.u[idx], y: physics.state.u[idx + 1] },
          velocity: { x: physics.state.u[idx + 2], y: physics.state.u[idx + 3] }
        });
      }
      console.log("Состояние симуляции:", logData);
      lastLogTime = currentTime;
    }
    animationFrameId = window.requestAnimationFrame(animate);
  }
  
  function start() {
    graphics.init(function() {
      physics.resetStateToInitialConditions();
      graphics.clearScene(physics.largestDistanceMeters());
      graphics.updateObjectSizes(physics.calculateDiameters());
      
      window.addEventListener('resize', function(){
        graphics.fitToContainer();
        graphics.clearScene(physics.largestDistanceMeters());
        graphics.calculateNewPositions(physics.state.u);
        graphics.drawOrbitalLines(physics.initialConditions.paleOrbitalPaths);
        graphics.drawBodies();
      });
      
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = window.requestAnimationFrame(animate);
    });
  }
  
  function pause() {
    paused = true;
  }
  
  function resume() {
    paused = false;
  }
  
  function isPaused() {
    return paused;
  }
  
  return { start: start, pause: pause, resume: resume, isPaused: isPaused };
})();
