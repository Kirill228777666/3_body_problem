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
      massSlider: { min: 3e10, max: 3e31, power: 5 },
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
      timeScaleFactor: 4.0,
      timeScaleFactorSlider: { min: 0.00, max: 20, power: 1 },
      positions: [{r:1,theta:0},{r:1,theta:2*Math.PI/3},{r:1,theta:4*Math.PI/3}],
      velocities: [{r:0.55,theta:Math.PI/2},{r:0.55,theta:2*Math.PI/3+Math.PI/2},{r:0.55,theta:4*Math.PI/3+Math.PI/2}]
    }
  };

  var labs = {
    "lab1": {
      title: "Гравитационный манёвр",
      description: "Изучите, как меняется траектория легкого тела при пролете рядом с тяжелой планетой (эффект рогатки).",
      steps: [
        "Нажмите «Перейти к настройке».",
        "Настройте параметры (пока симуляция на паузе).",
        "Когда готовы — нажмите «Продолжить» (кнопка Пауза)."
      ],
      physics: {
        name: "Lab1",
        dimensionless: true,
        masses: [5, 0.01, 0.0001],
        massSlider: { min: 0.1, max: 10, power: 3 },
        timeScaleFactor: 0.5,
        timeScaleFactorSlider: { min: 0, max: 10, power: 1 },
        positions: [{r:0,theta:0}, {r:4, theta:Math.PI}, {r:10, theta:0}],
        velocities: [{r:0,theta:0}, {r:1.2, theta:0.2}, {r:0, theta:0}],
        lockedMasses: [false, false, true]
      }
    },
    "lab2": {
      title: "Двойная звезда",
      description: "Система из двух звезд равной массы. Найдите условия стабильности для далекой планеты.",
      steps: [
        "Нажмите «Перейти к настройке».",
        "Настройте параметры (пока симуляция на паузе).",
        "Когда готовы — нажмите «Продолжить» (кнопка Пауза)."
      ],
      physics: {
        name: "Lab2",
        dimensionless: true,
        masses: [2, 2, 0.001],
        massSlider: { min: 0.1, max: 5, power: 2 },
        timeScaleFactor: 1,
        timeScaleFactorSlider: { min: 0, max: 5, power: 1 },
        positions: [{r:1,theta:0},{r:1, theta:Math.PI},{r:5, theta:Math.PI/2}],
        velocities: [{r:0.707,theta:Math.PI/2},{r:0.707, theta:-Math.PI/2},{r:0.9, theta:Math.PI}],
        lockedMasses: [false, false, true]
      }
    },
    "lab3": {
      title: "Побег с орбиты (Вторая космическая)",
      description: "Задача: Понять условия, при которых тело покидает систему.",
      steps: [
        "Нажмите «Перейти к настройке».",
        "Настройте параметры (пока симуляция на паузе).",
        "Когда готовы — нажмите «Продолжить» (кнопка Пауза)."
      ],
      physics: allPresets.SunEarthJupiter
    }
  };

  var tasks = {
    "task1": {
      id: "task1",
      title: "Задание №1: Побег с орбиты",
      description: "Сделайте так, чтобы тело 2 совершило побег.",
      steps: [
        "Нажмите «Перейти к настройке».",
        "Уменьшайте массу Тела 1 (красное) на паузе.",
        "Нажмите «Продолжить».",
        "Дождитесь результата автопроверки."
      ],
      physics: {
        name: "Task1",
        dimensionless: true,
        masses: [1.0, 0.001, 1e-9],
        densities: [1410, 1410, 1410],
        massSlider: { min: 0.05, max: 2.0, power: 2 },
        timeScaleFactor: 1.0,
        timeScaleFactorSlider: { min: 0.1, max: 5, power: 1 },
        positions: [{ r: 0, theta: 0 }, { r: 1, theta: 0 }, { r: 10, theta: 0 }],
        velocities: [{ r: 0, theta: 0 }, { r: 1, theta: Math.PI/2 }, { r: 0, theta: 0 }],
        lockedMasses: [false, true, true],
        lockedControls: { speed: true, softening: true }
      },
      goal: { type: "escape", centralBody: 0, targetBody: 1, escapeRadius: 3.0, escapeHoldTime: 0.6, timeLimit: 20.0 },
      fail: { collision: true }
    },
    "task2": {
      id: "task2",
      title: "Задание №2: Удержать орбиту",
      description: "Подберите массу Тела 1, чтобы удержать орбиту тела 2.",
      steps: [
        "Нажмите «Перейти к настройке».",
        "Подберите массу Тела 1 на паузе.",
        "Нажмите «Продолжить».",
        "Дождитесь результата автопроверки."
      ],
      physics: {
        name: "Task2",
        dimensionless: true,
        masses: [0.30, 0.001, 1e-9],
        densities: [1410, 1410, 1410],
        massSlider: { min: 0.05, max: 2.5, power: 2 },
        timeScaleFactor: 1.0,
        timeScaleFactorSlider: { min: 0.1, max: 5, power: 1 },
        positions: [{ r: 0, theta: 0 }, { r: 1, theta: 0 }, { r: 10, theta: 0 }],
        velocities: [{ r: 0, theta: 0 }, { r: 1, theta: Math.PI/2 }, { r: 0, theta: 0 }],
        lockedMasses: [false, true, true],
        lockedControls: { speed: true, softening: true }
      },
      goal: { type: "boundOrbitHold", centralBody: 0, targetBody: 1, rMin: 0.70, rMax: 1.60, holdTime: 8.0, timeLimit: 25.0, requireEnergyNegative: true },
      fail: { collision: true }
    },
    "task3": {
      id: "task3",
      title: "Задание №3: Точка Лагранжа L4",
      description: "Уменьшите массу тела 3, чтобы удержать конфигурацию L4.",
      steps: [
        "Нажмите «Перейти к настройке».",
        "Уменьшайте массу Тела 3 (зелёное) на паузе.",
        "Нажмите «Продолжить».",
        "Дождитесь результата автопроверки."
      ],
      physics: (function(){
        var G = 1;
        var m1 = 1, m2 = 1;
        var a = 1;
        var mu = m2/(m1+m2);
        var x1 = -mu, x2 = 1 - mu;
        var w = Math.sqrt(G*(m1+m2)/(a*a*a));
        var vy1 = w * x1;
        var vy2 = w * x2;

        var x3 = 0.5 - mu;
        var y3 = Math.sqrt(3)/2;
        var vx3 = -w * y3;
        var vy3 =  w * x3;

        return {
          name: "Task3",
          dimensionless: true,
          masses: [m1, m2, 0.20],
          densities: [1410, 1410, 1410],
          massSlider: { min: 0.001, max: 0.20, power: 2 },
          timeScaleFactor: 1.0,
          timeScaleFactorSlider: { min: 0.1, max: 5, power: 1 },
          positions: [
            { r: Math.abs(x1), theta: (x1 >= 0 ? 0 : Math.PI) },
            { r: Math.abs(x2), theta: (x2 >= 0 ? 0 : Math.PI) },
            { r: Math.sqrt(x3*x3 + y3*y3), theta: Math.atan2(y3, x3) }
          ],
          velocities: [
            { r: Math.abs(vy1), theta: (vy1 >= 0 ? Math.PI/2 : -Math.PI/2) },
            { r: Math.abs(vy2), theta: (vy2 >= 0 ? Math.PI/2 : -Math.PI/2) },
            { r: Math.sqrt(vx3*vx3 + vy3*vy3), theta: Math.atan2(vy3, vx3) }
          ],
          lockedMasses: [true, true, false],
          lockedControls: { speed: true, softening: true }
        };
      })(),
      goal: { type: "lagrangeHold", primaryA: 0, primaryB: 1, testBody: 2, sideRelTol: 0.10, angleTolDeg: 12, holdTime: 10.0, timeLimit: 35.0 },
      fail: { collision: true }
    },
    "task4": {
      id: "task4",
      title: "Задание №4: Побег (сложнее)",
      description: "Побег в более тяжёлой конфигурации.",
      steps: [
        "Нажмите «Перейти к настройке».",
        "Уменьшайте массу Тела 1 на паузе.",
        "Нажмите «Продолжить».",
        "Дождитесь результата автопроверки."
      ],
      physics: {
        name: "Task4",
        dimensionless: true,
        masses: [0.85, 0.001, 1e-9],
        densities: [1410, 1410, 1410],
        massSlider: { min: 0.05, max: 2.2, power: 2 },
        timeScaleFactor: 1.0,
        timeScaleFactorSlider: { min: 0.1, max: 5, power: 1 },
        positions: [{ r: 0, theta: 0 }, { r: 1, theta: 0 }, { r: 10, theta: 0 }],
        velocities: [{ r: 0, theta: 0 }, { r: 1, theta: Math.PI/2 }, { r: 0, theta: 0 }],
        lockedMasses: [false, true, true],
        lockedControls: { speed: true, softening: true }
      },
      goal: { type: "escape", centralBody: 0, targetBody: 1, escapeRadius: 4.0, escapeHoldTime: 0.6, timeLimit: 28.0 },
      fail: { collision: true }
    },
    "task5": {
      id: "task5",
      title: "Задание №5: Спасти от падения",
      description: "Уменьшите массу центра и стабилизируйте орбиту.",
      steps: [
        "Нажмите «Перейти к настройке».",
        "Уменьшайте массу Тела 1 на паузе.",
        "Нажмите «Продолжить».",
        "Дождитесь результата автопроверки."
      ],
      physics: {
        name: "Task5",
        dimensionless: true,
        masses: [2.20, 0.001, 1e-9],
        densities: [1410, 1410, 1410],
        massSlider: { min: 0.20, max: 2.50, power: 2 },
        timeScaleFactor: 1.0,
        timeScaleFactorSlider: { min: 0.1, max: 5, power: 1 },
        positions: [{ r: 0, theta: 0 }, { r: 1, theta: 0 }, { r: 10, theta: 0 }],
        velocities: [{ r: 0, theta: 0 }, { r: 1, theta: Math.PI/2 }, { r: 0, theta: 0 }],
        lockedMasses: [false, true, true],
        lockedControls: { speed: true, softening: true }
      },
      goal: { type: "boundOrbitHold", centralBody: 0, targetBody: 1, rMin: 0.75, rMax: 1.45, holdTime: 10.0, timeLimit: 30.0, requireEnergyNegative: true },
      fail: { collision: true }
    },
    "task6": {
      id: "task6",
      title: "Задание №6: Дальняя орбита",
      description: "Удержите тело 2 на дальнем радиусе.",
      steps: [
        "Нажмите «Перейти к настройке».",
        "Подберите массу Тела 1 на паузе.",
        "Нажмите «Продолжить».",
        "Дождитесь результата автопроверки."
      ],
      physics: {
        name: "Task6",
        dimensionless: true,
        masses: [0.40, 0.001, 1e-9],
        densities: [1410, 1410, 1410],
        massSlider: { min: 0.20, max: 2.80, power: 2 },
        timeScaleFactor: 1.0,
        timeScaleFactorSlider: { min: 0.1, max: 5, power: 1 },
        positions: [{ r: 0, theta: 0 }, { r: 2.0, theta: 0 }, { r: 10, theta: 0 }],
        velocities: [{ r: 0, theta: 0 }, { r: 0.90, theta: Math.PI/2 }, { r: 0, theta: 0 }],
        lockedMasses: [false, true, true],
        lockedControls: { speed: true, softening: true }
      },
      goal: { type: "boundOrbitHold", centralBody: 0, targetBody: 1, rMin: 1.60, rMax: 2.60, holdTime: 12.0, timeLimit: 40.0, requireEnergyNegative: true },
      fail: { collision: true }
    },
    "task7": {
      id: "task7",
      title: "Задание №7: Точка Лагранжа L5",
      description: "Как L4, но L5 (ниже оси).",
      steps: [
        "Нажмите «Перейти к настройке».",
        "Уменьшайте массу Тела 3 на паузе.",
        "Нажмите «Продолжить».",
        "Дождитесь результата автопроверки."
      ],
      physics: (function(){
        var G = 1;
        var m1 = 1, m2 = 1;
        var a = 1;
        var mu = m2/(m1+m2);
        var x1 = -mu, x2 = 1 - mu;
        var w = Math.sqrt(G*(m1+m2)/(a*a*a));
        var vy1 = w * x1;
        var vy2 = w * x2;

        var x3 = 0.5 - mu;
        var y3 = -Math.sqrt(3)/2;
        var vx3 = -w * y3;
        var vy3 =  w * x3;

        return {
          name: "Task7",
          dimensionless: true,
          masses: [m1, m2, 0.20],
          densities: [1410, 1410, 1410],
          massSlider: { min: 0.001, max: 0.20, power: 2 },
          timeScaleFactor: 1.0,
          timeScaleFactorSlider: { min: 0.1, max: 5, power: 1 },
          positions: [
            { r: Math.abs(x1), theta: (x1 >= 0 ? 0 : Math.PI) },
            { r: Math.abs(x2), theta: (x2 >= 0 ? 0 : Math.PI) },
            { r: Math.sqrt(x3*x3 + y3*y3), theta: Math.atan2(y3, x3) }
          ],
          velocities: [
            { r: Math.abs(vy1), theta: (vy1 >= 0 ? Math.PI/2 : -Math.PI/2) },
            { r: Math.abs(vy2), theta: (vy2 >= 0 ? Math.PI/2 : -Math.PI/2) },
            { r: Math.sqrt(vx3*vx3 + vy3*vy3), theta: Math.atan2(vy3, vx3) }
          ],
          lockedMasses: [true, true, false],
          lockedControls: { speed: true, softening: true }
        };
      })(),
      goal: { type: "lagrangeHold", primaryA: 0, primaryB: 1, testBody: 2, sideRelTol: 0.10, angleTolDeg: 12, holdTime: 10.0, timeLimit: 35.0 },
      fail: { collision: true }
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

    var trainerBtn = document.getElementById('labs-menu-button');
    if (trainerBtn) cssHelper.removeClass(trainerBtn, 'ThreeBodyProblem-button--isSelected');
  }

  function didClick(e){
    e = e || window.event;
    if (e.target) didClickElement(e.target);
  }

  function getLab(id) { return labs[id]; }
  function getTask(id) { return tasks[id]; }

  function init(){
    var presetEls = document.querySelectorAll(".ThreeBodyProblem-preset");
    for (var i=0;i<presetEls.length;i++) presetEls[i].onclick = didClick;
    return allPresets.FigureEight;
  }

  return { init:init, content:content, getLab:getLab, getTask:getTask };
})();

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

var logManager = (function() {
  var approximationLog = [];
  var simulationTime = 0;
  var lastLogTimestamp = 0;
  var logInterval = 100;
  var colors = ['#ff8b22', '#6c81ff', '#4ccd7a'];

  function clear() {
    approximationLog = [];
    simulationTime = 0;
    lastLogTimestamp = 0;
    for (let i = 0; i < 3; i++) {
      const formulaEl = document.getElementById('formula-text-' + i);
      if (formulaEl) formulaEl.innerHTML = '';
    }
  }

  function fmt(n) {
    if (!Number.isFinite(n)) return "0";
    if (Math.abs(n) < 1e-9) return "0";
    if (Math.abs(n) >= 0.01 && Math.abs(n) < 10000) return parseFloat(n.toFixed(4)).toString();
    return n.toExponential(2);
  }

  function buildPolynomial(p, v, aHalf) {
    let s = fmt(p);
    let vStr = fmt(v);
    if (vStr !== "0") {
      let sign = vStr.startsWith("-") ? " - " : " + ";
      let val = vStr.replace("-", "");
      s += `${sign}${val}t`;
    }
    let aStr = fmt(aHalf);
    if (aStr !== "0") {
      let sign = aStr.startsWith("-") ? " - " : " + ";
      let val = aStr.replace("-", "");
      s += `${sign}${val}t<sup>2</sup>`;
    }
    return s;
  }

  function update(currentTime) {
    if (currentTime - lastLogTimestamp < logInterval) return;
    lastLogTimestamp = currentTime;

    const allAccs = physics.getAccelerations();
    if (!allAccs || allAccs.length === 0) return;

    var currentLogBlock = `Time: ${(simulationTime / 1000).toFixed(3)}s\n`;

    for (let i = 0; i < 3; i++) {
      const formulaEl = document.getElementById('formula-text-' + i);
      const idx = i * 4;

      const px = physics.state.u[idx];
      const py = physics.state.u[idx + 1];
      const vx = physics.state.u[idx + 2];
      const vy = physics.state.u[idx + 3];
      const axHalf = 0.5 * allAccs[i].ax;
      const ayHalf = 0.5 * allAccs[i].ay;

      const strX = buildPolynomial(px, vx, axHalf);
      const strY = buildPolynomial(py, vy, ayHalf);
      const bodyName = userInput.bodyNameFromIndex(i);

      const txtX = strX.replace(/<sup>2<\/sup>/g, "^2");
      const txtY = strY.replace(/<sup>2<\/sup>/g, "^2");
      currentLogBlock += `${bodyName}:\n  x ≈ ${txtX}\n  y ≈ ${txtY}\n`;

      if (formulaEl) {
        formulaEl.style.fontFamily = "Consolas, monospace";
        formulaEl.style.fontSize = "13px";
        formulaEl.style.lineHeight = "1.3";
        formulaEl.style.padding = "5px 10px";
        formulaEl.style.margin = "5px auto";
        formulaEl.style.whiteSpace = "normal";
        formulaEl.style.textAlign = "center";

        formulaEl.innerHTML =
          '<div style="font-weight:bold; margin:0 0 4px 0; color:' + colors[i] + '">' + bodyName + '</div>' +
          '<div style="margin:0;">x(Δt) ≈ ' + strX + '</div>' +
          '<div style="margin:0;">y(Δt) ≈ ' + strY + '</div>';
      }
    }

    approximationLog.push(currentLogBlock);
    simulationTime += logInterval;
  }

  function download() {
    if (approximationLog.length === 0) { alert("Лог пуст."); return; }
    const fileContent = approximationLog.join('\n' + '-'.repeat(40) + '\n\n');
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'approximation_log.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return { clear: clear, update: update, download: download };
})();

var userInput = (function(){
  var sliderLabelElement = document.querySelector(".ThreeBodyProblem-sliderLabel");
  var restartButton = document.querySelector(".ThreeBodyProblem-reload");
  var mass1Button = document.querySelector(".ThreeBodyProblem-mass1Button");
  var mass2Button = document.querySelector(".ThreeBodyProblem-mass2Button");
  var mass3Button = document.querySelector(".ThreeBodyProblem-mass3Button");
  var speedButton = document.querySelector(".ThreeBodyProblem-speedButton");
  var softeningButton = document.querySelector(".ThreeBodyProblem-softeningButton");
  var sliderElement = document.querySelector(".ThreeBodyProblem-slider");
  var sceneContainer = document.querySelector(".ThreeBodyProblem-container");

  var slider, currentSlider="mass", currentMassSliderIndex=0, currentModel;

  var downloadSceneButton = document.getElementById('download-scene-button');
  var uploadSceneButton = document.getElementById('upload-scene-button');
  var sceneUploader = document.getElementById('scene-uploader');
  var downloadLogButton = document.getElementById('download-log-button');

  var labSelectionModal = document.getElementById('lab-selection-modal');
  var labModal = document.getElementById('lab-modal');
  var labTitle = document.getElementById('lab-title');
  var labDesc = document.getElementById('lab-description');
  var labSteps = document.getElementById('lab-steps');
  var startLabBtn = document.getElementById('start-lab-button');
  var trainerBtn = document.getElementById('labs-menu-button');

  var infoButton = document.getElementById('info-button');
  var infoModal = document.getElementById('info-modal');

  var errorModal = document.getElementById('error-modal');

  var sliderEditInput = null;
  var bodyColors = ['#ff8b22', '#6c81ff', '#4ccd7a'];

  var currentTrainerActivity = null;

  function showErrorModal(title, message) {
    if (!errorModal) { alert(title + ": " + message); return; }
    var titleEl = errorModal.querySelector('.error-title');
    var msgEl = errorModal.querySelector('.error-message');
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    cssHelper.removeClass(errorModal, 'is-hidden');
  }

  function forcePause() {
    try { simulation.pause(); } catch(e) {}
    var pauseButton = document.querySelector('.ThreeBodyProblem-pause');
    if (pauseButton) pauseButton.textContent = 'Продолжить';
  }

  function showBriefing(activity){
    if (!activity) return;
    forcePause();

    if (startLabBtn) startLabBtn.textContent = "Перейти к настройке";
    if (labTitle) labTitle.textContent = activity.title || "Активность";
    if (labDesc) labDesc.textContent = activity.description || "";
    if (labSteps) {
      labSteps.innerHTML = '';
      (activity.steps || []).forEach(function(step){
        var li = document.createElement('li');
        li.textContent = step;
        labSteps.appendChild(li);
      });
    }
    if (labModal) cssHelper.removeClass(labModal, 'is-hidden');
  }

  function setActiveModeButton(activeBtn) {
    var buttons = [mass1Button, mass2Button, mass3Button, speedButton, softeningButton];
    buttons.forEach(function(btn) { if (btn) cssHelper.removeClass(btn, "is-active"); });
    if (activeBtn) cssHelper.addClass(activeBtn, "is-active");
  }

  function ensureSliderEdit() {
    if (sliderEditInput) return;
    sliderEditInput = document.createElement('input');
    sliderEditInput.type = 'text';
    sliderEditInput.className = 'ThreeBodyProblem-sliderEditInput';
    var labelContainer = sliderLabelElement && sliderLabelElement.parentElement ? sliderLabelElement.parentElement : null;
    if (labelContainer) labelContainer.appendChild(sliderEditInput);
    else document.body.appendChild(sliderEditInput);

    sliderEditInput.style.display = 'none';
    sliderEditInput.style.margin = '6px auto 0 auto';
    sliderEditInput.style.padding = '6px 10px';
    sliderEditInput.style.fontSize = '14px';
    sliderEditInput.style.textAlign = 'center';
    sliderEditInput.style.borderRadius = '8px';
    sliderEditInput.style.border = '1px solid rgba(255,255,255,.18)';
    sliderEditInput.style.background = 'rgba(255,255,255,.06)';
    sliderEditInput.style.color = '#f0f0f0';
    sliderEditInput.style.boxShadow = '0 6px 18px rgba(0,0,0,.25)';
    sliderEditInput.style.width = 'calc(100% - 20px)';
    sliderEditInput.style.maxWidth = '520px';
    sliderEditInput.style.boxSizing = 'border-box';
  }

  function showMassEdit() {
    if (currentSlider !== 'mass') return;
    ensureSliderEdit();
    var val = physics.initialConditions.masses[currentMassSliderIndex];
    sliderEditInput.value = String(val);
    sliderLabelElement.style.display = 'none';
    sliderEditInput.style.display = 'block';
    setTimeout(function(){ sliderEditInput.focus(); sliderEditInput.select(); }, 0);
  }

  function finishMassEdit(apply) {
    if (!sliderEditInput) return;
    if (apply) {
      var raw = sliderEditInput.value.trim().replace(',', '.');
      var num = Number(raw);
      if (Number.isFinite(num)) {
        var set = getCurrentSliderSettings();
        if (typeof set.min === 'number') num = Math.max(set.min, num);
        if (typeof set.max === 'number') num = Math.min(set.max, num);
        num = Math.round(num*10000)/10000;
        physics.initialConditions.masses[currentMassSliderIndex] = num;
        graphics.updateObjectSizes(physics.calculateDiameters());
        resetSlider();
      }
    }
    sliderEditInput.style.display = 'none';
    sliderLabelElement.style.display = '';
  }

  function attachSliderEditEvents(){
    ensureSliderEdit();
    if (sliderLabelElement){
      sliderLabelElement.addEventListener('click', function(){
        if (currentSlider === 'mass') showMassEdit();
      });
    }
    sliderEditInput.addEventListener('keydown', function(e){
      if (e.key === 'Enter'){ e.preventDefault(); finishMassEdit(true); }
      else if (e.key === 'Escape'){ e.preventDefault(); finishMassEdit(false); }
    });
    sliderEditInput.addEventListener('blur', function(){ finishMassEdit(true); });
  }

  function updateMassButtonsAppearance(useCircles) {
    if (useCircles) cssHelper.addClass(sceneContainer, 'is-circles-mode');
    else cssHelper.removeClass(sceneContainer, 'is-circles-mode');

    if (window.graphics && typeof graphics.setCircleMode === 'function') {
      graphics.setCircleMode(!!useCircles);
    }
  }

  function switchToFirstUnlockedMass(){
    if (mass1Button && !cssHelper.hasClass(mass1Button, 'is-disabled')) { didClickMass1(); return; }
    if (mass2Button && !cssHelper.hasClass(mass2Button, 'is-disabled')) { didClickMass2(); return; }
    if (mass3Button && !cssHelper.hasClass(mass3Button, 'is-disabled')) { didClickMass3(); return; }
  }

  function updateLockedButtons(lockedMasses, lockedControls) {
    var massButtons = [mass1Button, mass2Button, mass3Button];
    var otherButtons = [speedButton, softeningButton];
    var all = massButtons.concat(otherButtons);

    all.forEach(function(btn){ if(btn) cssHelper.removeClass(btn, 'is-disabled'); });

    if (lockedMasses && Array.isArray(lockedMasses)) {
      lockedMasses.forEach(function(isLocked, index){
        if (isLocked && massButtons[index]) {
          cssHelper.addClass(massButtons[index], 'is-disabled');
          if (currentSlider === 'mass' && currentMassSliderIndex === index) switchToFirstUnlockedMass();
        }
      });
    }

    if (lockedControls) {
      if (lockedControls.speed && speedButton) {
        cssHelper.addClass(speedButton, 'is-disabled');
        if (currentSlider === 'speed') switchToFirstUnlockedMass();
      }
      if (lockedControls.softening && softeningButton) {
        cssHelper.addClass(softeningButton, 'is-disabled');
        if (currentSlider === 'softening') switchToFirstUnlockedMass();
      }
    }
  }

  function getSofteningSliderSettings(isDimensionless){
    return isDimensionless
      ? { min: -3, max: 0, power: 1, defaultLogEpsilon: -1 }
      : { min: 5, max: 8, power: 1, defaultLogEpsilon: Math.log10(Math.sqrt(4.06e13)) };
  }

  function calculateDefaultSliderOutput(sliderSettings){
    var def = getCurrentSimulationValue();
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
    if (sliderLabelElement) sliderLabelElement.innerText = sliderText;
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
    if (physics.initialConditions.dimensionless === true) {
      return ["Тело 1 (красное)","Тело 2 (синее)","Тело 3 (зелёное)"][i] || "Тело";
    }
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
    logManager.clear();

    physics.resetStateToInitialConditions();
    graphics.clearScene(physics.largestDistanceMeters());
    graphics.updateObjectSizes(physics.calculateDiameters());

    graphics.calculateNewPositions(physics.state.u);
    graphics.drawBodies();
    graphics.drawOrbitalLines(false);

    if (window.chartManager && typeof window.chartManager.reset === 'function') window.chartManager.reset();

    if (currentTrainerActivity) {
      showBriefing(currentTrainerActivity);
    }

    if (window.labEngine && typeof labEngine.onRestart === 'function') {
      try { labEngine.onRestart(); } catch(e) {}
    }

    return false;
  }

  function getCurrentSimulationValue(){
    if (currentSlider==="mass") return physics.initialConditions.masses[currentMassSliderIndex];
    if (currentSlider==="speed") return physics.initialConditions.timeScaleFactor;
    if (currentSlider==="softening"){
      var s = getSofteningSliderSettings(physics.initialConditions.dimensionless);
      var epsSq = physics.initialConditions.softeningParameterSquared;
      var eps;
      if (epsSq && epsSq>0) eps = Math.sqrt(epsSq);
      else {
        eps = Math.pow(10, s.defaultLogEpsilon);
        physics.initialConditions.softeningParameterSquared = eps*eps;
      }
      return Math.log10(eps);
    }
    return 0;
  }

  function resetSlider(){
    if (sliderEditInput) {
      sliderEditInput.style.display = 'none';
      if (sliderLabelElement) sliderLabelElement.style.display = '';
    }

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
      else if (currentMassSliderIndex===2) cssHelper.addClass(sliderElement,"ThreeBodyProblem-sliderJupiter");

      cssHelper.addClass(sliderLabelElement, "is-editable");
      sliderLabelElement.title = "Нажмите, чтобы ввести значение вручную";
      sliderLabelElement.style.color = bodyColors[currentMassSliderIndex];
    } else if (currentSlider==="speed"){
      txt = formatTimescaleForSlider(val);
      cssHelper.removeClass(sliderLabelElement, "is-editable");
      sliderLabelElement.removeAttribute("title");
      sliderLabelElement.style.color = '';
    } else if (currentSlider==="softening"){
      var eps = Math.pow(10,val);
      txt = formatSofteningForSlider(eps);
      cssHelper.removeClass(sliderLabelElement, "is-editable");
      sliderLabelElement.removeAttribute("title");
      sliderLabelElement.style.color = '';
    } else {
      txt = "Неизвестный ползунок";
      cssHelper.removeClass(sliderLabelElement, "is-editable");
      sliderLabelElement.removeAttribute("title");
      sliderLabelElement.style.color = '';
    }
    sliderLabelElement.innerText = txt;

    var pos = (set.min!==undefined && set.max!==undefined && set.min!==set.max)
      ? (val - set.min)/(set.max - set.min)
      : 0.5;
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

    if (slider && typeof slider.setNormalizedValue === 'function') slider.setNormalizedValue(pos, true);
  }

  function didChangeModel(model){
    currentTrainerActivity = null;

    if (window.labEngine && typeof labEngine.stop === 'function') {
      try { labEngine.stop(); } catch(e) {}
    }

    currentModel = model;
    physics.changeInitialConditions(currentModel);

    graphics.calculateNewPositions(physics.state.u);
    graphics.drawBodies();
    graphics.drawOrbitalLines(false);

    updateMassButtonsAppearance(model.dimensionless === true);
    updateLockedButtons(model.lockedMasses, model.lockedControls);

    didClickRestart();
    resetSlider();
  }

  function startLab(labId) {
    forcePause();
    var labData = simulations.getLab(labId);
    if (!labData) return;

    var physicsConfig = labData.physics || labData;
    if (!physicsConfig.name) physicsConfig.name = "Lab";
    physicsConfig.currentPresetName = physicsConfig.name;

    didChangeModel(physicsConfig);
    forcePause();

    currentTrainerActivity = {
      kind: "lab",
      id: labId,
      title: labData.title,
      description: labData.description,
      steps: labData.steps
    };

    var presetEls = document.querySelectorAll(".ThreeBodyProblem-preset");
    for (var i=0; i<presetEls.length; i++) cssHelper.removeClass(presetEls[i],'ThreeBodyProblem-button--isSelected');
    if (trainerBtn) cssHelper.addClass(trainerBtn, 'ThreeBodyProblem-button--isSelected');

    showBriefing(currentTrainerActivity);
  }

  function startTask(taskId) {
    forcePause();
    var taskData = simulations.getTask(taskId);
    if (!taskData) {
      showErrorModal("Задание не найдено", "taskId=" + taskId);
      return;
    }

    var physicsConfig = taskData.physics || taskData;
    if (!physicsConfig.name) physicsConfig.name = "Task";
    physicsConfig.currentPresetName = physicsConfig.name;

    didChangeModel(physicsConfig);
    forcePause();

    if (window.labEngine && typeof labEngine.startTask === "function") {
      labEngine.startTask({
        id: taskData.id,
        title: taskData.title,
        goal: taskData.goal,
        fail: taskData.fail
      });
    }

    currentTrainerActivity = {
      kind: "task",
      id: taskId,
      title: taskData.title,
      description: taskData.description,
      steps: taskData.steps
    };

    var presetEls = document.querySelectorAll(".ThreeBodyProblem-preset");
    for (var i=0; i<presetEls.length; i++) cssHelper.removeClass(presetEls[i],'ThreeBodyProblem-button--isSelected');
    if (trainerBtn) cssHelper.addClass(trainerBtn, 'ThreeBodyProblem-button--isSelected');

    showBriefing(currentTrainerActivity);
  }

  function didClickMass1(){ if (mass1Button && cssHelper.hasClass(mass1Button, 'is-disabled')) return false; currentSlider="mass"; currentMassSliderIndex=0; setActiveModeButton(mass1Button); resetSlider(); return false; }
  function didClickMass2(){ if (mass2Button && cssHelper.hasClass(mass2Button, 'is-disabled')) return false; currentSlider="mass"; currentMassSliderIndex=1; setActiveModeButton(mass2Button); resetSlider(); return false; }
  function didClickMass3(){ if (mass3Button && cssHelper.hasClass(mass3Button, 'is-disabled')) return false; currentSlider="mass"; currentMassSliderIndex=2; setActiveModeButton(mass3Button); resetSlider(); return false; }
  function didClickSpeed(){ if (speedButton && cssHelper.hasClass(speedButton, 'is-disabled')) return false; currentSlider="speed"; setActiveModeButton(speedButton); resetSlider(); return false; }
  function didClickSoftening(){ if (softeningButton && cssHelper.hasClass(softeningButton, 'is-disabled')) return false; currentSlider="softening"; setActiveModeButton(softeningButton); resetSlider(); return false; }

  function didClickDownloadScene() {
    var sceneData = {
      name: "Custom Scene",
      dimensionless: physics.initialConditions.dimensionless,
      masses: physics.initialConditions.masses,
      positions: physics.initialConditions.positions,
      velocities: physics.initialConditions.velocities,
      timeScaleFactor: physics.initialConditions.timeScaleFactor,
      softeningParameterSquared: physics.initialConditions.softeningParameterSquared
    };

    var jsonString = JSON.stringify(sceneData, null, 2);
    var blob = new Blob([jsonString], { type: "application/json" });
    var url = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.href = url;
    a.download = 'three-body-scene.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return false;
  }

  function didClickUploadScene() { sceneUploader.click(); return false; }

  function handleFileUpload(event) {
    var file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      showErrorModal("Ошибка формата", "Пожалуйста, выберите корректный JSON файл.");
      return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);
        var customPreset = {
          name: "Custom",
          dimensionless: data.dimensionless,
          masses: data.masses,
          positions: data.positions,
          velocities: data.velocities,
          timeScaleFactor: data.timeScaleFactor,
          softeningParameterSquared: data.softeningParameterSquared,
          massSlider: data.dimensionless ? { min: 0.1, max: 10, power: 3 } : { min: 3e10, max: 3e31, power: 5 },
          timeScaleFactorSlider: data.dimensionless ? { min: 0.00, max: 20, power: 1 } : { min: 0, max: 3600*24*365*1000, power: 5 },
          densities: null,
          paleOrbitalPaths: false
        };
        didChangeModel(customPreset);
        forcePause();
      } catch (error) {
        showErrorModal("Ошибка данных", "Ошибка при обработке файла: " + error.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function init(){
    currentModel = simulations.init();
    physics.changeInitialConditions(currentModel);
    simulations.content.didChangeModel = didChangeModel;

    slider = SickSlider(".ThreeBodyProblem-slider");
    slider.onSliderChange = didUpdateSlider;

    resetSlider();
    attachSliderEditEvents();

    if (restartButton) restartButton.onclick = didClickRestart;
    if (mass1Button) mass1Button.onclick = didClickMass1;
    if (mass2Button) mass2Button.onclick = didClickMass2;
    if (mass3Button) mass3Button.onclick = didClickMass3;
    if (speedButton) speedButton.onclick = didClickSpeed;
    if (softeningButton) softeningButton.onclick = didClickSoftening;

    if (downloadSceneButton) downloadSceneButton.onclick = didClickDownloadScene;
    if (uploadSceneButton) uploadSceneButton.onclick = didClickUploadScene;
    if (sceneUploader) sceneUploader.onchange = handleFileUpload;
    if (downloadLogButton) downloadLogButton.onclick = function(){ logManager.download(); return false; };

    var pauseButton = document.querySelector('.ThreeBodyProblem-pause');
    if (pauseButton){
      pauseButton.onclick = function(){
        if (simulation.isPaused()){ simulation.resume(); pauseButton.textContent='Пауза'; }
        else { simulation.pause(); pauseButton.textContent='Продолжить'; }
        return false;
      };
    }

    updateMassButtonsAppearance(currentModel.dimensionless === true);

    if (infoButton && infoModal) {
      var closeInfoModalButton = infoModal.querySelector('.modal-close-button');

      infoButton.addEventListener('click', function(e) {
        e.preventDefault();
        cssHelper.removeClass(infoModal, 'is-hidden');
      });

      if (closeInfoModalButton) {
        closeInfoModalButton.addEventListener('click', function() {
          cssHelper.addClass(infoModal, 'is-hidden');
        });
      }

      infoModal.addEventListener('click', function(e) {
        if (e.target === infoModal) cssHelper.addClass(infoModal, 'is-hidden');
      });
    }

    if (errorModal) {
      var okButton = errorModal.querySelector('.error-ok-button');
      var closeFunc = function(){ cssHelper.addClass(errorModal, 'is-hidden'); };
      if (okButton) okButton.onclick = closeFunc;
      errorModal.addEventListener('click', function(e){ if (e.target === errorModal) closeFunc(); });
    }

    if (trainerBtn && labSelectionModal) {
      var closeSelBtn = labSelectionModal.querySelector('.modal-close-button');

      trainerBtn.addEventListener('click', function(){
        forcePause();
        cssHelper.removeClass(labSelectionModal, 'is-hidden');
      });

      if (closeSelBtn) closeSelBtn.addEventListener('click', function(){ cssHelper.addClass(labSelectionModal, 'is-hidden'); });

      labSelectionModal.addEventListener('click', function(e) {
        if (e.target === labSelectionModal) cssHelper.addClass(labSelectionModal, 'is-hidden');
      });
    }

    var selectLabBtns = document.querySelectorAll('.select-lab-btn');
    for (var i=0; i<selectLabBtns.length; i++) {
      selectLabBtns[i].addEventListener('click', function(){
        var labId = this.getAttribute('data-lab-id');
        cssHelper.addClass(labSelectionModal, 'is-hidden');
        startLab(labId);
      });
    }

    var selectTaskBtns = document.querySelectorAll('.select-task-btn');
    for (var t=0; t<selectTaskBtns.length; t++) {
      selectTaskBtns[t].addEventListener('click', function(){
        var taskId = this.getAttribute('data-task-id');
        cssHelper.addClass(labSelectionModal, 'is-hidden');
        startTask(taskId);
      });
    }

    if (startLabBtn) {
      startLabBtn.onclick = function(){
        if (labModal) cssHelper.addClass(labModal, 'is-hidden');
        forcePause();
        return false;
      };
    }

    if (labModal) {
      var closeLabModalBtn = labModal.querySelector('.modal-close-button');
      if (closeLabModalBtn) closeLabModalBtn.addEventListener('click', function(){ cssHelper.addClass(labModal, 'is-hidden'); });
      labModal.addEventListener('click', function(e){ if (e.target === labModal) cssHelper.addClass(labModal, 'is-hidden'); });
    }

    window.addEventListener('keydown', function(e){
      if (e.key !== 'Escape') return;

      if (infoModal && !cssHelper.hasClass(infoModal, 'is-hidden')) cssHelper.addClass(infoModal, 'is-hidden');
      if (errorModal && !cssHelper.hasClass(errorModal, 'is-hidden')) cssHelper.addClass(errorModal, 'is-hidden');
      if (labModal && !cssHelper.hasClass(labModal, 'is-hidden')) cssHelper.addClass(labModal, 'is-hidden');
      if (labSelectionModal && !cssHelper.hasClass(labSelectionModal, 'is-hidden')) cssHelper.addClass(labSelectionModal, 'is-hidden');

      var resultModal = document.getElementById('activity-result-modal');
      if (resultModal && !cssHelper.hasClass(resultModal, 'is-hidden')) cssHelper.addClass(resultModal, 'is-hidden');
    });
  }

  return { init:init, bodyNameFromIndex: bodyNameFromIndex };
})();

userInput.init();

document.addEventListener('DOMContentLoaded', function() {
  var loaderWrapper = document.getElementById('loader-wrapper');
  if(loaderWrapper){
    loaderWrapper.classList.add('hidden');
    setTimeout(function(){
      if(loaderWrapper.parentNode){
        loaderWrapper.parentNode.removeChild(loaderWrapper);
      }
    }, 500);
  }

  var container = document.querySelector('.ThreeBodyProblem-container');
  if (container) container.classList.add('visible');
  simulation.start();
});