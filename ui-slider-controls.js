var uiSliderControls = (function(){
  function create(context) {
    var slider = null;
    var currentSlider = "mass";
    var currentMassSliderIndex = 0;
    var sliderEditInput = null;
    var bodyColors = ['#ff8b22', '#6c81ff', '#4ccd7a'];

    function setSliderInstance(instance) { slider = instance; }
    function getCurrentSlider() { return currentSlider; }
    function getCurrentMassSliderIndex() { return currentMassSliderIndex; }

    function setActiveModeButton(activeBtn) {
      var buttons = [context.mass1Button, context.mass2Button, context.mass3Button, context.speedButton, context.softeningButton];
      buttons.forEach(function(btn) { if (btn) cssHelper.removeClass(btn, "is-active"); });
      if (activeBtn) cssHelper.addClass(activeBtn, "is-active");
    }

    function ensureSliderEdit() {
      if (sliderEditInput) return;
      sliderEditInput = document.createElement('input');
      sliderEditInput.type = 'text';
      sliderEditInput.className = 'ThreeBodyProblem-sliderEditInput';
      var labelContainer = context.sliderLabelElement && context.sliderLabelElement.parentElement ? context.sliderLabelElement.parentElement : null;
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

    function getSofteningSliderSettings(isDimensionless){
      return isDimensionless
        ? { min: -6, max: 0, power: 1, defaultLogEpsilon: -1 }
        : { min: 5, max: 8, power: 1, defaultLogEpsilon: Math.log10(Math.sqrt(4.06e13)) };
    }

    function bodyNameFromIndex(i){
      if (physics.initialConditions.presetMode === 'arenstorf') {
        return ["Земля","Луна","Зонд"][i] || "Тело";
      }
      if (physics.initialConditions.dimensionless === true) {
        return ["Тело 1 (красное)","Тело 2 (синее)","Тело 3 (зелёное)"][i] || "Тело";
      }
      return ["Солнце","Земля","Юпитер"][i] || "Тело";
    }

    function roundSliderValueText(v){
      var r = Math.round(v*10000)/10000;
      return parseFloat(r).toFixed(4);
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

    function formatSofteningForSlider(eps){
      var formatted = (eps === 0) ? '0' : eps.toExponential(4);
      var unit = physics.initialConditions.dimensionless ? "" : " м";
      return "Смягчение ε: " + formatted + unit;
    }

    function getCurrentSliderSettings(){
      if (currentSlider==="mass") return physics.initialConditions.massSlider;
      if (currentSlider==="speed") return physics.initialConditions.timeScaleFactorSlider;
      if (currentSlider==="softening") return getSofteningSliderSettings(physics.initialConditions.dimensionless);
      return { min:0, max:1 };
    }

    function getCurrentSimulationValue(){
      if (currentSlider==="mass") return physics.initialConditions.masses[currentMassSliderIndex];
      if (currentSlider==="speed") return physics.initialConditions.timeScaleFactor;
      if (currentSlider==="softening"){
        var s = getSofteningSliderSettings(physics.initialConditions.dimensionless);
        var epsSq = physics.initialConditions.softeningParameterSquared;
        var eps;
        if (epsSq === 0) return s.min;
        if (epsSq && epsSq>0) eps = Math.sqrt(epsSq);
        else {
          eps = Math.pow(10, s.defaultLogEpsilon);
          physics.initialConditions.softeningParameterSquared = eps*eps;
        }
        return Math.log10(eps);
      }
      return 0;
    }

    function calculateDefaultSliderOutput(sliderSettings){
      var def = getCurrentSimulationValue();
      var min = sliderSettings.min, max = sliderSettings.max;
      if (min===undefined || max===undefined || min===max) return 0.5;
      var out = (def - min) / (max - min);
      return Math.max(0, Math.min(1, out));
    }

    function updateMassButtonsAppearance(useCircles) {
      if (useCircles) cssHelper.addClass(context.sceneContainer, 'is-circles-mode');
      else cssHelper.removeClass(context.sceneContainer, 'is-circles-mode');

      if (window.graphics && typeof graphics.setCircleMode === 'function') {
        graphics.setCircleMode(!!useCircles);
      }
    }

    function switchToFirstUnlockedMass(){
      if (context.mass1Button && !cssHelper.hasClass(context.mass1Button, 'is-disabled')) { didClickMass1(); return; }
      if (context.mass2Button && !cssHelper.hasClass(context.mass2Button, 'is-disabled')) { didClickMass2(); return; }
      if (context.mass3Button && !cssHelper.hasClass(context.mass3Button, 'is-disabled')) { didClickMass3(); return; }
      if (context.speedButton && !cssHelper.hasClass(context.speedButton, 'is-disabled')) { didClickSpeed(); return; }
      if (context.softeningButton && !cssHelper.hasClass(context.softeningButton, 'is-disabled')) { didClickSoftening(); }
    }

    function updateLockedButtons(lockedMasses, lockedControls) {
      var massButtons = [context.mass1Button, context.mass2Button, context.mass3Button];
      var otherButtons = [context.speedButton, context.softeningButton];
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
        if (lockedControls.speed && context.speedButton) {
          cssHelper.addClass(context.speedButton, 'is-disabled');
          if (currentSlider === 'speed') switchToFirstUnlockedMass();
        }
        if (lockedControls.softening && context.softeningButton) {
          cssHelper.addClass(context.softeningButton, 'is-disabled');
          if (currentSlider === 'softening') switchToFirstUnlockedMass();
        }
      }
    }

    function showMassEdit() {
      if (currentSlider !== 'mass') return;
      ensureSliderEdit();
      var val = physics.initialConditions.masses[currentMassSliderIndex];
      sliderEditInput.value = String(val);
      context.sliderLabelElement.style.display = 'none';
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
          if (typeof physics.markMassesDirty === 'function') physics.markMassesDirty();
          graphics.updateObjectSizes(physics.calculateDiameters());
          resetSlider();
        }
      }
      sliderEditInput.style.display = 'none';
      context.sliderLabelElement.style.display = '';
    }

    function attachSliderEditEvents(){
      ensureSliderEdit();
      if (context.sliderLabelElement){
        context.sliderLabelElement.addEventListener('click', function(){
          if (currentSlider === 'mass') showMassEdit();
        });
      }
      sliderEditInput.addEventListener('keydown', function(e){
        if (e.key === 'Enter'){ e.preventDefault(); finishMassEdit(true); }
        else if (e.key === 'Escape'){ e.preventDefault(); finishMassEdit(false); }
      });
      sliderEditInput.addEventListener('blur', function(){ finishMassEdit(true); });
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
        if (typeof physics.markMassesDirty === 'function') physics.markMassesDirty();
        graphics.updateObjectSizes(physics.calculateDiameters());
        sliderText = formatMassForSlider(newValue);
      } else if (currentSlider === "speed") {
        newValue = Math.round(newValue*10000)/10000;
        physics.initialConditions.timeScaleFactor = newValue;
        sliderText = formatTimescaleForSlider(newValue);
      } else if (currentSlider === "softening") {
        var eps = sliderValue <= 0 ? 0 : Math.pow(10, newValue);
        physics.initialConditions.softeningParameterSquared = eps*eps;
        sliderText = formatSofteningForSlider(eps);
      } else {
        sliderText = "Неизвестный ползунок";
      }
      if (context.sliderLabelElement) context.sliderLabelElement.innerText = sliderText;
      if (window.chartManager && typeof window.chartManager.resetEnergyReference === 'function') {
        window.chartManager.resetEnergyReference();
      }
      if (window.simulation && typeof simulation.resetEnergyReference === 'function') {
        simulation.resetEnergyReference();
      }
    }

    function resetSlider(){
      if (sliderEditInput) {
        sliderEditInput.style.display = 'none';
        if (context.sliderLabelElement) context.sliderLabelElement.style.display = '';
      }

      cssHelper.removeClass(context.sliderElement,"ThreeBodyProblem-sliderSun");
      cssHelper.removeClass(context.sliderElement,"ThreeBodyProblem-sliderEarth");
      cssHelper.removeClass(context.sliderElement,"ThreeBodyProblem-sliderJupiter");

      var set = getCurrentSliderSettings();
      var val = getCurrentSimulationValue();
      var txt;

      if (currentSlider==="mass"){
        txt = formatMassForSlider(val);
        if (currentMassSliderIndex===0) cssHelper.addClass(context.sliderElement,"ThreeBodyProblem-sliderSun");
        else if (currentMassSliderIndex===1) cssHelper.addClass(context.sliderElement,"ThreeBodyProblem-sliderEarth");
        else if (currentMassSliderIndex===2) cssHelper.addClass(context.sliderElement,"ThreeBodyProblem-sliderJupiter");

        cssHelper.addClass(context.sliderLabelElement, "is-editable");
        context.sliderLabelElement.title = "Нажмите, чтобы ввести значение вручную";
        context.sliderLabelElement.style.color = bodyColors[currentMassSliderIndex];
      } else if (currentSlider==="speed"){
        txt = formatTimescaleForSlider(val);
        cssHelper.removeClass(context.sliderLabelElement, "is-editable");
        context.sliderLabelElement.removeAttribute("title");
        context.sliderLabelElement.style.color = '';
      } else if (currentSlider==="softening"){
        var eps = (val <= getSofteningSliderSettings(physics.initialConditions.dimensionless).min) ? 0 : Math.pow(10,val);
        txt = formatSofteningForSlider(eps);
        cssHelper.removeClass(context.sliderLabelElement, "is-editable");
        context.sliderLabelElement.removeAttribute("title");
        context.sliderLabelElement.style.color = '';
      } else {
        txt = "Неизвестный ползунок";
        cssHelper.removeClass(context.sliderLabelElement, "is-editable");
        context.sliderLabelElement.removeAttribute("title");
        context.sliderLabelElement.style.color = '';
      }
      context.sliderLabelElement.innerText = txt;

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

    function didClickMass1(){ if (context.mass1Button && cssHelper.hasClass(context.mass1Button, 'is-disabled')) return false; currentSlider="mass"; currentMassSliderIndex=0; setActiveModeButton(context.mass1Button); resetSlider(); return false; }
    function didClickMass2(){ if (context.mass2Button && cssHelper.hasClass(context.mass2Button, 'is-disabled')) return false; currentSlider="mass"; currentMassSliderIndex=1; setActiveModeButton(context.mass2Button); resetSlider(); return false; }
    function didClickMass3(){ if (context.mass3Button && cssHelper.hasClass(context.mass3Button, 'is-disabled')) return false; currentSlider="mass"; currentMassSliderIndex=2; setActiveModeButton(context.mass3Button); resetSlider(); return false; }
    function didClickSpeed(){ if (context.speedButton && cssHelper.hasClass(context.speedButton, 'is-disabled')) return false; currentSlider="speed"; setActiveModeButton(context.speedButton); resetSlider(); return false; }
    function didClickSoftening(){ if (context.softeningButton && cssHelper.hasClass(context.softeningButton, 'is-disabled')) return false; currentSlider="softening"; setActiveModeButton(context.softeningButton); resetSlider(); return false; }

    return {
      setSliderInstance: setSliderInstance,
      getCurrentSlider: getCurrentSlider,
      getCurrentMassSliderIndex: getCurrentMassSliderIndex,
      getCurrentSliderSettings: getCurrentSliderSettings,
      getCurrentSimulationValue: getCurrentSimulationValue,
      bodyNameFromIndex: bodyNameFromIndex,
      updateMassButtonsAppearance: updateMassButtonsAppearance,
      updateLockedButtons: updateLockedButtons,
      switchToFirstUnlockedMass: switchToFirstUnlockedMass,
      attachSliderEditEvents: attachSliderEditEvents,
      didUpdateSlider: didUpdateSlider,
      resetSlider: resetSlider,
      didClickMass1: didClickMass1,
      didClickMass2: didClickMass2,
      didClickMass3: didClickMass3,
      didClickSpeed: didClickSpeed,
      didClickSoftening: didClickSoftening
    };
  }

  return { create: create };
})();
