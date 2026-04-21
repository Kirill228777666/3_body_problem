var graphics = (function() {
  var canvas = null,
      context = null,
      canvasHeight = 600,
      metersPerPixel = 100,
      targetMetersPerPixel = 100,
      minimumSizePixels = 10,
      maximumSizePixels = 80,
      colors = {
        orbitalPaths: ["#ff8b22", "#6c81ff", "#4ccd7a"],
        paleOrbitalPaths: ["#ab681c", "#4957ae", "#359256"]
      },
      bodyPositions = [
        {x: null, y: null},
        {x: null, y: null},
        {x: null, y: null}
      ],
      currentBodySizes = [],
      bodyElements = [],
      circlesMode = false,
      cameraCenter = { x: 0, y: 0 },
      trailHistory = [[], [], []],
      trailLimitEnabled = false,
      maximumTrailPoints = 2500;

  function isReady() {
    return !!(canvas && context);
  }

  function drawBody(position, size, bodyElement) {
    bodyElement.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%)`;
  }

  function toScreen(x, y) {
    return {
      x: (x - cameraCenter.x) / metersPerPixel + canvas.width / 2,
      y: -(y - cameraCenter.y) / metersPerPixel + canvas.height / 2
    };
  }

  function getViewPadding() {
    return {
      x: Math.max(90, canvas.width * 0.12),
      y: Math.max(70, canvas.height * 0.12)
    };
  }

  function getUsableHalfExtents() {
    var padding = getViewPadding();
    return {
      halfWidth: Math.max(20, canvas.width / 2 - padding.x),
      halfHeight: Math.max(20, canvas.height / 2 - padding.y)
    };
  }

  function computeRequiredMppForCurrentCenter(stateU) {
    if (!stateU || !stateU.length || !isReady()) return null;

    var maxAbsX = 0;
    var maxAbsY = 0;
    for (var iBody = 0; iBody < stateU.length / 4; iBody++) {
      var bodyStart = iBody * 4;
      var relX = Math.abs(stateU[bodyStart + 0] - cameraCenter.x);
      var relY = Math.abs(stateU[bodyStart + 1] - cameraCenter.y);
      if (relX > maxAbsX) maxAbsX = relX;
      if (relY > maxAbsY) maxAbsY = relY;
    }

    var usable = getUsableHalfExtents();
    var desiredMpp = Math.max(maxAbsX / usable.halfWidth, maxAbsY / usable.halfHeight, 1e-9);
    desiredMpp *= 1.04;
    return desiredMpp;
  }

  function updateObjectSizes(sizes) {
    for (var iBody = 0; iBody < sizes.length; iBody++) {
      currentBodySizes[iBody] = sizes[iBody] / metersPerPixel;
      if (currentBodySizes[iBody] < minimumSizePixels) { currentBodySizes[iBody] = minimumSizePixels; }
      if (currentBodySizes[iBody] > maximumSizePixels) { currentBodySizes[iBody] = maximumSizePixels; }
      if (bodyElements[iBody]) {
        bodyElements[iBody].style.width = currentBodySizes[iBody] + "px";
        bodyElements[iBody].style.height = currentBodySizes[iBody] + "px";
      }
    }
  }

  function calculateNewPositions(stateU) {
    if (!isReady()) return;
    for (var iBody = 0; iBody < stateU.length / 4; iBody++) {
      var bodyStart = iBody * 4;
      var p = toScreen(stateU[bodyStart + 0], stateU[bodyStart + 1]);
      bodyPositions[iBody].x = p.x;
      bodyPositions[iBody].y = p.y;
    }
  }

  function drawBodies() {
    for (var iBody = 0; iBody < bodyPositions.length; iBody++) {
      var bodyPosition = bodyPositions[iBody];
      if (bodyElements[iBody] && currentBodySizes[iBody] !== undefined) {
        drawBody(bodyPosition, currentBodySizes[iBody], bodyElements[iBody]);
      }
    }
  }

  function clearCanvas() {
    if (!isReady()) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function trimTrail(bodyIndex) {
    if (!trailLimitEnabled) return;
    var history = trailHistory[bodyIndex];
    if (!history || history.length <= maximumTrailPoints) return;
    history.splice(0, history.length - maximumTrailPoints);
  }

  function recordTrailPoint(stateU, force) {
    if (!stateU || !stateU.length) return;

    for (var iBody = 0; iBody < stateU.length / 4; iBody++) {
      var bodyStart = iBody * 4;
      var x = stateU[bodyStart + 0];
      var y = stateU[bodyStart + 1];
      var history = trailHistory[iBody];
      var last = history.length ? history[history.length - 1] : null;
      var minStepWorld = metersPerPixel * 0.9;

      if (!last || force) {
        history.push({ x: x, y: y });
        trimTrail(iBody);
        continue;
      }

      var dx = x - last.x;
      var dy = y - last.y;
      if ((dx * dx + dy * dy) >= (minStepWorld * minStepWorld)) {
        history.push({ x: x, y: y });
        trimTrail(iBody);
      }
    }
  }

  function renderTrails(paleOrbitalPaths) {
    if (!isReady()) return;

    for (var iBody = 0; iBody < trailHistory.length; iBody++) {
      var history = trailHistory[iBody];
      if (!history || history.length < 2) continue;

      var orbitalPathColors = paleOrbitalPaths ? colors.paleOrbitalPaths : colors.orbitalPaths;
      context.beginPath();
      context.strokeStyle = orbitalPathColors[iBody];
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = 1.5;

      var first = toScreen(history[0].x, history[0].y);
      context.moveTo(first.x, first.y);
      for (var i = 1; i < history.length; i++) {
        var p = toScreen(history[i].x, history[i].y);
        context.lineTo(p.x, p.y);
      }
      context.stroke();
    }
  }

  function snapZoomToState(stateU) {
    if (!stateU || !stateU.length || !isReady()) return false;
    var desiredMpp = computeRequiredMppForCurrentCenter(stateU);
    if (!desiredMpp) return false;
    metersPerPixel = targetMetersPerPixel = desiredMpp;
    return true;
  }

  function updateAutoCamera(stateU) {
    if (!stateU || !stateU.length || !isReady()) return false;

    var desiredMpp = computeRequiredMppForCurrentCenter(stateU);
    if (!desiredMpp) return false;

    // Камера не должна "дышать" на устойчивых траекториях вроде восьмёрки.
    // Поэтому автозум работает только в одну сторону: только если тела уже
    // начинают не помещаться в безопасную область кадра.
    var zoomOutTrigger = 1.015;
    if (desiredMpp <= metersPerPixel * zoomOutTrigger) {
      return false;
    }

    var oldMpp = metersPerPixel;
    targetMetersPerPixel = Math.max(targetMetersPerPixel, desiredMpp * 1.04);

    // Наружу отъезжаем плавно, но достаточно быстро, чтобы тело не вылетело за край.
    metersPerPixel += (targetMetersPerPixel - metersPerPixel) * 0.08;

    if (Math.abs(targetMetersPerPixel - metersPerPixel) < targetMetersPerPixel * 0.002) {
      metersPerPixel = targetMetersPerPixel;
    }

    return Math.abs(metersPerPixel - oldMpp) > oldMpp * 0.0005;
  }

  function resetFixedView(largestDistanceMeters) {
    const VIEWPORT_PADDING_FACTOR = 2.3;
    var safeDistance = Math.max(largestDistanceMeters || 1, 1e-9);

    cameraCenter.x = 0;
    cameraCenter.y = 0;

    if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
      metersPerPixel = VIEWPORT_PADDING_FACTOR * safeDistance / Math.min(canvas.offsetWidth, canvas.offsetHeight);
    } else {
      metersPerPixel = VIEWPORT_PADDING_FACTOR * safeDistance / 600;
    }
    targetMetersPerPixel = metersPerPixel;
  }

  function clearTrails() {
    trailHistory = [[], [], []];
  }

  function clearScene(largestDistanceMeters) {
    clearCanvas();
    clearTrails();
    resetFixedView(largestDistanceMeters);
  }

  function redrawScene(stateU, paleOrbitalPaths, activeTask) {
    if (!isReady()) return;
    clearCanvas();
    renderTrails(paleOrbitalPaths);
    calculateNewPositions(stateU);
    drawBodies();
    if (activeTask) drawLabVisuals(activeTask, stateU);
  }

  function drawOrbitalLines(paleOrbitalPaths) {
    renderTrails(paleOrbitalPaths);
  }

  function setTrailLimitEnabled(flag) {
    trailLimitEnabled = !!flag;
    if (trailLimitEnabled) {
      for (var i = 0; i < trailHistory.length; i++) trimTrail(i);
    }
  }

  function isTrailLimitEnabled() {
    return trailLimitEnabled;
  }

  function drawLabVisuals(activeTask, stateU) {
    if (!activeTask || !activeTask.goal || !isReady()) return;
    const goal = activeTask.goal;

    function toScreenRadius(r) { return r / metersPerPixel; }

    context.save();
    context.lineWidth = 2;

    if (goal.type === "escape") {
      let cIdx = goal.centralBody * 4;
      let center = toScreen(stateU[cIdx], stateU[cIdx+1]);
      context.beginPath();
      context.arc(center.x, center.y, toScreenRadius(goal.escapeRadius), 0, Math.PI*2);
      context.strokeStyle = "rgba(255, 107, 107, 0.5)";
      context.setLineDash([8, 8]);
      context.stroke();
    }
    else if (goal.type === "boundOrbitHold") {
      let cIdx = goal.centralBody * 4;
      let center = toScreen(stateU[cIdx], stateU[cIdx+1]);
      context.setLineDash([4, 6]);
      context.strokeStyle = "rgba(76, 205, 122, 0.4)";
      context.beginPath(); context.arc(center.x, center.y, toScreenRadius(goal.rMin), 0, Math.PI*2); context.stroke();
      context.beginPath(); context.arc(center.x, center.y, toScreenRadius(goal.rMax), 0, Math.PI*2); context.stroke();

      context.beginPath();
      context.arc(center.x, center.y, toScreenRadius(goal.rMax), 0, Math.PI*2);
      context.arc(center.x, center.y, toScreenRadius(goal.rMin), 0, Math.PI*2, true);
      context.fillStyle = "rgba(76, 205, 122, 0.05)";
      context.fill();
    }
    else if (goal.type === "lagrangeHold") {
      let aIdx = goal.primaryA * 4; let bIdx = goal.primaryB * 4;
      let cA = toScreen(stateU[aIdx], stateU[aIdx+1]);
      let cB = toScreen(stateU[bIdx], stateU[bIdx+1]);
      let dx = stateU[bIdx] - stateU[aIdx];
      let dy = stateU[bIdx+1] - stateU[aIdx+1];
      let dist = Math.sqrt(dx*dx + dy*dy);

      context.setLineDash([2, 8]);
      context.beginPath(); context.arc(cA.x, cA.y, toScreenRadius(dist), 0, Math.PI*2);
      context.strokeStyle = "rgba(255, 139, 34, 0.2)"; context.stroke();
      context.beginPath(); context.arc(cB.x, cB.y, toScreenRadius(dist), 0, Math.PI*2);
      context.strokeStyle = "rgba(108, 129, 255, 0.2)"; context.stroke();
    }
    else if (goal.type === "checkpoints" && activeTask._checkpoints) {
      context.setLineDash([]);
      activeTask._checkpoints.forEach(function(cp) {
        let pos = toScreen(cp.x, cp.y);
        let r = toScreenRadius(cp.r);
        context.beginPath();
        context.arc(pos.x, pos.y, r, 0, Math.PI*2);
        if (cp.collected) {
          context.fillStyle = "rgba(76, 205, 122, 0.4)";
          context.strokeStyle = "rgba(76, 205, 122, 0.9)";
          context.fill();
        } else {
          context.fillStyle = "rgba(123, 240, 255, 0.15)";
          context.strokeStyle = "rgba(123, 240, 255, 0.9)";
          context.shadowBlur = 15;
          context.shadowColor = "#7bf0ff";
          context.fill();
        }
        context.stroke();
        context.shadowBlur = 0;
      });
    }
    context.restore();
  }

  function showCanvasNotSupportedMessage() {
    document.getElementById("ThreeBodyProblem-notSupportedMessage").style.display ='block';
  }

  function fitToContainer() {
    var container = document.querySelector(".ThreeBodyProblem-container");
    canvasHeight = container.clientHeight;
    canvas.style.width = '100%';
    canvas.style.height = canvasHeight + 'px';
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function initCanvas() {
    canvas = document.querySelector(".ThreeBodyProblem-canvas");
    if (!(window.requestAnimationFrame && canvas && canvas.getContext)) { return true; }
    context = canvas.getContext("2d");
    if (!context) { return true; }
    return false;
  }

  function applyCircleModeStyles() {
    var container = document.querySelector(".ThreeBodyProblem-container");
    if (circlesMode) {
      container.classList.add("is-circles-mode");
      var colorsDot = colors.orbitalPaths;
      for (var i=0; i<bodyElements.length; i++) {
        var el = bodyElements[i];
        el.classList.add("as-circle");
        el.style.backgroundColor = colorsDot[i % colorsDot.length];
      }
    } else {
      container.classList.remove("is-circles-mode");
      for (var j=0; j<bodyElements.length; j++) {
        var bodyEl = bodyElements[j];
        bodyEl.classList.remove("as-circle");
        bodyEl.style.backgroundColor = "transparent";
      }
    }
  }

  function setCircleMode(flag) {
    circlesMode = !!flag;
    applyCircleModeStyles();
  }

  function init(success) {
    if (initCanvas()) { showCanvasNotSupportedMessage(); return; }
    fitToContainer();
    var earthElement = document.querySelector(".ThreeBodyProblem-earth");
    var sunElement = document.querySelector(".ThreeBodyProblem-sun");
    var jupiterElement = document.querySelector(".ThreeBodyProblem-jupiter");
    bodyElements = [sunElement, earthElement, jupiterElement];
    applyCircleModeStyles();
    success();
  }

  function getBoundaries() {
    const paddingPixels = 10;
    var effectiveWidth = canvas.width - (paddingPixels * 2);
    var middleX = effectiveWidth / 2;
    var middleY = canvas.height / 2;
    return {
      x_min: cameraCenter.x - middleX * metersPerPixel,
      x_max: cameraCenter.x + middleX * metersPerPixel,
      y_min: cameraCenter.y - middleY * metersPerPixel,
      y_max: cameraCenter.y + middleY * metersPerPixel
    };
  }

  return {
    fitToContainer: fitToContainer,
    drawOrbitalLines: drawOrbitalLines,
    drawBodies: drawBodies,
    updateObjectSizes: updateObjectSizes,
    clearScene: clearScene,
    clearTrails: clearTrails,
    resetTrails: clearTrails,
    resetFixedView: resetFixedView,
    fitViewToState: snapZoomToState,
    updateAutoCamera: updateAutoCamera,
    recordTrailPoint: recordTrailPoint,
    redrawScene: redrawScene,
    calculateNewPositions: calculateNewPositions,
    init: init,
    getBoundaries: getBoundaries,
    setTrailLimitEnabled: setTrailLimitEnabled,
    isTrailLimitEnabled: isTrailLimitEnabled,
    setCircleMode: setCircleMode,
    drawLabVisuals: drawLabVisuals,
    isReady: isReady
  };
})();
