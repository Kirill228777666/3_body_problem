var graphics = (function() {
  var canvas = null,
      context = null,
      canvasHeight = 600,
      metersPerPixel = 100,
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
      previousBodyPositions = [
        {x: null, y: null},
        {x: null, y: null},
        {x: null, y: null}
      ],
      currentBodySizes = [],
      bodyElements = [],
      approx = null,
      circlesMode = false;

  function drawBody(position, size, bodyElement) {
    bodyElement.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%)`;
  }

  function updateObjectSizes(sizes) {
    for (var iBody = 0; iBody < sizes.length; iBody++) {
      currentBodySizes[iBody] = sizes[iBody] / metersPerPixel;
      if (currentBodySizes[iBody] < minimumSizePixels) { currentBodySizes[iBody] = minimumSizePixels; }
      if (currentBodySizes[iBody] > maximumSizePixels) { currentBodySizes[iBody] = maximumSizePixels; }
      bodyElements[iBody].style.width = currentBodySizes[iBody] + "px";
      bodyElements[iBody].style.height = currentBodySizes[iBody] + "px";
    }
  }

  function drawOrbitalLine(newPosition, previousPosition, color) {
    if (previousPosition.x === null) {
      previousPosition.x = newPosition.x;
      previousPosition.y = newPosition.y;
      return;
    }
    context.beginPath();
    context.strokeStyle = color;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.moveTo(previousPosition.x, previousPosition.y);
    context.lineTo(newPosition.x, newPosition.y);
    context.stroke();
    previousPosition.x = newPosition.x;
    previousPosition.y = newPosition.y;
  }

  function calculateNewPositions(stateU) {
    const middleX = canvas.width / 2;
    const middleY = canvas.height / 2;
    for (var iBody = 0; iBody < stateU.length / 4; iBody++) {
      var bodyStart = iBody * 4;
      var x = stateU[bodyStart + 0];
      var y = stateU[bodyStart + 1];
      bodyPositions[iBody].x = x / metersPerPixel + middleX;
      bodyPositions[iBody].y = -y / metersPerPixel + middleY;
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

  function drawOrbitalLines(paleOrbitalPaths) {
    for (var iBody = 0; iBody < bodyPositions.length; iBody++) {
      var orbitalPathColors = paleOrbitalPaths ? colors.paleOrbitalPaths : colors.orbitalPaths;
      drawOrbitalLine(bodyPositions[iBody], previousBodyPositions[iBody], orbitalPathColors[iBody]);
    }
  }

  function clearScene(largestDistanceMeters) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    previousBodyPositions = [{x: null, y: null}, {x: null, y: null}, {x: null, y: null}];
    const VIEWPORT_PADDING_FACTOR = 2.3;
    if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
      metersPerPixel = VIEWPORT_PADDING_FACTOR * largestDistanceMeters / Math.min(canvas.offsetWidth, canvas.offsetHeight);
    } else {
      metersPerPixel = VIEWPORT_PADDING_FACTOR * largestDistanceMeters / 600;
    }
  }

  function setApproximation(data){ approx = data; }

  function drawApproximationCurve(){
    // Intentionally disabled on the main canvas.
    // The simulation canvas keeps orbital trails permanently, so drawing
    // the quadratic approximation here would accumulate bright tangent-like
    // white segments and visually overwrite the real trajectory.
    // Approximation data is still updated and available for formulas/logging.
    return;
  }

  function drawLabVisuals(activeTask, stateU) {
    if (!activeTask || !activeTask.goal) return;
    const midX = canvas.width / 2;
    const midY = canvas.height / 2;
    const mpp = metersPerPixel;
    const goal = activeTask.goal;

    function toScreen(px, py) {
      return { x: px / mpp + midX, y: -py / mpp + midY };
    }
    function toScreenRadius(r) { return r / mpp; }

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
      for (var i=0; i<bodyElements.length; i++) {
        var el = bodyElements[i];
        el.classList.remove("as-circle");
        el.style.backgroundColor = "transparent";
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
      x_min: -middleX * metersPerPixel,
      x_max: middleX * metersPerPixel,
      y_min: -middleY * metersPerPixel,
      y_max: middleY * metersPerPixel
    };
  }

  return {
    fitToContainer: fitToContainer,
    drawOrbitalLines: drawOrbitalLines,
    drawBodies: drawBodies,
    updateObjectSizes: updateObjectSizes,
    clearScene: clearScene,
    calculateNewPositions: calculateNewPositions,
    init: init,
    getBoundaries: getBoundaries,
    setApproximation: setApproximation,
    drawApproximationCurve: drawApproximationCurve,
    setCircleMode: setCircleMode,
    drawLabVisuals: drawLabVisuals
  };
})();