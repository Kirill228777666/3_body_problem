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
  var figure8Position = {x: 0.97000436, y: -0.24308753};
  var figure8Velocity = {x: -0.93240737, y: -0.86473146};

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
        polarFromCartesian(figure8Position),
        polarFromCartesian({x:-figure8Position.x, y:-figure8Position.y}),
        polarFromCartesian({x:0,y:0})
      ],
      velocities: [
        polarFromCartesian({x:-figure8Velocity.x/2, y:-figure8Velocity.y/2}),
        polarFromCartesian({x:-figure8Velocity.x/2, y:-figure8Velocity.y/2}),
        polarFromCartesian(figure8Velocity)
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
    },
    "Arenstorf": {
      name: "Arenstorf",
      dimensionless: true,
      presetMode: "arenstorf",
      mu: 0.012277471,
      masses: [1 - 0.012277471, 0.012277471, 1e-9],
      densities: [1410, 1410, 1410],
      massSlider: { min: 0.001, max: 1, power: 2 },
      timeScaleFactor: 0.2,
      timeScaleFactorSlider: { min: 0.01, max: 4, power: 1 },
      positions: [
        { r: 0.012277471, theta: Math.PI },
        { r: 1 - 0.012277471, theta: 0 },
        { r: 0.994, theta: 0 }
      ],
      velocities: [
        { r: 0, theta: 0 },
        { r: 0, theta: 0 },
        { r: 2.0015851063790825, theta: -Math.PI / 2 }
      ],
      arenstorfState: { x: 0.994, y: 0, vx: 0, vy: -2.0015851063790825 },
      largestDistanceOverride: 2.2,
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
    },
    "task8": {
      id: "task8",
      title: "Задание №8: Сбор данных",
      description: "Подберите массу Солнца так, чтобы орбита зонда пролегла ровно через 3 светящихся голографических кольца (Чекпоинта).",
      steps: [
        "Нажмите «Перейти к настройке».",
        "Подберите массу красной звезды на паузе.",
        "Нажмите «Продолжить». Зонд (Тело 2) полетит по траектории.",
        "Соберите 3 кольца до истечения времени!"
      ],
      physics: {
        name: "Task8",
        dimensionless: true,
        masses: [1.0, 0.001, 1e-9],
        densities: [1410, 1410, 1410],
        massSlider: { min: 0.1, max: 2.5, power: 2 },
        timeScaleFactor: 1.0,
        timeScaleFactorSlider: { min: 0.1, max: 5, power: 1 },
        positions: [{ r: 0, theta: 0 }, { r: 2, theta: 0 }, { r: 10, theta: 0 }],
        velocities: [{ r: 0, theta: 0 }, { r: 0.6, theta: Math.PI/2 }, { r: 0, theta: 0 }],
        lockedMasses: [false, true, true],
        lockedControls: { speed: true, softening: true }
      },
      goal: {
        type: "checkpoints",
        centralBody: 0, 
        targetBody: 1,
        timeLimit: 45.0,
        checkpoints: [
          { x: -0.4, y: 1.95, r: 0.35 },
          { x: -2.1, y: -0.3, r: 0.35 },
          { x: 1.1, y: -1.7, r: 0.35 }
        ]
      },
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
