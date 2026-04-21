var physics = (function() {
  var constants = {
    gravitationalConstant: 6.67408 * Math.pow(10, -11),
    averageDensity: 1410
  };

  var state = { u: [0,0,0, 0,  0,0,0, 0,  0,0,0, 0] };
  var initialConditions = { bodies: 3, integrator: "rk4" };

  var integrators = {
    euler: {
      id: "euler",
      label: "Эйлер",
      description: "Самый простой и быстрый метод, но быстро накапливает ошибку и хуже сохраняет орбиты."
    },
    rk4: {
      id: "rk4",
      label: "Рунге–Кутты 4-го порядка (RK4)",
      description: "Точный универсальный метод. В симуляторе использует WebAssembly, если он доступен."
    },
    velocityVerlet: {
      id: "velocityVerlet",
      label: "Velocity Verlet",
      description: "Симплектический метод, обычно лучше сохраняет энергию на длинных интервалах."
    },
    rk4Extrapolated: {
      id: "rk4Extrapolated",
      label: "Экстраполированный RK4",
      description: "Тяжёлый режим для сравнения: много прогонов RK4 на дроблёном шаге с экстраполяцией Ричардсона. Обычно точнее, но заметно медленнее."
    }
  };

  var wasmBuffers = {
    statePtr: 0,
    massPtr: 0,
    stateLen: 0,
    bodies: 0,
    stateView: null,
    massView: null,
    integrateFn: null,
    integrateExtrapolatedFn: null,
    massesDirty: true
  };

  function normalizeIntegratorName(name) {
    return integrators[name] ? name : "rk4";
  }

  function getIntegrator() {
    initialConditions.integrator = normalizeIntegratorName(initialConditions.integrator);
    return initialConditions.integrator;
  }

  function setIntegrator(name) {
    initialConditions.integrator = normalizeIntegratorName(name);
  }

  function getAvailableIntegrators() {
    return Object.keys(integrators).map(function(key) {
      return {
        id: integrators[key].id,
        label: integrators[key].label,
        description: integrators[key].description
      };
    });
  }

  function getIntegratorLabel(name) {
    var id = normalizeIntegratorName(name || getIntegrator());
    return integrators[id].label;
  }

  function getIntegratorDescription(name) {
    var id = normalizeIntegratorName(name || getIntegrator());
    return integrators[id].description;
  }

  function markMassesDirty() {
    wasmBuffers.massesDirty = true;
  }

  function calculateRadiusFromMass(mass, density) {
    return Math.pow((3.0 * mass) / (4.0 * Math.PI * density), 1.0 / 3.0);
  }

  function calculateDiameters() {
    var diameters = [];
    for (var iBody = 0; iBody < initialConditions.bodies; iBody++) {
      var density = (initialConditions.densities && initialConditions.densities[iBody])
        ? initialConditions.densities[iBody]
        : constants.averageDensity;
      diameters.push(2 * calculateRadiusFromMass(initialConditions.masses[iBody], density));
    }
    return diameters;
  }

  function calculateCenterOfMassVelocity() {
    var v = { x: 0, y: 0 };
    var sumM = 0;
    for (var i = 0; i < initialConditions.bodies; i++) {
      var b = i * 4;
      v.x += initialConditions.masses[i] * state.u[b + 2];
      v.y += initialConditions.masses[i] * state.u[b + 3];
      sumM += initialConditions.masses[i];
    }
    v.x /= sumM;
    v.y /= sumM;
    return v;
  }

  function calculateCenterOfMass() {
    var c = { x: 0, y: 0 };
    var sumM = 0;
    for (var i = 0; i < initialConditions.bodies; i++) {
      var b = i * 4;
      c.x += initialConditions.masses[i] * state.u[b + 0];
      c.y += initialConditions.masses[i] * state.u[b + 1];
      sumM += initialConditions.masses[i];
    }
    c.x /= sumM;
    c.y /= sumM;
    return c;
  }

  function isArenstorfPreset() {
    return initialConditions.presetMode === "arenstorf";
  }

  function getArenstorfState() {
    var defaultState = { x: 0.994, y: 0, vx: 0, vy: -2.0015851063790825 };
    if (!initialConditions.arenstorfState) return defaultState;

    return {
      x: (typeof initialConditions.arenstorfState.x === "number") ? initialConditions.arenstorfState.x : defaultState.x,
      y: (typeof initialConditions.arenstorfState.y === "number") ? initialConditions.arenstorfState.y : defaultState.y,
      vx: (typeof initialConditions.arenstorfState.vx === "number") ? initialConditions.arenstorfState.vx : defaultState.vx,
      vy: (typeof initialConditions.arenstorfState.vy === "number") ? initialConditions.arenstorfState.vy : defaultState.vy
    };
  }

  function setArenstorfPrimaryState() {
    var mu = initialConditions.mu;
    state.u[0] = -mu;    state.u[1] = 0; state.u[2] = 0; state.u[3] = 0;
    state.u[4] = 1 - mu; state.u[5] = 0; state.u[6] = 0; state.u[7] = 0;
  }

  function arenstorfDerivative(q) {
    var mu = initialConditions.mu;
    var x = q[0], y = q[1], vx = q[2], vy = q[3];
    var dx1 = x + mu;
    var dx2 = x - 1 + mu;
    var r1sq = dx1 * dx1 + y * y;
    var r2sq = dx2 * dx2 + y * y;
    var r1 = Math.sqrt(r1sq);
    var r2 = Math.sqrt(r2sq);
    var r1cube = r1sq * r1;
    var r2cube = r2sq * r2;

    var ax = 2 * vy + x;
    var ay = -2 * vx + y;

    if (r1cube !== 0) {
      ax -= (1 - mu) * dx1 / r1cube;
      ay -= (1 - mu) * y / r1cube;
    }
    if (r2cube !== 0) {
      ax -= mu * dx2 / r2cube;
      ay -= mu * y / r2cube;
    }

    return [vx, vy, ax, ay];
  }

  function getArenstorfAccelerations() {
    var probe = arenstorfDerivative([state.u[8], state.u[9], state.u[10], state.u[11]]);
    return [
      { ax: 0, ay: 0 },
      { ax: 0, ay: 0 },
      { ax: probe[2], ay: probe[3] }
    ];
  }

  function hasUsableWasm() {
    return typeof Module !== "undefined" &&
      Module &&
      typeof Module._malloc === "function" &&
      typeof Module._free === "function" &&
      Module.HEAPF64;
  }

  function releaseWasmBuffers() {
    if (hasUsableWasm()) {
      if (wasmBuffers.statePtr) Module._free(wasmBuffers.statePtr);
      if (wasmBuffers.massPtr) Module._free(wasmBuffers.massPtr);
    }

    wasmBuffers.statePtr = 0;
    wasmBuffers.massPtr = 0;
    wasmBuffers.stateLen = 0;
    wasmBuffers.bodies = 0;
    wasmBuffers.stateView = null;
    wasmBuffers.massView = null;
    wasmBuffers.integrateFn = null;
    wasmBuffers.integrateExtrapolatedFn = null;
    wasmBuffers.massesDirty = true;
  }

  function ensureWasmBuffers() {
    if (!hasUsableWasm()) return false;

    var bodies = initialConditions.bodies;
    var stateLen = bodies * 4;

    var mustReallocate =
      !wasmBuffers.statePtr ||
      !wasmBuffers.massPtr ||
      wasmBuffers.stateLen !== stateLen ||
      wasmBuffers.bodies !== bodies;

    if (mustReallocate) {
      releaseWasmBuffers();

      wasmBuffers.statePtr = Module._malloc(stateLen * 8);
      wasmBuffers.massPtr = Module._malloc(bodies * 8);
      wasmBuffers.stateLen = stateLen;
      wasmBuffers.bodies = bodies;

      wasmBuffers.stateView = Module.HEAPF64.subarray(
        wasmBuffers.statePtr >> 3,
        (wasmBuffers.statePtr >> 3) + stateLen
      );

      wasmBuffers.massView = Module.HEAPF64.subarray(
        wasmBuffers.massPtr >> 3,
        (wasmBuffers.massPtr >> 3) + bodies
      );

      wasmBuffers.massesDirty = true;
    }

    if (!wasmBuffers.integrateFn) {
      wasmBuffers.integrateFn =
        (typeof Module._integrate === "function")
          ? Module._integrate
          : (
              typeof Module.cwrap === "function"
                ? Module.cwrap("integrate", null, ["number", "number", "number", "number", "number", "number"])
                : null
            );
    }

    if (!wasmBuffers.integrateExtrapolatedFn) {
      wasmBuffers.integrateExtrapolatedFn =
        (typeof Module._integrate_extrapolated === "function")
          ? Module._integrate_extrapolated
          : (
              typeof Module.cwrap === "function"
                ? Module.cwrap("integrate_extrapolated", null, ["number", "number", "number", "number", "number", "number"])
                : null
            );
    }

    return !!wasmBuffers.integrateFn;
  }

  function syncMassesToWasm() {
    if (!wasmBuffers.massView || !initialConditions.masses) return;

    for (var i = 0; i < initialConditions.masses.length; i++) {
      wasmBuffers.massView[i] = initialConditions.masses[i];
    }

    wasmBuffers.massesDirty = false;
  }

  function updateArenstorfPosition(timestep) {
    var maxInternalStep = 2e-6;
    var steps = Math.max(1, Math.ceil(Math.abs(timestep) / maxInternalStep));
    var dt = timestep / steps;

    var q = [state.u[8], state.u[9], state.u[10], state.u[11]];

    for (var step = 0; step < steps; step++) {
      var k1 = arenstorfDerivative(q);
      var q2 = q.map(function(v, i) { return v + 0.5 * dt * k1[i]; });
      var k2 = arenstorfDerivative(q2);
      var q3 = q.map(function(v, i) { return v + 0.5 * dt * k2[i]; });
      var k3 = arenstorfDerivative(q3);
      var q4 = q.map(function(v, i) { return v + dt * k3[i]; });
      var k4 = arenstorfDerivative(q4);

      for (var i = 0; i < 4; i++) {
        q[i] += dt * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) / 6;
      }
    }

    setArenstorfPrimaryState();
    state.u[8]  = q[0];
    state.u[9]  = q[1];
    state.u[10] = q[2];
    state.u[11] = q[3];
  }

  function resetStateToInitialConditions() {
    if (isArenstorfPreset()) {
      var arenstorf = getArenstorfState();
      setArenstorfPrimaryState();
      state.u[8] = arenstorf.x;
      state.u[9] = arenstorf.y;
      state.u[10] = arenstorf.vx;
      state.u[11] = arenstorf.vy;
      return;
    }

    if (!initialConditions.positions || !initialConditions.velocities) return;

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

    var vcom = calculateCenterOfMassVelocity();
    var com = calculateCenterOfMass();

    for (iBody = 0; iBody < initialConditions.bodies; iBody++) {
      bodyStart = iBody * 4;
      state.u[bodyStart + 0] -= com.x;
      state.u[bodyStart + 1] -= com.y;
      state.u[bodyStart + 2] -= vcom.x;
      state.u[bodyStart + 3] -= vcom.y;
    }
  }

  function getSofteningSq() {
    if (initialConditions.softeningParameterSquared !== undefined) {
      return initialConditions.softeningParameterSquared;
    }
    return initialConditions.dimensionless ? 0.01 : 4.06e13;
  }

  function getGravitationalConstant() {
    return (initialConditions.dimensionless !== true)
      ? constants.gravitationalConstant
      : 1;
  }

  function computeAccelerationsFromState(u) {
    var softeningSq = getSofteningSq();
    var G = getGravitationalConstant();
    var arr = [];

    for (var i = 0; i < initialConditions.bodies; i++) {
      var iBase = i * 4;
      var ax = 0;
      var ay = 0;

      for (var j = 0; j < initialConditions.bodies; j++) {
        if (j === i) continue;

        var jBase = j * 4;
        var dx = u[jBase + 0] - u[iBase + 0];
        var dy = u[jBase + 1] - u[iBase + 1];
        var distSq = dx * dx + dy * dy + softeningSq;

        if (distSq === 0) continue;

        var denom = distSq * Math.sqrt(distSq);
        if (denom === 0) continue;

        var factor = G * initialConditions.masses[j] / denom;
        ax += factor * dx;
        ay += factor * dy;
      }

      arr.push({ ax: ax, ay: ay });
    }

    return arr;
  }

  function derivativeFromState(u) {
    var du = new Array(initialConditions.bodies * 4);
    var accs = computeAccelerationsFromState(u);

    for (var i = 0; i < initialConditions.bodies; i++) {
      var b = i * 4;
      du[b + 0] = u[b + 2];
      du[b + 1] = u[b + 3];
      du[b + 2] = accs[i].ax;
      du[b + 3] = accs[i].ay;
    }

    return du;
  }

  function accelerationJS(iFromBody, coordinate) {
    var accs = computeAccelerationsFromState(state.u);
    return coordinate === 0 ? accs[iFromBody].ax : accs[iFromBody].ay;
  }

  function derivativeJS() {
    return derivativeFromState(state.u);
  }

  function integrateEulerJS(timestep) {
    var du = derivativeFromState(state.u);
    for (var i = 0; i < state.u.length; i++) {
      state.u[i] += timestep * du[i];
    }
  }

  function integrateRK4JS(timestep) {
    var n = state.u.length;
    var y0 = state.u.slice();
    var yTemp = new Array(n);
    var k1 = derivativeFromState(y0);
    var i;

    for (i = 0; i < n; i++) yTemp[i] = y0[i] + 0.5 * timestep * k1[i];
    var k2 = derivativeFromState(yTemp);

    for (i = 0; i < n; i++) yTemp[i] = y0[i] + 0.5 * timestep * k2[i];
    var k3 = derivativeFromState(yTemp);

    for (i = 0; i < n; i++) yTemp[i] = y0[i] + timestep * k3[i];
    var k4 = derivativeFromState(yTemp);

    for (i = 0; i < n; i++) {
      state.u[i] = y0[i] + (timestep / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    }
  }

  function rk4StepFromState(inputState, timestep) {
    var n = inputState.length;
    var y0 = inputState.slice();
    var yTemp = new Array(n);
    var k1 = derivativeFromState(y0);
    var i;

    for (i = 0; i < n; i++) yTemp[i] = y0[i] + 0.5 * timestep * k1[i];
    var k2 = derivativeFromState(yTemp);
    for (i = 0; i < n; i++) yTemp[i] = y0[i] + 0.5 * timestep * k2[i];
    var k3 = derivativeFromState(yTemp);
    for (i = 0; i < n; i++) yTemp[i] = y0[i] + timestep * k3[i];
    var k4 = derivativeFromState(yTemp);

    var out = new Array(n);
    for (i = 0; i < n; i++) {
      out[i] = y0[i] + (timestep / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    }
    return out;
  }

  function rk4SubstepsFromState(inputState, timestep, substeps) {
    var out = inputState.slice();
    var dt = timestep / substeps;
    for (var s = 0; s < substeps; s++) {
      out = rk4StepFromState(out, dt);
    }
    return out;
  }

  function integrateRK4ExtrapolatedJS(timestep) {
    var levels = [1, 2, 4, 8, 16, 32];
    var table = [];
    var dim = state.u.length;

    for (var k = 0; k < levels.length; k++) {
      table[k] = rk4SubstepsFromState(state.u, timestep, levels[k]);
    }

    for (var kk = 1; kk < levels.length; kk++) {
      for (var j = 1; j <= kk; j++) {
        var factor = Math.pow(2, 4 * j);
        var denom = factor - 1;
        var improved = new Array(dim);
        for (var i = 0; i < dim; i++) {
          improved[i] = table[kk][i] + (table[kk][i] - table[kk - 1][i]) / denom;
        }
        table[kk - 1] = table[kk];
        table[kk] = improved;
      }
    }

    state.u = table[levels.length - 1].slice();
  }

  function integrateVelocityVerletJS(timestep) {
    var y0 = state.u.slice();
    var a0 = computeAccelerationsFromState(y0);
    var yTemp = y0.slice();
    var i, b;

    for (i = 0; i < initialConditions.bodies; i++) {
      b = i * 4;
      yTemp[b + 0] = y0[b + 0] + y0[b + 2] * timestep + 0.5 * a0[i].ax * timestep * timestep;
      yTemp[b + 1] = y0[b + 1] + y0[b + 3] * timestep + 0.5 * a0[i].ay * timestep * timestep;
    }

    var a1 = computeAccelerationsFromState(yTemp);

    for (i = 0; i < initialConditions.bodies; i++) {
      b = i * 4;
      state.u[b + 0] = yTemp[b + 0];
      state.u[b + 1] = yTemp[b + 1];
      state.u[b + 2] = y0[b + 2] + 0.5 * (a0[i].ax + a1[i].ax) * timestep;
      state.u[b + 3] = y0[b + 3] + 0.5 * (a0[i].ay + a1[i].ay) * timestep;
    }
  }

  function getAccelerations() {
    if (isArenstorfPreset()) {
      return getArenstorfAccelerations();
    }

    return computeAccelerationsFromState(state.u);
  }

  function updatePosition(timestep) {
    if (isArenstorfPreset()) {
      updateArenstorfPosition(timestep);
      return;
    }

    var integrator = getIntegrator();

    if ((integrator === "rk4" || integrator === "rk4Extrapolated") && ensureWasmBuffers()) {
      var stateLen = wasmBuffers.stateLen;

      for (var i = 0; i < stateLen; i++) {
        wasmBuffers.stateView[i] = state.u[i];
      }

      if (wasmBuffers.massesDirty) {
        syncMassesToWasm();
      }

      var dimFlag = initialConditions.dimensionless ? 1 : 0;
      var softening = getSofteningSq();
      var integrateFn = (integrator === "rk4Extrapolated" && wasmBuffers.integrateExtrapolatedFn)
        ? wasmBuffers.integrateExtrapolatedFn
        : wasmBuffers.integrateFn;

      integrateFn(
        timestep,
        wasmBuffers.statePtr,
        wasmBuffers.bodies,
        wasmBuffers.massPtr,
        dimFlag,
        softening
      );

      for (var k = 0; k < stateLen; k++) {
        state.u[k] = wasmBuffers.stateView[k];
      }

      return;
    }

    if (integrator === "euler") {
      integrateEulerJS(timestep);
      return;
    }

    if (integrator === "velocityVerlet") {
      integrateVelocityVerletJS(timestep);
      return;
    }

    if (integrator === "rk4Extrapolated") {
      integrateRK4ExtrapolatedJS(timestep);
      return;
    }

    integrateRK4JS(timestep);
  }

  function largestDistanceMeters() {
    if (typeof initialConditions.largestDistanceOverride === "number" &&
        initialConditions.largestDistanceOverride > 0) {
      return initialConditions.largestDistanceOverride;
    }

    var result = 0;
    if (!initialConditions.positions) return 0;

    for (var i = 0; i < initialConditions.bodies; i++) {
      var p = initialConditions.positions[i];
      if (result < p.r) result = p.r;
    }

    return result;
  }

  function changeInitialConditions(conditions) {
    var previousIntegrator = getIntegrator();

    initialConditions.dimensionless = conditions.dimensionless;
    initialConditions.masses = conditions.masses.slice();
    initialConditions.bodies = initialConditions.masses.length;
    initialConditions.positions = conditions.positions;
    initialConditions.velocities = conditions.velocities;
    initialConditions.timeScaleFactor = conditions.timeScaleFactor;
    initialConditions.massSlider = conditions.massSlider;
    initialConditions.timeScaleFactorSlider = conditions.timeScaleFactorSlider;
    initialConditions.densities = conditions.densities;
    initialConditions.paleOrbitalPaths = conditions.paleOrbitalPaths;
    initialConditions.currentPresetName = conditions.name;
    initialConditions.softeningParameterSquared = conditions.softeningParameterSquared;
    initialConditions.presetMode = conditions.presetMode || null;
    initialConditions.mu = (typeof conditions.mu === "number") ? conditions.mu : 0.012277471;
    initialConditions.arenstorfState = conditions.arenstorfState || null;
    initialConditions.largestDistanceOverride = conditions.largestDistanceOverride;
    initialConditions.integrator = normalizeIntegratorName(
      (typeof conditions.integrator === "string") ? conditions.integrator : previousIntegrator
    );

    wasmBuffers.massesDirty = true;

    if (wasmBuffers.bodies !== initialConditions.bodies) {
      releaseWasmBuffers();
    }
  }

  function getSpeeds() {
    var speeds = [];
    for (var i = 0; i < initialConditions.bodies; i++) {
      var vx = state.u[i * 4 + 2];
      var vy = state.u[i * 4 + 3];
      speeds.push(Math.sqrt(vx * vx + vy * vy));
    }
    return speeds;
  }

  function getEnergyBreakdown() {
    var G = getGravitationalConstant();
    var softeningSq = getSofteningSq();
    var K = 0;
    var U = 0;
    var minDistance = Infinity;

    for (var i = 0; i < initialConditions.bodies; i++) {
      var vx = state.u[i * 4 + 2];
      var vy = state.u[i * 4 + 3];
      K += 0.5 * initialConditions.masses[i] * (vx * vx + vy * vy);
    }

    for (var a = 0; a < initialConditions.bodies; a++) {
      for (var b = a + 1; b < initialConditions.bodies; b++) {
        var dx = state.u[b * 4] - state.u[a * 4];
        var dy = state.u[b * 4 + 1] - state.u[a * 4 + 1];
        var distSqRaw = dx * dx + dy * dy;
        var dist = Math.sqrt(distSqRaw);
        if (dist < minDistance) minDistance = dist;
        var rSoft = Math.sqrt(distSqRaw + softeningSq);
        if (rSoft > 0) {
          U += -G * initialConditions.masses[a] * initialConditions.masses[b] / rSoft;
        }
      }
    }

    if (!Number.isFinite(minDistance)) minDistance = 0;
    return {
      kinetic: K,
      potential: U,
      total: K + U,
      minDistance: minDistance,
      softeningSquared: softeningSq
    };
  }

  function getTotalEnergy() {
    return getEnergyBreakdown().total;
  }

  return {
    constants: constants,
    state: state,
    initialConditions: initialConditions,
    calculateRadiusFromMass: calculateRadiusFromMass,
    calculateDiameters: calculateDiameters,
    calculateCenterOfMass: calculateCenterOfMass,
    calculateCenterOfMassVelocity: calculateCenterOfMassVelocity,
    resetStateToInitialConditions: resetStateToInitialConditions,
    updatePosition: updatePosition,
    largestDistanceMeters: largestDistanceMeters,
    changeInitialConditions: changeInitialConditions,
    getSpeeds: getSpeeds,
    getTotalEnergy: getTotalEnergy,
    getEnergyBreakdown: getEnergyBreakdown,
    getAccelerations: getAccelerations,
    releaseWasmBuffers: releaseWasmBuffers,
    getIntegrator: getIntegrator,
    setIntegrator: setIntegrator,
    getAvailableIntegrators: getAvailableIntegrators,
    getIntegratorLabel: getIntegratorLabel,
    getIntegratorDescription: getIntegratorDescription,
    markMassesDirty: markMassesDirty
  };
})();
