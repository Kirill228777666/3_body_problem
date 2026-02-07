var simulation = (function() {
  var calculationsPerFrame = 200;
  var framesPerSecond = 120;
  var drawTimesPerFrame = 20;
  var drawIndex = Math.ceil(calculationsPerFrame / drawTimesPerFrame);
  const restitution = 1;
  let lastTimestamp = 0;
  let animationFrameId = null;
  let lastLogTime = 0;
  const logInterval = 200;
  let paused = false;

  function animate(currentTime) {
    if (!lastTimestamp) lastTimestamp = currentTime;
    let deltaTime = (currentTime - lastTimestamp) / 1000.0;
    lastTimestamp = currentTime;

    if (paused) {
      animationFrameId = window.requestAnimationFrame(animate);
      return;
    }

    if (deltaTime > 0.1) deltaTime = 0.1;

    try {
      if (window.logManager && typeof logManager.update === 'function') {
        let simulatedTimeDelta = deltaTime * physics.initialConditions.timeScaleFactor;
        logManager.update(currentTime, simulatedTimeDelta);
      }
    } catch (e) {}

    var timestep = physics.initialConditions.timeScaleFactor / framesPerSecond / calculationsPerFrame;
    var boundaries = graphics.getBoundaries();

    for (var i = 0; i < calculationsPerFrame; i++) {
      physics.updatePosition(timestep);

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
    graphics.drawApproximationCurve();

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

      if (window.chartManager && typeof window.chartManager.update === 'function') {
        try {
          window.chartManager.update({
            speeds: (physics.getSpeeds ? physics.getSpeeds() : null),
            accs: (physics.getAccelerations ? physics.getAccelerations() : null),
            time: currentTime
          });
        } catch (e) {}
      }

      lastLogTime = currentTime;
    }

    if (window.labEngine && typeof labEngine.update === "function") {
      try { labEngine.update(deltaTime); } catch(e) {}
    }

    animationFrameId = window.requestAnimationFrame(animate);
  }

  function start() {
    graphics.init(function() {
      physics.resetStateToInitialConditions();
      graphics.clearScene(physics.largestDistanceMeters());
      graphics.updateObjectSizes(physics.calculateDiameters());

      if (window.chartManager) {
        if (typeof window.chartManager.reset === 'function') {
          window.chartManager.reset();
        }
        if (typeof window.chartManager.update === 'function') {
          try {
            window.chartManager.update({
              speeds: (physics.getSpeeds ? physics.getSpeeds() : null),
              accs: (physics.getAccelerations ? physics.getAccelerations() : null),
              time: 0
            });
          } catch (e) {}
        }
      }

      window.addEventListener('resize', function(){
        graphics.fitToContainer();
        graphics.clearScene(physics.largestDistanceMeters());
        graphics.calculateNewPositions(physics.state.u);
        graphics.drawOrbitalLines(physics.initialConditions.paleOrbitalPaths);
        graphics.drawBodies();
      });

      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      lastTimestamp = 0;
      animationFrameId = window.requestAnimationFrame(animate);
    });
  }

  function pause()  { paused = true; }
  function resume() { paused = false; lastTimestamp = 0; }
  function isPaused(){ return paused; }

  return { start, pause, resume, isPaused };
})();