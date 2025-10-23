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

  function polarFromCartesian(c){
    var angle = (c.x === 0 && c.y === 0) ? 0 : Math.atan2(c.y, c.x);
    return { r: Math.sqrt(c.x*c.x + c.y*c.y), theta: angle };
  }

  var allPresets = {
    "FigureEight": {
      name: "FigureEight",
      dimensionless: true,
      masses: [1,1,1],
      massSlider: { min: 0.1, max: 5, power: 3 },
      timeScaleFactor: 1,
      timeScaleFactorSlider: { min: 0.00, max: 20, power: 1 },
      positions: [
        polarFromCartesian(vigure8Position),
        polarFromCartesian({x:-vigure8Position.x, y:-vigure8Position.y}),
        polarFromCartesian({x:0,y:0})
      ],
      velocities: [
        polarFromCartesian({x:-vigure8Velocity.x/2, y:-vigure8Velocity.y/2}),
        polarFromCartesian({x:-vigure8Velocity.x/2, y:-vigure8Velocity.y/2}),
        polarFromCartesian(vigure8Velocity)
      ]
    },
    "SunEarthJupiter": {
      name: "SunEarthJupiter",
      masses: [1.98855e30, 5.972e24, 1.898e27],
      densities: [0.01,0.01,0.01],
      massSlider: { min: 3e10, max: 3e31, power: 3 },
      timeScaleFactor: 3600*24*30,
      timeScaleFactorSlider: { min: 0, max: 3600*24*365*1000, power: 5 },
      positions: [{r:0,theta:0},{r:1.496e11,theta:0},{r:7.78e11,theta:0}],
      velocities: [{r:0,theta:Math.PI/2},{r:30e3,theta:Math.PI/2},{r:13.1e3,theta:Math.PI/2}]
    },
    "LagrangePoint5": {
      name: "LagrangePoint5",
      masses: [1.98855e30, 5.972e24, 1.898e28],
      densities: [0.001,0.0001,0.0001],
      paleOrbitalPaths: true,
      massSlider: { min: 3e10, max: 3e31, power: 5 },
      timeScaleFactor: 3600*24*30,
      timeScaleFactorSlider: { min: 0, max: 3600*24*365*1500, power: 5 },
      positions: [{r:0,theta:0},{r:7.5e11,theta:-Math.PI/3 - Math.PI/10},{r:7.78e11,theta:0}],
      velocities: [{r:0,theta:Math.PI/2},{r:13.3e3,theta:Math.PI/6 - Math.PI/10},{r:13.1e3,theta:Math.PI/2}]
    },
    "Kepler16": {
      name: "Kepler16",
      masses: [0.6897*1.98855e30, 0.20255*1.98855e30, 0.3333*1.898e27],
      massSlider: { min: 3e10, max: 3e31, power: 5 },
      timeScaleFactor: 3600*24*10,
      timeScaleFactorSlider: { min: 0, max: 3600*24*365*15, power: 5 },
      positions: [
        { r:(0.20255*0.22431*1.496e11)/(0.6897+0.20255), theta:0 },
        { r:(0.6897*0.22431*1.496e11)/(0.6897+0.20255), theta:Math.PI },
        { r:0.7048*1.496e11, theta:0 }
      ],
      velocities: [{r:13e3,theta:Math.PI/2},{r:44e3,theta:3*Math.PI/2},{r:33e3,theta:Math.PI/2}]
    },
    "Chaotic": {
      name: "Chaotic",
      dimensionless: true,
      masses: [1,1,1],
      massSlider: { min: 0.1, max: 10, power: 3 },
      timeScaleFactor: 3.9335,
      timeScaleFactorSlider: { min: 0.00, max: 20, power: 1 },
      positions: [{r:1,theta:0},{r:1,theta:2*Math.PI/3},{r:1,theta:4*Math.PI/3}],
      velocities: [{r:0.55,theta:Math.PI/2},{r:0.55,theta:2*Math.PI/3+Math.PI/2},{r:0.55,theta:4*Math.PI/3+Math.PI/2}]
    }
  };

  function didClickElement(el){
    if(!el) return;
    if(!cssHelper.hasClass(el,"ThreeBodyProblem-preset")){
      if(el.parentElement) didClickElement(el.parentElement);
      return;
    }
    var name = el.getAttribute("data-name");
    var preset = allPresets[name];
    if (content.didChangeModel && preset) { content.didChangeModel(preset); }
    var presetEls = document.querySelectorAll(".ThreeBodyProblem-preset");
    for (var i=0;i<presetEls.length;i++) cssHelper.removeClass(presetEls[i],'ThreeBodyProblem-button--isSelected');
    cssHelper.addClass(el,"ThreeBodyProblem-button--isSelected");
  }

  function didClick(e){ e = e || window.event; if (e.target) didClickElement(e.target); }

  function init(){
    var presetEls = document.querySelectorAll(".ThreeBodyProblem-preset");
    for (var i=0;i<presetEls.length;i++) presetEls[i].onclick = didClick;
    return allPresets.FigureEight;
  }

  return { init:init, content:content };
})();

// Кривая нечетной степени
var oddPowerCurve = (function(){
  function calcualteL(d,p){ if(p===0)return 1; return -Math.pow(d,1/p); }
  function calcualteA(d,p){ if(p===0)return 1; return Math.pow(1-d,1/p)-calcualteL(d,p); }
  function sliderInputValue(d,out,p){
    if(p===0) return 1;
    var a = calcualteA(d,p); if(a===0){a=1;}
    var l = calcualteL(d,p);
    var sign = (out-d)<0 ? -1 : 1;
    return (sign*Math.pow(Math.abs(out-d),1/p)-l)/a;
  }
  function sliderOutputValue(d,input,p){
    if(p===0) return 1;
    var a = calcualteA(d,p), l = calcualteL(d,p);
    var res = Math.pow(a*input+l,p)+d;
    if(res<0) res=0;
    return res;
  }
  return { sliderInputValue:sliderInputValue, sliderOutputValue:sliderOutputValue };
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
  var slider, currentSlider="mass", currentMassSliderIndex=0, currentModel;

  // ---------- УТИЛИТЫ ДЛЯ КНОПОК ----------
  function removeAllTextNodes(node){
    var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
    var toRemove = [];
    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue.trim() !== '') toRemove.push(walker.currentNode);
    }
    toRemove.forEach(function(n){ n.parentNode.removeChild(n); });
  }

  function ensureDot(btn, color, title){
    var dot = btn.querySelector('.tbp-dot');
    if (!dot) {
      dot = document.createElement('span');
      dot.className = 'tbp-dot';
      btn.appendChild(dot);
    }
    dot.setAttribute('title', title || '');
    dot.setAttribute('aria-label', title || '');
    dot.style.display = 'inline-block';
    dot.style.width = '14px';
    dot.style.height = '14px';
    dot.style.borderRadius = '50%';
    dot.style.verticalAlign = 'middle';
    dot.style.background = color;
  }

  function stripToOnlyDot(btn){
    // Скрыть любые IMG
    var imgs = btn.querySelectorAll('img, svg, picture, canvas');
    imgs.forEach(function(img){ img.style.display = 'none'; });

    // Удалить все видимые подписи
    removeAllTextNodes(btn);

    // Убрать отступы вокруг (на случай встроенных <span>)
    var nonDotChildren = btn.querySelectorAll(':scope > *:not(.tbp-dot)');
    nonDotChildren.forEach(function(ch){
      // оставляем структуру, но не показываем текст
      if (ch.tagName !== 'IMG' && ch.tagName !== 'SVG' && ch.tagName !== 'PICTURE' && !ch.classList.contains('tbp-dot')) {
        ch.style.display = 'none';
      }
    });

    // Сброс «ссылочного» вида
    btn.style.textDecoration = 'none';
    btn.style.color = 'inherit';
  }

  function restorePlanetLook(btn){
    // Показать изображения обратно
    var imgs = btn.querySelectorAll('img, svg, picture, canvas');
    imgs.forEach(function(img){ img.style.display = ''; });

    // Убрать кружок, если был
    var dot = btn.querySelector('.tbp-dot');
    if (dot && dot.parentNode) dot.parentNode.removeChild(dot);

    // Вернуть текст если он есть в разметке (мы ничего не добавляем)
    btn.style.textDecoration = '';
    btn.style.color = '';
    // Ничего не вставляем текстом — используем то, что было изначально (иконки/картинки/подписи вернутся сами).
  }

  function updateMassButtonsAppearance(useCircles){
    var btns = [mass1Button, mass2Button, mass3Button];
    var colors = ['#e53935','#1e88e5','#43a047']; // красный, синий, зелёный
    var titles = ['Красное тело','Синее тело','Зелёное тело'];

    btns.forEach(function(btn, i){
      if (!btn) return;
      if (useCircles) {
        // делаем ИКОНКУ-ТОЧКУ БЕЗ ТЕКСТА
        ensureDot(btn, colors[i], titles[i]);
        stripToOnlyDot(btn);
      } else {
        // возвращаем «планетный» вид (картинки на кнопках)
        restorePlanetLook(btn);
      }
    });
  }
  // ---------- КОНЕЦ УТИЛИТ ----------

  function getSofteningSliderSettings(isDimensionless){
    return isDimensionless
      ? { min: -3, max: 0, power: 1, defaultLogEpsilon: -1 }
      : { min: 5, max: 8, power: 1, defaultLogEpsilon: Math.log10(Math.sqrt(4.06e13)) };
  }

  function calculateDefaultSliderOutput(sliderSettings){
    var def = getCurrentSimulationValue(currentModel);
    var min = sliderSettings.min, max = sliderSettings.max;
    if (min===undefined || max===undefined || min===max) return 0.5;
    var out = (def - min) / (max - min);
    return Math.max(0, Math.min(1, out));
  }

  function didUpdateSlider(sliderValue){
    var sliderSettings = getCurrentSliderSettings();
    if (sliderSettings.power !== undefined && sliderSettings.power !== 1) {
      if (sliderSettings.power % 2 === 1) {
        var defOut = calculateDefaultSliderOutput(sliderSettings);
        sliderValue = oddPowerCurve.sliderOutputValue(defOut, sliderValue, sliderSettings.power);
      } else {
        sliderValue = Math.pow(sliderValue, sliderSettings.power);
      }
      sliderValue = Math.max(0, Math.min(1, sliderValue));
    }

    var newValue = sliderSettings.min + (sliderSettings.max - sliderSettings.min) * sliderValue;
    var sliderText;

    if (currentSlider === "mass") {
      newValue = Math.round(newValue*10000)/10000;
      physics.initialConditions.masses[currentMassSliderIndex] = newValue;
      graphics.updateObjectSizes(physics.calculateDiameters());
      sliderText = formatMassForSlider(newValue);
    } else if (currentSlider === "speed") {
      newValue = Math.round(newValue*10000)/10000;
      physics.initialConditions.timeScaleFactor = newValue;
      sliderText = formatTimescaleForSlider(newValue);
    } else if (currentSlider === "softening") {
      var eps = Math.pow(10, newValue);
      physics.initialConditions.softeningParameterSquared = eps*eps;
      sliderText = formatSofteningForSlider(eps);
    } else {
      sliderText = "Неизвестный ползунок";
    }
    sliderLabelElement.innerText = sliderText;
  }

  function getCurrentSliderSettings(){
    if (currentSlider==="mass") return physics.initialConditions.massSlider;
    if (currentSlider==="speed") return physics.initialConditions.timeScaleFactorSlider;
    if (currentSlider==="softening") return getSofteningSliderSettings(physics.initialConditions.dimensionless);
    return { min:0, max:1 };
  }

  function roundSliderValueText(v){
    var r = Math.round(v*10000)/10000;
    return parseFloat(r).toFixed(4);
  }

  function formatSofteningForSlider(eps){
    var formatted = eps.toExponential(4);
    var unit = physics.initialConditions.dimensionless ? "" : " м";
    return "Смягчение ε: " + formatted + unit;
  }

  function bodyNameFromIndex(i){
    var name = physics.initialConditions.currentPresetName;
    var circles = (name==="FigureEight" || name==="Chaotic");
    if (circles) return ["Красного тела","Синего тела","Зелёного тела"][i] || "Тела";
    return ["Солнце","Земля","Юпитер"][i] || "Тело";
  }

  function formatMassForSlider(m){
    var f = roundSliderValueText(m);
    if (m>10000 || (m<0.001 && m!==0)) f = m.toExponential(4);
    var txt = "Масса " + bodyNameFromIndex(currentMassSliderIndex) + ": " + f;
    if (physics.initialConditions.dimensionless !== true) txt += " кг";
    return txt;
  }

  function timeHumanReadable(t){
    var res = { unit:'секунда', value:t };
    if (res.value < 60) return res;
    res.value/=60; res.unit='минута'; if (res.value<60) return res;
    res.value/=60; res.unit='час';    if (res.value<24) return res;
    res.value/=24; res.unit='день';   if (res.value<365) return res;
    res.value/=365; res.unit='год';   if (res.value<100) return res;
    res.value/=100; res.unit='век';   if (res.value<10) return res;
    res.value = Math.floor(res.value*10)/10;
    return res;
    }

  function formatTimescaleForSlider(v){
    var h = timeHumanReadable(v);
    var f = roundSliderValueText(h.value);
    if (h.value>10000 || (h.value<0.001 && h.value!==0)) f = h.value.toExponential(4);
    return "Скорость симуляции: " + f + " " + h.unit + " в секунду";
  }

  function didClickRestart(){
    physics.resetStateToInitialConditions();
    graphics.clearScene(physics.largestDistanceMeters());
    graphics.updateObjectSizes(physics.calculateDiameters());
    return false;
  }

  function getCurrentSimulationValue(){
    if (currentSlider==="mass") return physics.initialConditions.masses[currentMassSliderIndex];
    if (currentSlider==="speed") return physics.initialConditions.timeScaleFactor;
    if (currentSlider==="softening"){
      var s = getSofteningSliderSettings(physics.initialConditions.dimensionless);
      var epsSq = physics.initialConditions.softeningParameterSquared;
      var eps;
      if (epsSq && epsSq>0){ eps = Math.sqrt(epsSq); }
      else { eps = Math.pow(10, s.defaultLogEpsilon); physics.initialConditions.softeningParameterSquared = eps*eps; }
      return Math.log10(eps);
    }
    return 0;
  }

  function resetSlider(){
    cssHelper.removeClass(sliderElement,"ThreeBodyProblem-sliderSun");
    cssHelper.removeClass(sliderElement,"ThreeBodyProblem-sliderEarth");
    cssHelper.removeClass(sliderElement,"ThreeBodyProblem-sliderJupiter");

    var set = getCurrentSliderSettings();
    var val = getCurrentSimulationValue();
    var txt;

    if (currentSlider==="mass"){
      txt = formatMassForSlider(val);
      if (currentMassSliderIndex===0) cssHelper.addClass(sliderElement,"ThreeBodyProblem-sliderSun");
      else if (currentMassSliderIndex===1) cssHelper.addClass(sliderElement,"ThreeBodyProblem-sliderEarth");
      else cssHelper.addClass(sliderElement,"ThreeBodyProblem-sliderJupiter");
    } else if (currentSlider==="speed"){
      txt = formatTimescaleForSlider(val);
    } else if (currentSlider==="softening"){
      var eps = Math.pow(10,val);
      txt = formatSofteningForSlider(eps);
    } else {
      txt = "Неизвестный ползунок";
    }
    sliderLabelElement.innerText = txt;

    var pos = (set.min!==undefined && set.max!==undefined && set.min!==set.max) ? (val - set.min)/(set.max - set.min) : 0.5;
    pos = Math.max(0,Math.min(1,pos));
    if (set.power!==undefined && set.power!==1){
      if (set.power%2===1){
        var defOut = calculateDefaultSliderOutput(set);
        pos = oddPowerCurve.sliderInputValue(defOut, pos, set.power);
      } else {
        pos = Math.pow(pos,1/set.power);
      }
      pos = Math.max(0,Math.min(1,pos));
    }
    if (slider && typeof slider.changePosition==='function'){
      slider.changePosition(pos);
      slider.previousSliderValue = pos;
    }
  }

  function didChangeModel(model){
    currentModel = model;
    physics.changeInitialConditions(currentModel);

    var sunEl = document.querySelector(".ThreeBodyProblem-sun");
    var earthEl = document.querySelector(".ThreeBodyProblem-earth");
    var jupEl = document.querySelector(".ThreeBodyProblem-jupiter");
    var bodies = [sunEl,earthEl,jupEl];
    var colorClasses = ["ThreeBodyProblem-sun--circle","ThreeBodyProblem-earth--circle","ThreeBodyProblem-jupiter--circle"];
    var useCircles = (model.name==="FigureEight" || model.name==="Chaotic");

    bodies.forEach(function(b,i){
      cssHelper.removeClass(b,"ThreeBodyProblem-body--circle");
      cssHelper.removeClass(b,colorClasses[i]);
    });
    if (useCircles){
      bodies.forEach(function(b,i){
        cssHelper.addClass(b,"ThreeBodyProblem-body--circle");
        cssHelper.addClass(b,colorClasses[i]);
      });
    }

    // Ключевое: обновляем кнопки (только иконки-кружки в абстрактных режимах)
    updateMassButtonsAppearance(useCircles);

    didClickRestart();
    resetSlider();
  }

  function didClickMass1(){ currentSlider="mass"; currentMassSliderIndex=0; resetSlider(); return false; }
  function didClickMass2(){ currentSlider="mass"; currentMassSliderIndex=1; resetSlider(); return false; }
  function didClickMass3(){ currentSlider="mass"; currentMassSliderIndex=2; resetSlider(); return false; }
  function didClickSpeed(){ currentSlider="speed"; currentMassSliderIndex=0; resetSlider(); return false; }
  function didClickSoftening(){ currentSlider="softening"; currentMassSliderIndex=0; resetSlider(); return false; }

  function init(){
    currentModel = simulations.init();
    physics.changeInitialConditions(currentModel);
    simulations.content.didChangeModel = didChangeModel;

    slider = SickSlider(".ThreeBodyProblem-slider");
    slider.onSliderChange = didUpdateSlider;

    resetSlider();

    if (restartButton) restartButton.onclick = didClickRestart;
    if (mass1Button) mass1Button.onclick = didClickMass1;
    if (mass2Button) mass2Button.onclick = didClickMass2;
    if (mass3Button) mass3Button.onclick = didClickMass3;
    if (speedButton) speedButton.onclick = didClickSpeed;
    if (softeningButton) softeningButton.onclick = didClickSoftening;

    var pauseButton = document.querySelector('.ThreeBodyProblem-pause');
    if (pauseButton){
      pauseButton.onclick = function(){
        if (simulation.isPaused()){ simulation.resume(); pauseButton.textContent='Пауза'; }
        else { simulation.pause(); pauseButton.textContent='Продолжить'; }
        return false;
      };
    }

    // Применяем вид кнопок на старте
    var useCircles = (currentModel.name==="FigureEight" || currentModel.name==="Chaotic");
    updateMassButtonsAppearance(useCircles);
  }

  return { init:init };
})();

// Инициализация пользовательского интерфейса
userInput.init();

// Инициализация стилей для круговых тел + первичная синхронизация кнопок
(function(){
  var presetName = physics.initialConditions.currentPresetName;
  var useCircles = (presetName==="FigureEight" || presetName==="Chaotic");

  var sunEl = document.querySelector(".ThreeBodyProblem-sun");
  var earthEl = document.querySelector(".ThreeBodyProblem-earth");
  var jupEl = document.querySelector(".ThreeBodyProblem-jupiter");
  var bodies = [sunEl,earthEl,jupEl];
  var colorClasses = ["ThreeBodyProblem-sun--circle","ThreeBodyProblem-earth--circle","ThreeBodyProblem-jupiter--circle"];

  bodies.forEach(function(b,i){
    cssHelper.removeClass(b,"ThreeBodyProblem-body--circle");
    cssHelper.removeClass(b,colorClasses[i]);
  });
  if (useCircles){
    bodies.forEach(function(b,i){
      cssHelper.addClass(b,"ThreeBodyProblem-body--circle");
      cssHelper.addClass(b,colorClasses[i]);
    });
  }

  // синхронизация кнопок на самый первый рендер
  var m1=document.querySelector(".ThreeBodyProblem-mass1Button");
  var m2=document.querySelector(".ThreeBodyProblem-mass2Button");
  var m3=document.querySelector(".ThreeBodyProblem-mass3Button");
  if (m1 && m2 && m3) {
    // используем точно те же функции, что и внутри модуля
    // (доступны через замыкание userInput — уже вызван init)
    // поэтому здесь ничего не дублируем — кнопки уже приведены в порядок
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
    try{
      return new Proxy(inst,{
        set:function(target, prop, value){
          if (prop==='onSliderChange' && typeof value==='function'){
            var wrapped = function(v){
              // русская метка "Масса ..." — не инвертируем v
              value(v);
            };
            return Reflect.set(target, prop, wrapped);
          }
          return Reflect.set(target, prop, value);
        }
      });
    }catch(e){
      return inst;
    }
  };
})();
