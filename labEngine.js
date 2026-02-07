var labEngine = (function(){
  "use strict";

  var activeTask = null;
  var tReal = 0;
  var baseline = null;
  var lastMetrics = null;

  var hudEl = null;

  function $(id){ return document.getElementById(id); }

  function getG(){
    return (physics.initialConditions.dimensionless === true)
      ? 1
      : physics.constants.gravitationalConstant;
  }

  function vecLen(x,y){ return Math.sqrt(x*x + y*y); }
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function radToDeg(r){ return r * 180 / Math.PI; }

  function ensureHud(){
    if (hudEl && document.body.contains(hudEl)) return hudEl;
    hudEl = document.getElementById("trainer-hud");
    if (!hudEl) {
      hudEl = document.createElement("div");
      hudEl.id = "trainer-hud";
      var container = document.querySelector(".ThreeBodyProblem-container");
      (container || document.body).appendChild(hudEl);
    }

    hudEl.style.position = "absolute";
    hudEl.style.left = "14px";
    hudEl.style.top = "14px";
    hudEl.style.zIndex = "1500";
    hudEl.style.maxWidth = "420px";
    hudEl.style.padding = "10px 12px";
    hudEl.style.borderRadius = "12px";
    hudEl.style.border = "1px solid rgba(255,255,255,0.16)";
    hudEl.style.background = "rgba(0,0,0,0.35)";
    hudEl.style.backdropFilter = "blur(6px)";
    hudEl.style.webkitBackdropFilter = "blur(6px)";
    hudEl.style.boxShadow = "0 10px 30px rgba(0,0,0,0.35)";
    hudEl.style.fontFamily = "Inter, system-ui, Arial, sans-serif";
    hudEl.style.fontSize = "13px";
    hudEl.style.lineHeight = "1.35";
    hudEl.style.color = "#eaf0ff";
    hudEl.style.pointerEvents = "none";
    hudEl.style.display = "none";
    return hudEl;
  }

  function setHudVisible(flag){
    ensureHud();
    hudEl.style.display = flag ? "block" : "none";
  }

  function hud(html){
    ensureHud();
    hudEl.innerHTML = html;
  }

  function getBodyState(i){
    var b = i*4;
    var u = physics.state.u;
    return { x: u[b], y: u[b+1], vx: u[b+2], vy: u[b+3] };
  }

  function getRel(a, b){
    var A = getBodyState(a);
    var B = getBodyState(b);
    var dx = B.x - A.x, dy = B.y - A.y;
    var dvx = B.vx - A.vx, dvy = B.vy - A.vy;
    var r = vecLen(dx, dy);
    var v = vecLen(dvx, dvy);
    var vr = (r > 0) ? (dx*dvx + dy*dvy) / r : 0;
    var vt = Math.sqrt(Math.max(0, v*v - vr*vr));
    return { dx:dx, dy:dy, dvx:dvx, dvy:dvy, r:r, v:v, vr:vr, vt:vt };
  }

  function collisionDetected(i, j){
    var mi = physics.initialConditions.masses[i];
    var mj = physics.initialConditions.masses[j];
    var di = (physics.initialConditions.densities && physics.initialConditions.densities[i]) ? physics.initialConditions.densities[i] : physics.constants.averageDensity;
    var dj = (physics.initialConditions.densities && physics.initialConditions.densities[j]) ? physics.initialConditions.densities[j] : physics.constants.averageDensity;

    var ri = physics.calculateRadiusFromMass(mi, di);
    var rj = physics.calculateRadiusFromMass(mj, dj);

    var rel = getRel(i, j);
    return rel.r > 0 && rel.r <= (ri + rj);
  }

  function specificEnergyTwoBody(centralIndex, targetIndex){
    var mC = physics.initialConditions.masses[centralIndex];
    var mT = physics.initialConditions.masses[targetIndex];
    var G = getG();
    var rel = getRel(centralIndex, targetIndex);
    var e = 0.5 * rel.v * rel.v - (G * (mC + mT)) / Math.max(rel.r, 1e-12);
    return { e:e, rel:rel };
  }

  function pauseSimulationNicely(){
    var pauseButton = document.querySelector('.ThreeBodyProblem-pause');
    if (pauseButton && !simulation.isPaused()) pauseButton.click();
  }

  function ensureResultModalHandlers(){
    var modal = $("activity-result-modal");
    if (!modal || modal.__bound) return;
    modal.__bound = true;

    var close = function(){ modal.classList.add("is-hidden"); };

    var okBtn = $("activity-result-ok");
    var closeBtn = modal.querySelector(".modal-close-button");
    if (okBtn) okBtn.addEventListener("click", close);
    if (closeBtn) closeBtn.addEventListener("click", close);

    modal.addEventListener("click", function(e){
      if (e.target === modal) close();
    });
  }

  function buildReport(snapshot, result){
    return {
      timestamp: new Date().toISOString(),
      task: snapshot && snapshot.task ? snapshot.task : null,
      baseline: snapshot && snapshot.baseline ? snapshot.baseline : null,
      lastMetrics: snapshot && snapshot.lastMetrics ? snapshot.lastMetrics : null,
      simTime: snapshot ? snapshot.tReal : null,
      result: result
    };
  }

  function showResultModal(result, snapshot){
    ensureResultModalHandlers();
    var modal = $("activity-result-modal");
    if (!modal) { alert(result.title + "\n\n" + result.text); return; }

    var titleEl = $("activity-result-title");
    var bodyEl  = $("activity-result-body");
    if (titleEl) titleEl.textContent = result.title;
    if (bodyEl)  bodyEl.innerHTML = result.html;

    var downloadBtn = $("activity-result-download");
    if (downloadBtn) {
      downloadBtn.onclick = function(){
        var rep = buildReport(snapshot, result);
        var blob = new Blob([JSON.stringify(rep, null, 2)], { type: "application/json;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        var taskId = (snapshot && snapshot.task && snapshot.task.id) ? snapshot.task.id : "task";
        a.href = url;
        a.download = "trainer_report_" + taskId + ".json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
    }

    modal.classList.remove("is-hidden");
  }

  function saveAttemptToLocalStorage(attempt){
    try {
      var key = "trainer_attempts";
      var arr = JSON.parse(localStorage.getItem(key) || "[]");
      arr.push(attempt);
      localStorage.setItem(key, JSON.stringify(arr));
    } catch(e){}
  }

  function makeSnapshot(){
    return {
      task: activeTask ? { id: activeTask.id, title: activeTask.title } : null,
      baseline: baseline ? JSON.parse(JSON.stringify(baseline)) : null,
      lastMetrics: lastMetrics ? JSON.parse(JSON.stringify(lastMetrics)) : null,
      tReal: tReal
    };
  }

  function passFailScore(success){ return success ? 100 : 0; }

  function finish(result){
    pauseSimulationNicely();
    setHudVisible(false);

    var snapshot = makeSnapshot();

    saveAttemptToLocalStorage({
      timestamp: new Date().toISOString(),
      taskId: snapshot.task ? snapshot.task.id : null,
      success: !!result.success,
      score: (result.score !== undefined ? result.score : null),
      simTime: snapshot.tReal,
      baseline: snapshot.baseline,
      lastMetrics: snapshot.lastMetrics
    });

    showResultModal(result, snapshot);

    activeTask = null;
    baseline = null;
    tReal = 0;
    lastMetrics = null;
  }


  function evaluateEscapeTask(dt){
    var goal = activeTask.goal;
    var central = goal.centralBody;
    var target  = goal.targetBody;

    if (activeTask.fail && activeTask.fail.collision) {
      if (collisionDetected(central, target)) {
        finish({
          success: false,
          score: passFailScore(false),
          title: "Провал: столкновение",
          text: "Тела столкнулись.",
          html: "<p>Произошло столкновение центрального тела и объекта.</p>"
        });
        return { done:true };
      }
    }

    var out = specificEnergyTwoBody(central, target);
    var e = out.e;
    var rel = out.rel;

    if (!activeTask._escapeHold) activeTask._escapeHold = 0;
    var escapedNow = (e > 0) && (rel.r >= goal.escapeRadius) && (rel.vr > 0);
    if (escapedNow) activeTask._escapeHold += dt;
    else activeTask._escapeHold = 0;

    lastMetrics = {
      type: "escape",
      r: rel.r,
      v: rel.v,
      vr: rel.vr,
      specificEnergy: e,
      massCentral: physics.initialConditions.masses[central],
      tReal: tReal,
      hold: activeTask._escapeHold
    };

    var left = Math.max(0, goal.timeLimit - tReal);

    hud(
      "<div style='font-weight:700; color:#7bf0ff;'>Тренажёр: " + activeTask.title + "</div>" +
      "<div style='opacity:.9;'>Время: " + tReal.toFixed(1) + " / " + goal.timeLimit + " c (осталось " + left.toFixed(1) + " c)</div>" +
      "<div>r = <b>" + rel.r.toFixed(4) + "</b> (нужно ≥ " + goal.escapeRadius + ")</div>" +
      "<div>e = <b>" + e.toFixed(6) + "</b>, v<sub>r</sub> = <b>" + rel.vr.toFixed(4) + "</b></div>" +
      "<div>Прогресс: " + activeTask._escapeHold.toFixed(2) + " / " + (goal.escapeHoldTime || 0.6) + " c подряд</div>" +
      "<div style='margin-top:6px; color:" + (escapedNow ? "#4ccd7a" : "#ffcd9c") + "; font-weight:700;'>" +
        (escapedNow ? "Условие сейчас выполняется" : "Условие сейчас НЕ выполняется") +
      "</div>"
    );

    if (activeTask._escapeHold >= (goal.escapeHoldTime || 0.6)) {
      finish({
        success: true,
        score: passFailScore(true),
        title: "Успех: побег выполнен",
        text: "Объект вышел на незамкнутую траекторию.",
        html:
          "<p><b>Условие:</b> e &gt; 0, r &ge; " + goal.escapeRadius + ", v<sub>r</sub> &gt; 0</p>" +
          "<p><b>Итог:</b> r = " + rel.r.toFixed(4) + ", v = " + rel.v.toFixed(4) + ", e = " + e.toFixed(6) + "</p>" +
          "<p><b>Оценка:</b> <span style=\"color:#7bf0ff; font-weight:700;\">ЗАЧЁТ</span> (100/100)</p>"
      });
      return { done:true };
    }

    if (tReal >= goal.timeLimit) {
      finish({
        success: false,
        score: passFailScore(false),
        title: "Провал: время вышло",
        text: "За отведённое время объект не покинул систему.",
        html:
          "<p>За <b>" + goal.timeLimit + "</b> секунд побег не зафиксирован.</p>" +
          "<p><b>Подсказка:</b> нужно добиться e &gt; 0.</p>"
      });
      return { done:true };
    }

    return { done:false };
  }


  function evaluateBoundOrbitHoldTask(dt){
    var goal = activeTask.goal;
    var central = goal.centralBody;
    var target  = goal.targetBody;

    if (activeTask.fail && activeTask.fail.collision) {
      if (collisionDetected(central, target)) {
        finish({
          success: false,
          score: passFailScore(false),
          title: "Провал: столкновение",
          text: "Произошло столкновение.",
          html: "<p>Тела столкнулись — орбита не удержана.</p>"
        });
        return { done:true };
      }
    }

    var out = specificEnergyTwoBody(central, target);
    var e = out.e;
    var rel = out.rel;

    if (!activeTask._window) activeTask._window = [];
    var win = activeTask._window;

    win.push({ t: tReal, r: rel.r, e: e });

    while (win.length && (tReal - win[0].t) > goal.holdTime) win.shift();

    var wMinR = Infinity, wMaxR = 0, wMaxE = -Infinity;
    for (var i=0; i<win.length; i++){
      if (win[i].r < wMinR) wMinR = win[i].r;
      if (win[i].r > wMaxR) wMaxR = win[i].r;
      if (win[i].e > wMaxE) wMaxE = win[i].e;
    }

    var windowSpan = win.length ? (win[win.length-1].t - win[0].t) : 0;
    var windowFull = windowSpan >= goal.holdTime * 0.98;

    var inRangeWindow = (wMinR >= goal.rMin) && (wMaxR <= goal.rMax);
    var energyWindowOk = goal.requireEnergyNegative ? (wMaxE < 0) : true;

    var okWindow = windowFull && inRangeWindow && energyWindowOk;

    var hint = "";
    if (goal.requireEnergyNegative && !energyWindowOk) {
      hint = "e ≥ 0 ⇒ увеличьте массу центра.";
    } else if (!inRangeWindow) {
      if (wMinR < goal.rMin) hint = "Перицентр слишком мал ⇒ уменьшайте массу центра.";
      else if (wMaxR > goal.rMax) hint = "Апоцентр слишком велик ⇒ увеличивайте массу центра.";
      else hint = "Орбита выходит за диапазон ⇒ подберите массу точнее.";
    } else if (!windowFull) {
      hint = "Нужно накопить окно " + goal.holdTime + " c.";
    } else {
      hint = "Всё хорошо — держите ещё немного.";
    }

    var mCentral = physics.initialConditions.masses[central];
    var mTarget = physics.initialConditions.masses[target];
    var G = getG();
    var mRec = ((rel.vt*rel.vt) * rel.r) / Math.max(G, 1e-12) - mTarget;

    lastMetrics = {
      type: "boundOrbitHold",
      r: rel.r,
      v: rel.v,
      vt: rel.vt,
      specificEnergy: e,
      massCentral: mCentral,
      tReal: tReal,
      windowSpan: windowSpan,
      windowMinR: wMinR,
      windowMaxR: wMaxR,
      windowMaxE: wMaxE,
      okWindow: okWindow,
      rMin: goal.rMin,
      rMax: goal.rMax,
      holdTime: goal.holdTime,
      timeLimit: goal.timeLimit
    };

    var left = Math.max(0, goal.timeLimit - tReal);
    var okColor = okWindow ? "#4ccd7a" : "#ffcd9c";

    hud(
      "<div style='font-weight:700; color:#7bf0ff;'>Тренажёр: " + activeTask.title + "</div>" +
      "<div style='opacity:.9;'>Время: " + tReal.toFixed(1) + " / " + goal.timeLimit + " c (осталось " + left.toFixed(1) + " c)</div>" +
      "<div>Текущее r = <b>" + rel.r.toFixed(4) + "</b> (нужно [" + goal.rMin + "; " + goal.rMax + "])</div>" +
      "<div>Окно " + goal.holdTime + " c: r<sub>min</sub>=" + wMinR.toFixed(4) + ", r<sub>max</sub>=" + wMaxR.toFixed(4) + "</div>" +
      (goal.requireEnergyNegative ? "<div>Окно: max(e)=" + wMaxE.toFixed(6) + " (нужно &lt; 0)</div>" : "") +
      "<div>Масса центра: <b>" + mCentral.toFixed(4) + "</b>" +
      (isFinite(mRec) ? (" (рекоменд. ~ " + mRec.toFixed(3) + ")") : "") +
      "</div>" +
      "<div style='margin-top:6px; color:" + okColor + "; font-weight:700;'>" +
        (okWindow ? "Условие окна выполнено — ЗАЧЁТ" : "Условие окна НЕ выполнено") +
      "</div>" +
      "<div style='opacity:.95; margin-top:4px;'><b>Подсказка:</b> " + hint + "</div>"
    );

    if (okWindow) {
      finish({
        success: true,
        score: passFailScore(true),
        title: "Успех: орбита удержана",
        text: "Орбита удерживалась в пределах заданного диапазона.",
        html:
          "<p><b>Проверка:</b> в окне последних <b>" + goal.holdTime + "</b> секунд r<sub>min</sub> ≥ " + goal.rMin +
          " и r<sub>max</sub> ≤ " + goal.rMax + (goal.requireEnergyNegative ? ", max(e) < 0" : "") + "</p>" +
          "<p><b>Окно:</b> rmin=" + wMinR.toFixed(4) + ", rmax=" + wMaxR.toFixed(4) +
          (goal.requireEnergyNegative ? (", max(e)=" + wMaxE.toFixed(6)) : "") + "</p>" +
          "<p><b>Оценка:</b> <span style=\"color:#7bf0ff; font-weight:700;\">ЗАЧЁТ</span> (100/100)</p>"
      });
      return { done:true };
    }

    if (tReal >= goal.timeLimit) {
      finish({
        success: false,
        score: passFailScore(false),
        title: "Провал: не удалось удержать орбиту",
        text: "Диапазон не удержан.",
        html:
          "<p><b>Требование:</b> в окне последних <b>" + goal.holdTime + "</b> секунд r<sub>min</sub> ≥ " + goal.rMin +
          " и r<sub>max</sub> ≤ " + goal.rMax + (goal.requireEnergyNegative ? ", max(e) < 0" : "") + "</p>" +
          "<p><b>Факт (последнее окно):</b> rmin=" + wMinR.toFixed(4) + ", rmax=" + wMaxR.toFixed(4) +
          (goal.requireEnergyNegative ? (", max(e)=" + wMaxE.toFixed(6)) : "") + "</p>" +
          "<p><b>Подсказка:</b> " + hint + "</p>"
      });
      return { done:true };
    }

    return { done:false };
  }

  function angleBetween(ax, ay, bx, by){
    var da = Math.sqrt(ax*ax + ay*ay);
    var db = Math.sqrt(bx*bx + by*by);
    if (da === 0 || db === 0) return 0;
    var cos = (ax*bx + ay*by) / (da*db);
    cos = clamp(cos, -1, 1);
    return Math.acos(cos);
  }

  function evaluateLagrangeHoldTask(dt){
    var goal = activeTask.goal;
    var A = goal.primaryA;
    var B = goal.primaryB;
    var T = goal.testBody;

    if (activeTask.fail && activeTask.fail.collision) {
      if (collisionDetected(A, T) || collisionDetected(B, T)) {
        finish({
          success: false,
          score: passFailScore(false),
          title: "Провал: столкновение",
          text: "Тело столкнулось с одним из первичных.",
          html: "<p>Столкновение разрушило конфигурацию.</p>"
        });
        return { done:true };
      }
    }

    if (!activeTask._hold) activeTask._hold = 0;

    var AB = getRel(A, B);
    var AT = getRel(A, T);
    var BT = getRel(B, T);

    var rAB = AB.r, rAT = AT.r, rBT = BT.r;
    var sideRelTol = goal.sideRelTol || 0.10;
    var angleTolDeg = goal.angleTolDeg || 12;

    var sideOk = (Math.abs(rAT - rAB)/Math.max(rAB,1e-12) <= sideRelTol) &&
                 (Math.abs(rBT - rAB)/Math.max(rAB,1e-12) <= sideRelTol);

    var ang = angleBetween(AB.dx, AB.dy, AT.dx, AT.dy);
    var angDeg = radToDeg(ang);
    var angleOk = Math.abs(angDeg - 60) <= angleTolDeg;

    var okNow = sideOk && angleOk;

    if (okNow) activeTask._hold += dt;
    else activeTask._hold = 0;

    lastMetrics = {
      type: "lagrangeHold",
      rAB: rAB, rAT: rAT, rBT: rBT,
      angleDeg: angDeg,
      sideOk: sideOk, angleOk: angleOk,
      masses: physics.initialConditions.masses.slice(),
      tReal: tReal,
      hold: activeTask._hold
    };

    var left = Math.max(0, goal.timeLimit - tReal);

    hud(
      "<div style='font-weight:700; color:#7bf0ff;'>Тренажёр: " + activeTask.title + "</div>" +
      "<div style='opacity:.9;'>Время: " + tReal.toFixed(1) + " / " + goal.timeLimit + " c (осталось " + left.toFixed(1) + " c)</div>" +
      "<div>Стороны: rAB=" + rAB.toFixed(4) + ", rAT=" + rAT.toFixed(4) + ", rBT=" + rBT.toFixed(4) + "</div>" +
      "<div>Угол=" + angDeg.toFixed(2) + "° (нужно 60° ± " + angleTolDeg + "°)</div>" +
      "<div>Прогресс: " + activeTask._hold.toFixed(2) + " / " + goal.holdTime + " c подряд</div>" +
      "<div style='margin-top:6px; color:" + (okNow ? "#4ccd7a" : "#ffcd9c") + "; font-weight:700;'>" +
        (okNow ? "Условие сейчас выполняется" : "Условие сейчас НЕ выполняется") +
      "</div>"
    );

    if (activeTask._hold >= goal.holdTime) {
      finish({
        success: true,
        score: passFailScore(true),
        title: "Успех: удержание около L4",
        text: "Конфигурация удерживалась заданное время.",
        html:
          "<p><b>Условие:</b> стороны ~ равны (±" + Math.round(sideRelTol*100) + "%) и угол ~ 60° (±" + angleTolDeg + "°)</p>" +
          "<p><b>Итог:</b> rAB=" + rAB.toFixed(4) + ", rAT=" + rAT.toFixed(4) + ", rBT=" + rBT.toFixed(4) + ", угол=" + angDeg.toFixed(2) + "°</p>" +
          "<p><b>Оценка:</b> <span style=\"color:#7bf0ff; font-weight:700;\">ЗАЧЁТ</span> (100/100)</p>"
      });
      return { done:true };
    }

    if (tReal >= goal.timeLimit) {
      finish({
        success: false,
        score: passFailScore(false),
        title: "Провал: удержание около L4 не достигнуто",
        text: "Конфигурация не удерживалась достаточно долго.",
        html:
          "<p>Нужно удержать условие <b>" + goal.holdTime + "</b> секунд подряд.</p>" +
          "<p><b>Подсказка:</b> уменьшайте массу тела 3 — оно меньше возмущает движение тел 1 и 2.</p>"
      });
      return { done:true };
    }

    return { done:false };
  }

  function evaluateActiveTask(dt){
    if (!activeTask || !activeTask.goal) return { done:false };

    var type = activeTask.goal.type;
    if (type === "escape") return evaluateEscapeTask(dt);
    if (type === "boundOrbitHold") return evaluateBoundOrbitHoldTask(dt);
    if (type === "lagrangeHold") return evaluateLagrangeHoldTask(dt);

    return { done:false };
  }

  function startTask(taskDef){
    activeTask = taskDef;
    tReal = 0;
    lastMetrics = null;

    activeTask._window = null;
    activeTask._escapeHold = 0;
    activeTask._hold = 0;

    baseline = {
      goalType: taskDef.goal ? taskDef.goal.type : null,
      startMasses: physics.initialConditions.masses ? physics.initialConditions.masses.slice() : null
    };

    setHudVisible(true);
  }

  function stop(){
    activeTask = null;
    baseline = null;
    tReal = 0;
    lastMetrics = null;
    setHudVisible(false);
  }

  function onRestart(){
    if (!activeTask) return;
    tReal = 0;
    lastMetrics = null;
    activeTask._window = null;
    activeTask._escapeHold = 0;
    activeTask._hold = 0;
  }

  function update(deltaTimeSeconds){
    if (!activeTask) return;

    var dt = deltaTimeSeconds;
    tReal += dt;

    evaluateActiveTask(dt);
  }

  function manualCheck(){
    if (!activeTask) return;
    evaluateActiveTask(0);
  }

  function isActive(){ return !!activeTask; }

  return {
    startTask: startTask,
    stop: stop,
    onRestart: onRestart,
    update: update,
    manualCheck: manualCheck,
    isActive: isActive
  };
})();