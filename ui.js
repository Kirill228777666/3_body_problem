// CSS Helper функции
var cssHelper = (function(){
  function hasClass(element, className) {
    return (' ' + element.className + ' ').indexOf(' ' + className + ' ') > -1;
  }
  function removeClass(element, className) {
    element.className = element.className.replace(new RegExp('(?:^|\\s)' + className + '(?:\\s|$)'), ' ').trim();
  }
  function addClass(element, className) {
    if (hasClass(element, className)) return;
    element.className = (element.className + " " + className).trim();
  }
  return { hasClass: hasClass, removeClass: removeClass, addClass: addClass };
})();

// Симуляции и пресеты
var simulations = (function(){
  var content = { didChangeModel: null };
  var vigure8Position = {x: 0.97000436, y: -0.24308753};
  var vigure8Velocity = {x: -0.93240737, y: -0.86473146};
  
  function polarFromCartesian(coordinates) {
    var angle = (coordinates.x === 0 && coordinates.y === 0) ? 0 : Math.atan2(coordinates.y, coordinates.x); 
    return { r: Math.sqrt(coordinates.x * coordinates.x + coordinates.y * coordinates.y), theta: angle };
  }
  
  var allPresets = {
    "FigureEight": {
      name: "FigureEight",
      dimensionless: true,
      masses: [1, 1, 1],
      massSlider: { min: 0.1, max: 5, power: 3 },
      timeScaleFactor: 1,
      timeScaleFactorSlider: { min: 0.00, max: 20, power: 1 },
      positions: [
        polarFromCartesian(vigure8Position),
        polarFromCartesian({x: -vigure8Position.x, y: -vigure8Position.y}),
        polarFromCartesian({x: 0, y: 0})
      ],
      velocities: [
        polarFromCartesian({x: -vigure8Velocity.x / 2, y: -vigure8Velocity.y/2}),
        polarFromCartesian({x: -vigure8Velocity.x / 2, y: -vigure8Velocity.y/2}),
        polarFromCartesian(vigure8Velocity)
      ]
    },
    "SunEarthJupiter": {
      name: "SunEarthJupiter",
      masses: [1.98855e30, 5.972e24, 1.898e27],
      densities: [0.01, 0.01, 0.01], 
      massSlider: { min: 3e10, max: 3e31, power: 3 },
      timeScaleFactor: 3600 * 24 * 30,
      timeScaleFactorSlider: { min: 0, max: 3600 * 24 * 365 * 1000, power: 5 },
      positions: [
        { r: 0, theta: 0 },
        { r: 1.496e11, theta: 0 },
        { r: 7.78e11, theta: 0 }
      ],
      velocities: [
        { r: 0, theta: Math.PI/2 },
        { r: 30e3, theta: Math.PI/2 },
        { r: 13.1e3, theta: Math.PI/2 }
      ]
    },
    "LagrangePoint5": {
      name: "LagrangePoint5",
      masses: [1.98855e30, 5.972e24, 1.898e28], 
      densities: [0.001, 0.0001, 0.0001],
      paleOrbitalPaths: true,
      massSlider: { min: 3e10, max: 3e31, power: 5 },
      timeScaleFactor: 3600 * 24 * 30,
      timeScaleFactorSlider: { min: 0, max: 3600 * 24 * 365 * 1500, power: 5 },
      positions: [
        { r: 0, theta: 0 },
        { r: 7.5e11, theta: -Math.PI/3 - Math.PI/10 }, 
        { r: 7.78e11, theta: 0 } 
      ],
      velocities: [
        { r: 0, theta: Math.PI/2 },
        { r: 13.3e3, theta: Math.PI/6 - Math.PI/10 },
        { r: 13.1e3, theta: Math.PI/2 }
      ]
    },
    "Kepler16": {
      name: "Kepler16",
      masses: [0.6897 * 1.98855e30, 0.20255 * 1.98855e30, 0.3333 * 1.898e27], 
      massSlider: { min: 3e10, max: 3e31, power: 5 },
      timeScaleFactor: 3600 * 24 * 10, 
      timeScaleFactorSlider: { min: 0, max: 3600 * 24 * 365 * 15, power: 5 },
      positions: [ 
        { r: (0.20255 * 0.22431 * 1.496e11) / (0.6897 + 0.20255), theta: 0 },
        { r: (0.6897 * 0.22431 * 1.496e11) / (0.6897 + 0.20255), theta: Math.PI },
        { r: 0.7048 * 1.496e11, theta: 0 }
      ],
      velocities: [ 
        { r: 13e3, theta: Math.PI/2 },
        { r: 44e3, theta: 3*Math.PI/2 },
        { r: 33e3, theta: Math.PI/2 }
      ]
    },
    "Chaotic": {
      name: "Chaotic",
      dimensionless: true,
      masses: [1, 1, 1],
      massSlider: { min: 0.1, max: 10, power: 3 },
      timeScaleFactor: 3.9335,
      timeScaleFactorSlider: { min: 0.00, max: 20, power: 1 },
      positions: [
        { r: 1, theta: 0 },
        { r: 1, theta: 2*Math.PI/3 },
        { r: 1, theta: 4*Math.PI/3 }
      ],
      velocities: [
        { r: 0.55, theta: Math.PI/2 },
        { r: 0.55, theta: 2*Math.PI/3 + Math.PI/2 },
        { r: 0.55, theta: 4*Math.PI/3 + Math.PI/2 }
      ]
    }
  };
  
  function didClickElement(element) {
    if (!element) return;
    if (!cssHelper.hasClass(element, "ThreeBodyProblem-preset")) {
      if (element.parentElement) didClickElement(element.parentElement);
      return;
    }
    var name = element.getAttribute("data-name");
    var preset = allPresets[name];
    if (content.didChangeModel !== null && preset) { content.didChangeModel(preset); }
    var presetElements = document.querySelectorAll(".ThreeBodyProblem-preset");
    for (var iPreset = 0; iPreset < presetElements.length; iPreset++) {
      cssHelper.removeClass(presetElements[iPreset], 'ThreeBodyProblem-button--isSelected');
    }
    cssHelper.addClass(element, "ThreeBodyProblem-button--isSelected");
  }
  
  function didClick(e) {
    if (!e) { e = window.event; }
    if (e.target) didClickElement(e.target);
  }
  
  function init() {
    var presetElements = document.querySelectorAll(".ThreeBodyProblem-preset");
    for (var iPreset = 0; iPreset < presetElements.length; iPreset++) {
      presetElements[iPreset].onclick = didClick;
    }
    return allPresets.FigureEight; 
  }
  
  return { init: init, content: content };
})();

// Кривая нечетной степени
var oddPowerCurve = (function(){
  function calcualteL(defaultOutput, power) {
    if (power === 0) return 1;
    return -Math.pow(defaultOutput, 1 / power);
  }
  function calcualteA(defaultOutput, power) {
    if (power === 0) return 1;
    return Math.pow(1 - defaultOutput, 1 / power) - calcualteL(defaultOutput, power);
  }
  function sliderInputValue(defaultOutput, output, power) {
    if (power === 0) return 1;
    var a = calcualteA(defaultOutput, power);
    if (a === 0) { a = 1; }
    var l = calcualteL(defaultOutput, power);
    var sign = (output - defaultOutput) < 0 ? -1 : 1;
    return (sign * Math.pow(Math.abs(output - defaultOutput), 1 / power) - l) / a;
  }
  function sliderOutputValue(defaultOutput, input, power) {
    if (power === 0) return 1;
    var a = calcualteA(defaultOutput, power);
    var l = calcualteL(defaultOutput, power);
    var result = Math.pow(a * input + l, power) + defaultOutput;
    if (result < 0) { result = 0; }
    return result;
  }
  return { sliderInputValue: sliderInputValue, sliderOutputValue: sliderOutputValue };
})();

// Пользовательский ввод
var userInput = (function(){
  var sliderLabelElement = document.querySelector(".ThreeBodyProblem-sliderLabel");
  var restartButton = document.querySelector(".ThreeBodyProblem-reload");
  var mass1Button = document.querySelector(".ThreeBodyProblem-mass1Button");
  var mass2Button = document.querySelector(".ThreeBodyProblem-mass2Button");
  var mass3Button = document.querySelector(".ThreeBodyProblem-mass3Button");
  var speedButton = document.querySelector(".ThreeBodyProblem-speedButton");
  var softeningButton = document.querySelector(".ThreeBodyProblem-softeningButton");
  var sliderElement = document.querySelector(".ThreeBodyProblem-slider");
  var slider, currentSlider = "mass", currentMassSliderIndex = 0, currentModel;
  
  function getSofteningSliderSettings(isDimensionless) {
    if (isDimensionless) {
      return { min: -3, max: 0, power: 1, defaultLogEpsilon: -1 }; 
    } else {
      return { min: 5, max: 8, power: 1, defaultLogEpsilon: Math.log10(Math.sqrt(4.06e13)) }; 
    }
  }
  
  function calculateDefaultSliderOutput(sliderSettings) {
    var defaultValue = getCurrentSimulationValue(currentModel); 
    var min = sliderSettings.min;
    var max = sliderSettings.max;
    if (min === undefined || max === undefined || min === max) return 0.5;
    var defaultOutput = (defaultValue - min) / (max - min);
    return Math.max(0, Math.min(1, defaultOutput));
  }
  
  function didUpdateSlider(sliderValue) {
    var sliderText, sliderSettings = getCurrentSliderSettings();
    var newValue;
    if (sliderSettings.power !== undefined && sliderSettings.power !== 1) {
      if (sliderSettings.power % 2 === 1) {
        var defaultOutput = calculateDefaultSliderOutput(sliderSettings);
        sliderValue = oddPowerCurve.sliderOutputValue(defaultOutput, sliderValue, sliderSettings.power);
      } else {
        sliderValue = Math.pow(sliderValue, sliderSettings.power);
      }
      sliderValue = Math.max(0, Math.min(1, sliderValue));
    }
    newValue = sliderSettings.min + (sliderSettings.max - sliderSettings.min) * sliderValue;
    
    if (currentSlider === "mass") {
      newValue = roundSliderValue(newValue);
      physics.initialConditions.masses[currentMassSliderIndex] = newValue;
      graphics.updateObjectSizes(physics.calculateDiameters());
      sliderText = formatMassForSlider(newValue);
    } else if (currentSlider === "speed") {
      newValue = roundSliderValue(newValue);
      physics.initialConditions.timeScaleFactor = newValue;
      sliderText = formatTimescaleForSlider(newValue);
    } else if (currentSlider === "softening") {
      var epsilon = Math.pow(10, newValue); 
      physics.initialConditions.softeningParameterSquared = epsilon * epsilon;
      sliderText = formatSofteningForSlider(epsilon);
    } else {
       sliderText = "Unknown Slider";
    }
    sliderLabelElement.innerText = sliderText;
  }
  
  function getCurrentSliderSettings() {
    if (currentSlider === "mass") {
      return physics.initialConditions.massSlider;
    } else if (currentSlider === "speed") {
      return physics.initialConditions.timeScaleFactorSlider;
    } else if (currentSlider === "softening") {
      return getSofteningSliderSettings(physics.initialConditions.dimensionless);
    }
    return { min: 0, max: 1 };
  }
  
  function roundSliderValue(value) {
    return Math.round(value * 10000) / 10000;
  }
  
  function roundSliderValueText(value) {
    return parseFloat(roundSliderValue(value)).toFixed(4);
  }
  
  function formatSofteningForSlider(epsilon) {
      var formatted = epsilon.toExponential(4);
      var unit = physics.initialConditions.dimensionless ? "" : " m";
      return "Softening ε: " + formatted + unit;
  }
  
  function bodyNameFromIndex(index) {
    var modelName = physics.initialConditions.currentPresetName;
    var isCirclesMode = modelName === "FigureEight" || modelName === "Chaotic";
    if (isCirclesMode) {
      switch(index) {
        case 0: return "Red Body";
        case 1: return "Blue Body";
        default: return "Green Body";
      }
    } else {
      switch(index) {
        case 0: return "the Sun";
        case 1: return "the Earth";
        default: return "Jupiter";
      }
    }
  }
  
  function formatMassForSlider(mass) {
    var formatted = roundSliderValueText(mass);
    if (mass > 10000 || mass < 0.001 && mass !== 0) { formatted = mass.toExponential(4); }
    formatted = "Mass of " + bodyNameFromIndex(currentMassSliderIndex) + " : " + formatted;
    if (physics.initialConditions.dimensionless !== true) { formatted += " kg"; }
    return formatted;
  }
  
  function formatTimescaleForSlider(value) {
    var timeHumanized = timeHumanReadable(value);
    var formatted = roundSliderValueText(timeHumanized.value);
    if (timeHumanized.value > 10000 || timeHumanized.value < 0.001 && timeHumanized.value !== 0) { formatted = timeHumanized.value.toExponential(4); }
    formatted = "Simulation speed: " + formatted + " " + timeHumanized.unit + " per second";
    return formatted;
  }
  
  function timeHumanReadable(time) {
    var result = { unit: 'second', value: time };
    if (result.value < 60) return result;
    result.value /= 60; result.unit = 'minute';
    if (result.value < 60) return result;
    result.value /= 60; result.unit = 'hour';
    if (result.value < 24) return result;
    result.value /= 24; result.unit = 'day';
    if (result.value < 365) return result;
    result.value /= 365; result.unit = 'year';
    if (result.value < 100) return result;
    result.value /= 100; result.unit = 'century';
    if (result.value < 10) return result;
    result.value = Math.floor(result.value * 10) / 10; 
    return result;
  }
  
  function didClickRestart() {
    physics.resetStateToInitialConditions();
    graphics.clearScene(physics.largestDistanceMeters());
    graphics.updateObjectSizes(physics.calculateDiameters());
    return false;
  }
  
  function getCurrentSimulationValue() {
    if (currentSlider === "mass") {
       return physics.initialConditions.masses[currentMassSliderIndex];
    } else if (currentSlider === "speed") {
      return physics.initialConditions.timeScaleFactor;
    } else if (currentSlider === "softening") {
      var settings = getSofteningSliderSettings(physics.initialConditions.dimensionless);
      var currentEpsilonSq = physics.initialConditions.softeningParameterSquared;
      var epsilon;
      if (currentEpsilonSq !== undefined && currentEpsilonSq > 0) {
          epsilon = Math.sqrt(currentEpsilonSq);
      } else { 
          epsilon = Math.pow(10, settings.defaultLogEpsilon);
          physics.initialConditions.softeningParameterSquared = epsilon * epsilon; 
      }
      return Math.log10(epsilon); 
    }
    return 0;
  }
  
  function resetSlider() {
    cssHelper.removeClass(sliderElement, "ThreeBodyProblem-sliderSun");
    cssHelper.removeClass(sliderElement, "ThreeBodyProblem-sliderEarth");
    cssHelper.removeClass(sliderElement, "ThreeBodyProblem-sliderJupiter");
    var sliderSettings = getCurrentSliderSettings();
    var simulationValue = getCurrentSimulationValue();
    var sliderText;
    
    if (currentSlider === "mass") {
      sliderText = formatMassForSlider(simulationValue);
      switch(currentMassSliderIndex) {
        case 0: cssHelper.addClass(sliderElement, "ThreeBodyProblem-sliderSun"); break;
        case 1: cssHelper.addClass(sliderElement, "ThreeBodyProblem-sliderEarth"); break;
        default: cssHelper.addClass(sliderElement, "ThreeBodyProblem-sliderJupiter");
      }
    } else if (currentSlider === "speed") {
      sliderText = formatTimescaleForSlider(simulationValue);
    } else if (currentSlider === "softening") {
      var epsilon = Math.pow(10, simulationValue); 
      sliderText = formatSofteningForSlider(epsilon);
    } else {
       sliderText = "Unknown Slider";
    }
    sliderLabelElement.innerText = sliderText;
    var sliderPosition;
    if (sliderSettings.min !== undefined && sliderSettings.max !== undefined && sliderSettings.min !== sliderSettings.max) {
      sliderPosition = (simulationValue - sliderSettings.min) / (sliderSettings.max - sliderSettings.min);
      sliderPosition = Math.max(0, Math.min(1, sliderPosition));
    } else {
      sliderPosition = 0.5;
    }
    if (sliderSettings.power !== undefined && sliderSettings.power !== 1) {
      if (sliderSettings.power % 2 === 1) {
         var defaultOutputPreset = calculateDefaultSliderOutput(sliderSettings);
         sliderPosition = oddPowerCurve.sliderInputValue(defaultOutputPreset, sliderPosition, sliderSettings.power);
      } else {
        sliderPosition = Math.pow(sliderPosition, 1 / sliderSettings.power);
      }
      sliderPosition = Math.max(0, Math.min(1, sliderPosition));
    }
    if (slider && typeof slider.changePosition === 'function') {
        slider.changePosition(sliderPosition);
        slider.previousSliderValue = sliderPosition;
    }
  }
  
  function didChangeModel(model) {
    currentModel = model;
    physics.changeInitialConditions(currentModel);
    var sunElement = document.querySelector(".ThreeBodyProblem-sun");
    var earthElement = document.querySelector(".ThreeBodyProblem-earth");
    var jupiterElement = document.querySelector(".ThreeBodyProblem-jupiter");
    var bodies = [sunElement, earthElement, jupiterElement];
    var colorClasses = ["ThreeBodyProblem-sun--circle", "ThreeBodyProblem-earth--circle", "ThreeBodyProblem-jupiter--circle"];
    var useCircles = model.name === "FigureEight" || model.name === "Chaotic";

    bodies.forEach(function(body, index) {
      cssHelper.removeClass(body, "ThreeBodyProblem-body--circle");
      cssHelper.removeClass(body, colorClasses[index]); 
    });

    if (useCircles) {
      bodies.forEach(function(body, index) {
        cssHelper.addClass(body, "ThreeBodyProblem-body--circle");
        cssHelper.addClass(body, colorClasses[index]); 
      });
    }

    didClickRestart();
    resetSlider();
  }
  
  function didClickMass1() { currentSlider = "mass"; currentMassSliderIndex = 0; resetSlider(); return false; }
  function didClickMass2() { currentSlider = "mass"; currentMassSliderIndex = 1; resetSlider(); return false; }
  function didClickMass3() { currentSlider = "mass"; currentMassSliderIndex = 2; resetSlider(); return false; }
  function didClickSpeed() { currentSlider = "speed"; currentMassSliderIndex = 0; resetSlider(); return false; }
  function didClickSoftening() { currentSlider = "softening"; currentMassSliderIndex = 0; resetSlider(); return false; }
  
  function init() {
    currentModel = simulations.init();
    physics.changeInitialConditions(currentModel); 
    simulations.content.didChangeModel = didChangeModel;
    slider = SickSlider(".ThreeBodyProblem-slider");
    slider.onSliderChange = didUpdateSlider;
    resetSlider(); 
    restartButton.onclick = didClickRestart;
    mass1Button.onclick = didClickMass1;
    mass2Button.onclick = didClickMass2;
    mass3Button.onclick = didClickMass3;
    speedButton.onclick = didClickSpeed;
    softeningButton.onclick = didClickSoftening;
    
    var pauseButton = document.querySelector('.ThreeBodyProblem-pause');
    if (pauseButton) {
      pauseButton.onclick = function() {
        if (simulation.isPaused()) {
          simulation.resume();
          pauseButton.textContent = 'Пауза';
        } else {
          simulation.pause();
          pauseButton.textContent = 'Продолжить';
        }
        return false;
      };
    }
  }
  
  return { init: init };
})();

// Инициализация пользовательского интерфейса
userInput.init();

// Инициализация стилей для круговых тел
(function() {
  var currentPresetName = physics.initialConditions.currentPresetName;
  var useCircles = currentPresetName === "FigureEight" || currentPresetName === "Chaotic";
  var sunElement = document.querySelector(".ThreeBodyProblem-sun");
  var earthElement = document.querySelector(".ThreeBodyProblem-earth");
  var jupiterElement = document.querySelector(".ThreeBodyProblem-jupiter");
  var bodies = [sunElement, earthElement, jupiterElement];
  var colorClasses = ["ThreeBodyProblem-sun--circle", "ThreeBodyProblem-earth--circle", "ThreeBodyProblem-jupiter--circle"];

  bodies.forEach(function(body, index) {
      cssHelper.removeClass(body, "ThreeBodyProblem-body--circle");
      cssHelper.removeClass(body, colorClasses[index]);
  });

  if (useCircles) {
    bodies.forEach(function(body, index) {
      cssHelper.addClass(body, "ThreeBodyProblem-body--circle");
      cssHelper.addClass(body, colorClasses[index]);
    });
  }
})();

// Управление загрузчиком
setTimeout(function(){
  var loaderWrapper = document.getElementById('loader-wrapper');
  if(loaderWrapper){
    loaderWrapper.classList.add('hidden');
    setTimeout(function(){
      if(loaderWrapper.parentNode){
        loaderWrapper.parentNode.removeChild(loaderWrapper);
      }
    }, 500); 
  }
}, 3000);

// Запуск симуляции
setTimeout(function(){
  var container = document.querySelector('.ThreeBodyProblem-container');
  container.classList.add('visible');
  simulation.start();
}, 5000);

// Прокси для SickSlider
(function(){
  var original = window.SickSlider;
  if (!original) return;
  window.SickSlider = function(selector){
    var inst = original(selector);
    try {
      return new Proxy(inst, {
        set: function(target, prop, value){
          if (prop === 'onSliderChange' && typeof value === 'function') {
            var wrapped = function(v){
              var labelEl = document.querySelector('.ThreeBodyProblem-sliderLabel');
              var text = labelEl ? labelEl.textContent.trim() : '';
              var isMass = /^Mass\b/i.test(text);
              if (isMass) { v = 1 - v; } 
              value(v);
            };
            return Reflect.set(target, prop, wrapped);
          }
          return Reflect.set(target, prop, value);
        }
      });
    } catch(e) {
      return inst;
    }
  };
})();
