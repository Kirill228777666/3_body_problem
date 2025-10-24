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
      bodyElemenets = [],
      currentBodySizes = [10, 10, 10];

  function drawBody(position, size, bodyElement) {
    var newLeft = position.x - (size / 2);
    var newTop = position.y - (size / 2);

    bodyElement.style.left = newLeft + "px";
    bodyElement.style.top = newTop + "px";
  }

  function updateObjectSizes(sizes) {
    for (var iBody = 0; iBody < sizes.length; iBody++) {
      currentBodySizes[iBody] = sizes[iBody] / metersPerPixel;
      if (currentBodySizes[iBody] < minimumSizePixels) { currentBodySizes[iBody] = minimumSizePixels; }
      if (currentBodySizes[iBody] > maximumSizePixels) { currentBodySizes[iBody] = maximumSizePixels; }
      bodyElemenets[iBody].style.width = currentBodySizes[iBody] + "px";
      bodyElemenets[iBody].style.height = currentBodySizes[iBody] + "px";
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
    context.moveTo(previousPosition.x, previousPosition.y);
    context.lineTo(newPosition.x, newPosition.y);
    context.stroke();
    previousPosition.x = newPosition.x;
    previousPosition.y = newPosition.y;
  }
  
  function calculateNewPositions(stateU) { 
    const middleX = Math.floor(canvas.width / 2);
    const middleY = Math.floor(canvas.height / 2);
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
      if (bodyElemenets[iBody] && currentBodySizes[iBody] !== undefined) {
        drawBody(bodyPosition, currentBodySizes[iBody], bodyElemenets[iBody]);
      }
    }
  }
  
  function drawOrbitalLines(paleOrbitalPaths) {
    for (var iBody = 0; iBody < bodyPositions.length; iBody++) {
      var orbitalPathColors = paleOrbitalPaths ? colors.paleOrbitalPaths : colors.orbitalPaths;
      drawOrbitalLine(bodyPositions[iBody], previousBodyPositions[iBody], orbitalPathColors[iBody]);
    }
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
  
  function init(success) {
    if (initCanvas()) { showCanvasNotSupportedMessage(); return; }
    fitToContainer();
    var earthElement = document.querySelector(".ThreeBodyProblem-earth");
    var sunElement = document.querySelector(".ThreeBodyProblem-sun");
    var jupiterElement = document.querySelector(".ThreeBodyProblem-jupiter");
    bodyElemenets = [sunElement, earthElement, jupiterElement];
    success();
  }
  
  function clearScene(largestDistanceMeters) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    previousBodyPositions = [{x: null, y: null}, {x: null, y: null}, {x: null, y: null}];
    if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) { 
      metersPerPixel = 2.3 * largestDistanceMeters / Math.min(canvas.offsetWidth, canvas.offsetHeight);
    } else {
      metersPerPixel = 2.3 * largestDistanceMeters / 600; 
    }
  }
  
  function getBoundaries() {
    const paddingPixels = 10;
    var effectiveWidth = canvas.width - (paddingPixels * 2);
    var middleX = Math.floor(effectiveWidth / 2);
    var middleY = Math.floor(canvas.height / 2);
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
    getBoundaries: getBoundaries
  };
})();
