var simulation = (function() {
  var calculationsPerFrame = 400;
  var framesPerSecond = 120;
  var drawTimesPerFrame = 20;
  var drawIndex = Math.ceil(calculationsPerFrame / drawTimesPerFrame);
  const restitution = 1;
  const DEBUG_SIMULATION_LOGS = false;
  let lastTimestamp = 0;
  let animationFrameId = null;
  let lastLogTime = 0;
  const logInterval = 200;
  let paused = false;
  let wallsEnabled = true;
  let energyReference = null;
  let resizeHandler = null;

  var perfStats = {
    computeMsAvg: 0,
    frameMsAvg: 0,
    physicsStepsPerSecond: 0,
    framesPerSecondActual: 0
  };

  function resetPerformanceStats() {
    perfStats.computeMsAvg = 0;
    perfStats.frameMsAvg = 0;
    perfStats.physicsStepsPerSecond = 0;
    perfStats.framesPerSecondActual = 0;
  }

  function getPerformanceStats() {
    return {
      computeMsAvg: perfStats.computeMsAvg,
      frameMsAvg: perfStats.frameMsAvg,
      physicsStepsPerSecond: perfStats.physicsStepsPerSecond,
      framesPerSecondActual: perfStats.framesPerSecondActual
    };
  }

  function resetEnergyReference() {
    energyReference = null;
  }

  function redrawCurrentState() {
    if (!window.graphics || typeof graphics.isReady !== 'function' || !graphics.isReady()) return;
    if (wallsEnabled) {
      if (graphics.resetFixedView) graphics.resetFixedView(physics.largestDistanceMeters());
    } else {
      if (graphics.fitViewToState) graphics.fitViewToState(physics.state.u);
    }
    if (graphics.clearTrails) graphics.clearTrails();
    if (graphics.recordTrailPoint) graphics.recordTrailPoint(physics.state.u, true);
    graphics.updateObjectSizes(physics.calculateDiameters());
    var currentTask = (window.labEngine && typeof labEngine.getActiveTask === 'function') ? labEngine.getActiveTask() : null;
    if (graphics.redrawScene) {
      graphics.redrawScene(physics.state.u, physics.initialConditions.paleOrbitalPaths, currentTask);
    } else {
      graphics.calculateNewPositions(physics.state.u);
      graphics.drawBodies();
    }
  }

  function setWallsEnabled(flag) {
    wallsEnabled = !!flag;
    resetEnergyReference();
    if (window.chartManager && typeof window.chartManager.resetEnergyReference === 'function') {
      window.chartManager.resetEnergyReference();
    }
    redrawCurrentState();
  }

  function isWallsEnabled() {
    return wallsEnabled;
  }

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
    var computeStart = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    for (var i = 0; i < calculationsPerFrame; i++) {
      physics.updatePosition(timestep);

      if (wallsEnabled) {
        var boundaries = graphics.getBoundaries ? graphics.getBoundaries() : null;
        if (boundaries) {
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
        }
      } else if (graphics.updateAutoCamera) {
        graphics.updateAutoCamera(physics.state.u);
      }

      if (i % drawIndex === 0 && graphics.recordTrailPoint) {
        graphics.recordTrailPoint(physics.state.u, false);
      }
    }

    graphics.updateObjectSizes(physics.calculateDiameters());

    var computeEnd = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    var computeMs = computeEnd - computeStart;
    var frameMs = deltaTime * 1000.0;
    perfStats.computeMsAvg = perfStats.computeMsAvg ? (perfStats.computeMsAvg * 0.9 + computeMs * 0.1) : computeMs;
    perfStats.frameMsAvg = perfStats.frameMsAvg ? (perfStats.frameMsAvg * 0.9 + frameMs * 0.1) : frameMs;
    perfStats.framesPerSecondActual = frameMs > 0 ? 1000 / frameMs : 0;
    perfStats.physicsStepsPerSecond = frameMs > 0 ? calculationsPerFrame * 1000 / frameMs : 0;

    var currentTask = (window.labEngine && typeof labEngine.getActiveTask === 'function')
      ? labEngine.getActiveTask()
      : null;
    if (graphics.redrawScene) {
      graphics.redrawScene(physics.state.u, physics.initialConditions.paleOrbitalPaths, currentTask);
    } else {
      graphics.calculateNewPositions(physics.state.u);
      graphics.drawBodies();
      if (currentTask) graphics.drawLabVisuals(currentTask, physics.state.u);
    }

    if (DEBUG_SIMULATION_LOGS && currentTime - lastLogTime >= logInterval) {
      var breakdown = (physics.getEnergyBreakdown ? physics.getEnergyBreakdown() : null);
      if (breakdown && Number.isFinite(breakdown.total) && !Number.isFinite(energyReference)) {
        energyReference = breakdown.total;
      }
      var deltaE = breakdown && Number.isFinite(energyReference) ? (breakdown.total - energyReference) : null;
      var relativeE = (breakdown && Number.isFinite(deltaE)) ? Math.abs(deltaE) / Math.max(Math.abs(energyReference), 1e-12) : null;
      var snapshot = (window.chartManager && typeof window.chartManager.getEnergySnapshot === 'function')
        ? window.chartManager.getEnergySnapshot()
        : null;

      const logData = {
        timestamp: new Date().toISOString(),
        currentPreset: physics.initialConditions.currentPresetName || 'Неизвестно',
        integrator: (physics.getIntegratorLabel ? physics.getIntegratorLabel() : (physics.initialConditions.integrator || 'rk4')),
        timeScaleFactor: physics.initialConditions.timeScaleFactor,
        wallsEnabled: wallsEnabled,
        centerOfMass: physics.calculateCenterOfMass(),
        centerOfMassVelocity: physics.calculateCenterOfMassVelocity(),
        performance: getPerformanceStats(),
        energy: breakdown ? {
          kinetic: breakdown.kinetic,
          potential: breakdown.potential,
          total: breakdown.total,
          minDistance: breakdown.minDistance,
          softeningSquared: breakdown.softeningSquared,
          delta: snapshot ? snapshot.delta : deltaE,
          relative: snapshot ? snapshot.relative : relativeE
        } : null,
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
      console.groupCollapsed('Состояние симуляции');
      console.log(logData);
      console.groupEnd();

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
      redrawCurrentState();
      resetPerformanceStats();
      resetEnergyReference();

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

      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      resizeHandler = function(){
        graphics.fitToContainer();
        redrawCurrentState();
      };
      window.addEventListener('resize', resizeHandler);

      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      lastTimestamp = 0;
      animationFrameId = window.requestAnimationFrame(animate);
    });
  }

  function pause()  { paused = true; }
  function resume() { paused = false; lastTimestamp = 0; }
  function isPaused(){ return paused; }

  return {
    start,
    pause,
    resume,
    isPaused,
    setWallsEnabled,
    isWallsEnabled,
    getPerformanceStats,
    resetPerformanceStats,
    redrawCurrentState,
    resetEnergyReference
  };
})();
