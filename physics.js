var physics = (function() {
  var constants = {
    gravitationalConstant: 6.67408 * Math.pow(10, -11),
    averageDensity: 1410
  };
  
  var state = { u: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
  var initialConditions = { bodies: 3 };
  
  function calculateRadiusFromMass(mass, density) {
    return Math.pow(3/4 * mass / ( Math.PI * density), 1/3);
  }
  
  function calculateDiameters() {
    var diameters = [];
    for (var iBody = 0; iBody < initialConditions.bodies; iBody++) {
      var density = (initialConditions.densities && initialConditions.densities[iBody]) ? initialConditions.densities[iBody] : constants.averageDensity;
      diameters.push(2 * calculateRadiusFromMass(initialConditions.masses[iBody], density));
    }
    return diameters;
  }
  
  function calculateCenterOfMassVelocity(){
    var centerOfMassVelocity = {x: 0, y: 0};
    var sumOfMasses = 0;
    for (var iBody = 0; iBody < initialConditions.bodies; iBody++) {
      var bodyStart = iBody * 4;
      centerOfMassVelocity.x += initialConditions.masses[iBody] * state.u[bodyStart + 2];
      centerOfMassVelocity.y += initialConditions.masses[iBody] * state.u[bodyStart + 3];
      sumOfMasses += initialConditions.masses[iBody];
    }
    centerOfMassVelocity.x /= sumOfMasses;
    centerOfMassVelocity.y /= sumOfMasses;
    return centerOfMassVelocity;
  }
  
  function calculateCenterOfMass(){
    var centerOfMass = {x: 0, y: 0};
    var sumOfMasses = 0;
    for (var iBody = 0; iBody < initialConditions.bodies; iBody++) {
      var bodyStart = iBody * 4;
      centerOfMass.x += initialConditions.masses[iBody] * state.u[bodyStart + 0];
      centerOfMass.y += initialConditions.masses[iBody] * state.u[bodyStart + 1];
      sumOfMasses += initialConditions.masses[iBody];
    }
    centerOfMass.x /= sumOfMasses;
    centerOfMass.y /= sumOfMasses;
    return centerOfMass;
  }
  
  function resetStateToInitialConditions() {
    var iBody, bodyStart;
    for (iBody = 0; iBody < initialConditions.bodies; iBody++) {
      bodyStart = iBody * 4;
      var position = initialConditions.positions[iBody];
      state.u[bodyStart + 0] = position.r * Math.cos(position.theta);
      state.u[bodyStart + 1] = position.r * Math.sin(position.theta);
      var velocity = initialConditions.velocities[iBody];
      state.u[bodyStart + 2] = velocity.r * Math.cos(velocity.theta);
      state.u[bodyStart + 3] = velocity.r * Math.sin(velocity.theta);
    }
    var centerOfMassVelocity = calculateCenterOfMassVelocity();
    var centerOfMass = calculateCenterOfMass();
    for (iBody = 0; iBody < initialConditions.bodies; iBody++) {
      bodyStart = iBody * 4;
      state.u[bodyStart + 0] -= centerOfMass.x;
      state.u[bodyStart + 1] -= centerOfMass.y;
      state.u[bodyStart + 2] -= centerOfMassVelocity.x;
      state.u[bodyStart + 3] -= centerOfMassVelocity.y;
    }
  }
  
  function acceleration(iFromBody, coordinate) {
    var result = 0;
    var iFromBodyStart = iFromBody * 4;
    var softeningSq;
    if (initialConditions.softeningParameterSquared !== undefined) {
      softeningSq = initialConditions.softeningParameterSquared;
    } else if (initialConditions.dimensionless === true) {
       softeningSq = 0.01;
    } else {
       softeningSq = 4.06e13;
    }
    
    for (var iToBody = 0; iToBody < initialConditions.bodies; iToBody++) {
      if (iFromBody === iToBody) { continue; }
      var iToBodyStart = iToBody * 4;
      var distanceX = state.u[iToBodyStart + 0] - state.u[iFromBodyStart + 0];
      var distanceY = state.u[iToBodyStart + 1] - state.u[iFromBodyStart + 1];
      var distanceSq = distanceX * distanceX + distanceY * distanceY;
      if (distanceSq === 0) continue;
      var gravitationalConstant = (initialConditions.dimensionless !== true) ? constants.gravitationalConstant : 1;
      var denominator = Math.pow(distanceSq + softeningSq, 1.5);
      if (denominator === 0) continue;
      result += gravitationalConstant *
        initialConditions.masses[iToBody] *
        (state.u[iToBodyStart + coordinate] - state.u[iFromBodyStart + coordinate]) /
        denominator;
    }
    return result;
  }
  
  function derivative() {
    var du = new Array(initialConditions.bodies * 4);
    for (var iBody = 0; iBody < initialConditions.bodies; iBody++) {
      var bodyStart = iBody * 4;
      du[bodyStart + 0] = state.u[bodyStart + 2];
      du[bodyStart + 1] = state.u[bodyStart + 3];
      du[bodyStart + 2] = acceleration(iBody, 0);
      du[bodyStart + 3] = acceleration(iBody, 1);
    }
    return du;
  }
  
  function updatePosition(timestep) {
    rungeKutta.calculate(timestep, state.u, derivative);
  }
  
  function calculateNewPosition() {
    for (var iBody = 0; iBody < initialConditions.bodies; iBody++) {
      var bodyStart = iBody * 4;
      // позиция вычисляется в updatePosition; здесь — заглушка для совместимости
    }
  }
  
  function largestDistanceMeters() {
    var result = 0;
    for (var iBody = 0; iBody < initialConditions.bodies; iBody++) {
      var position = initialConditions.positions[iBody];
      if (result < position.r) { result = position.r; }
    }
    return result;
  }
  
  function changeInitialConditions(conditions) {
    initialConditions.dimensionless = conditions.dimensionless;
    initialConditions.masses = conditions.masses.slice();
    initialConditions.positions = conditions.positions;
    initialConditions.velocities = conditions.velocities;
    initialConditions.timeScaleFactor = conditions.timeScaleFactor;
    initialConditions.massSlider = conditions.massSlider;
    initialConditions.timeScaleFactorSlider = conditions.timeScaleFactorSlider;
    initialConditions.densities = conditions.densities;
    initialConditions.paleOrbitalPaths = conditions.paleOrbitalPaths;
    initialConditions.currentPresetName = conditions.name;
    initialConditions.softeningParameterSquared = conditions.softeningParameterSquared;
  }

  // -------- ДОБАВЛЕНО: скорости и полная энергия --------
  function getSpeeds() {
    var speeds = [];
    for (var i = 0; i < initialConditions.bodies; i++) {
      var vx = state.u[i*4 + 2], vy = state.u[i*4 + 3];
      speeds.push(Math.sqrt(vx*vx + vy*vy));
    }
    return speeds;
  }

  function getTotalEnergy() {
    var G = (initialConditions.dimensionless !== true) ? constants.gravitationalConstant : 1;
    var softeningSq;
    if (initialConditions.softeningParameterSquared !== undefined) {
      softeningSq = initialConditions.softeningParameterSquared;
    } else if (initialConditions.dimensionless === true) {
      softeningSq = 0.01;
    } else {
      softeningSq = 4.06e13;
    }
    var epsilon = Math.sqrt(softeningSq);

    var K = 0, U = 0;
    // Кинетическая энергия
    for (var i = 0; i < initialConditions.bodies; i++) {
      var vx = state.u[i*4 + 2], vy = state.u[i*4 + 3];
      var v2 = vx*vx + vy*vy;
      K += 0.5 * initialConditions.masses[i] * v2;
    }
    // Потенциальная энергия с таким же смягчением, как в силах: -G m_i m_j / sqrt(r^2 + eps^2)
    for (var i1 = 0; i1 < initialConditions.bodies; i1++) {
      for (var j1 = i1 + 1; j1 < initialConditions.bodies; j1++) {
        var dx = state.u[j1*4]   - state.u[i1*4];
        var dy = state.u[j1*4+1] - state.u[i1*4+1];
        var rSoft = Math.sqrt(dx*dx + dy*dy + softeningSq);
        if (rSoft > 0) {
          U += - G * initialConditions.masses[i1] * initialConditions.masses[j1] / rSoft;
        }
      }
    }
    return K + U;
  }
  // ------------------------------------------------------

  return {
    resetStateToInitialConditions: resetStateToInitialConditions,
    updatePosition: updatePosition,
    calculateNewPosition: calculateNewPosition,
    initialConditions: initialConditions,
    state: state,
    calculateDiameters: calculateDiameters,
    calculateRadiusFromMass: calculateRadiusFromMass,
    calculateCenterOfMass: calculateCenterOfMass,
    calculateCenterOfMassVelocity: calculateCenterOfMassVelocity,
    largestDistanceMeters: largestDistanceMeters,
    changeInitialConditions: changeInitialConditions,
    constants: constants,
    // новые публичные методы:
    getSpeeds: getSpeeds,
    getTotalEnergy: getTotalEnergy
  };
})();
